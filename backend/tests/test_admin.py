"""
Integrationstests for admin panel – routes og services.
Kræver en kørende PostgreSQL-instans (via docker-compose up db).
"""
from __future__ import annotations

from unittest.mock import patch

import pytest

from app.core.database import get_db_cursor
from app.core.security import create_token, hash_password
from app.main import app as flask_app

ADMIN_EMAIL = "test-admin-suite@example.com"
ADMIN_PASSWORD = "test-admin-password-123"


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def app():
    flask_app.config["TESTING"] = True
    yield flask_app


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def admin_id():
    """Opretter en test-admin og returnerer dens UUID."""
    hashed = hash_password(ADMIN_PASSWORD)
    with get_db_cursor() as (_, cur):
        cur.execute(
            """
            INSERT INTO admins (email, password_hash, full_name, is_active)
            VALUES (%s, %s, 'Test Admin', TRUE)
            ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
            RETURNING id
            """,
            (ADMIN_EMAIL, hashed),
        )
        aid = str(cur.fetchone()[0])
    yield aid
    with get_db_cursor() as (_, cur):
        cur.execute("DELETE FROM admins WHERE email = %s", (ADMIN_EMAIL,))


@pytest.fixture()
def admin_token(admin_id):
    return create_token({"sub": admin_id, "role": "admin"})


@pytest.fixture()
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture()
def pending_registration_id(admin_id):
    """Opretter en session + afventende registration og returnerer registrations UUID."""
    with get_db_cursor() as (_, cur):
        cur.execute(
            """
            INSERT INTO registration_sessions (current_step, status, expires_at)
            VALUES (11, 'submitted', NOW() + INTERVAL '14 days')
            RETURNING id
            """,
        )
        session_id = str(cur.fetchone()[0])

        cur.execute(
            """
            INSERT INTO registrations (
                session_id, company_name, cvr_number, contact_name, contact_email,
                employee_count, status, answers
            ) VALUES (
                %s, 'Admin Test A/S', '99887766', 'Test Person', 'admin-test@test.dk',
                25, 'pending',
                '{"membership_type": "Arbejdsgiver", "services": ["overenskomst"]}'::jsonb
            )
            RETURNING id
            """,
            (session_id,),
        )
        rid = str(cur.fetchone()[0])
    yield rid
    with get_db_cursor() as (_, cur):
        cur.execute("DELETE FROM registration_notes WHERE registration_id = %s", (rid,))
        cur.execute("DELETE FROM registrations WHERE id = %s", (rid,))
        cur.execute("DELETE FROM registration_sessions WHERE id = %s", (session_id,))


# ---------------------------------------------------------------------------
# TestAdminAuth – JWT guard (require_admin decorator)
# ---------------------------------------------------------------------------


class TestAdminAuth:
    def test_no_auth_header_returns_401(self, client):
        resp = client.get("/admin/registrations")
        assert resp.status_code == 401

    def test_missing_bearer_prefix_returns_401(self, client):
        resp = client.get(
            "/admin/registrations",
            headers={"Authorization": "Token noget-token"},
        )
        assert resp.status_code == 401

    def test_invalid_token_returns_401(self, client):
        resp = client.get(
            "/admin/registrations",
            headers={"Authorization": "Bearer ugyldig-token"},
        )
        assert resp.status_code == 401

    def test_non_admin_role_returns_403(self, client):
        token = create_token({"sub": "some-user", "role": "user"})
        resp = client.get(
            "/admin/registrations",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 403

    def test_valid_admin_token_passes(self, client, auth_headers):
        resp = client.get("/admin/registrations", headers=auth_headers)
        assert resp.status_code == 200

    def test_expired_token_returns_401(self, client):
        token = create_token({"sub": "admin", "role": "admin"}, expires_in_minutes=-1)
        resp = client.get(
            "/admin/registrations",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# TestAdminLogin – /auth/admin/login
# ---------------------------------------------------------------------------


class TestAdminLogin:
    def test_valid_credentials_returns_token(self, client, admin_id):
        resp = client.post(
            "/auth/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert "token" in data
        assert "admin_id" in data
        assert data["admin_id"] == admin_id

    def test_wrong_password_returns_400(self, client, admin_id):
        resp = client.post(
            "/auth/admin/login",
            json={"email": ADMIN_EMAIL, "password": "forkert"},
        )
        assert resp.status_code == 400

    def test_unknown_email_returns_400(self, client):
        resp = client.post(
            "/auth/admin/login",
            json={"email": "ingen@example.com", "password": "test"},
        )
        assert resp.status_code == 400

    def test_missing_password_returns_400(self, client):
        resp = client.post("/auth/admin/login", json={"email": ADMIN_EMAIL})
        assert resp.status_code == 400

    def test_missing_email_returns_400(self, client):
        resp = client.post("/auth/admin/login", json={"password": ADMIN_PASSWORD})
        assert resp.status_code == 400


# ---------------------------------------------------------------------------
# TestAdminRegistrations – list og get
# ---------------------------------------------------------------------------


class TestAdminRegistrations:
    def test_list_returns_200(self, client, auth_headers, pending_registration_id):
        resp = client.get("/admin/registrations", headers=auth_headers)
        assert resp.status_code == 200
        ids = [r["id"] for r in resp.get_json()]
        assert pending_registration_id in ids

    def test_list_filter_pending(self, client, auth_headers, pending_registration_id):
        resp = client.get("/admin/registrations?status=pending", headers=auth_headers)
        assert resp.status_code == 200
        assert all(r["status"] == "pending" for r in resp.get_json())

    def test_list_invalid_status_returns_400(self, client, auth_headers):
        resp = client.get("/admin/registrations?status=ugyldig", headers=auth_headers)
        assert resp.status_code == 400

    def test_get_returns_correct_data(self, client, auth_headers, pending_registration_id):
        resp = client.get(
            f"/admin/registrations/{pending_registration_id}", headers=auth_headers
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["company_name"] == "Admin Test A/S"
        assert data["cvr_number"] == "99887766"
        assert data["status"] == "pending"

    def test_get_invalid_uuid_returns_404(self, client, auth_headers):
        resp = client.get("/admin/registrations/ikke-et-uuid", headers=auth_headers)
        assert resp.status_code == 404

    def test_get_not_found_returns_404(self, client, auth_headers):
        resp = client.get(
            "/admin/registrations/00000000-0000-0000-0000-000000000000",
            headers=auth_headers,
        )
        assert resp.status_code == 404

    def test_get_documents_returns_empty_list(
        self, client, auth_headers, pending_registration_id
    ):
        resp = client.get(
            f"/admin/registrations/{pending_registration_id}/documents",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.get_json() == []

    def test_get_documents_invalid_uuid_returns_404(self, client, auth_headers):
        resp = client.get(
            "/admin/registrations/ikke-et-uuid/documents", headers=auth_headers
        )
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# TestAdminApproveReject
# ---------------------------------------------------------------------------


class TestAdminApproveReject:
    def test_approve_pending_registration(
        self, client, auth_headers, pending_registration_id
    ):
        with patch("app.services.email_invoice.send_invoice_email_background"):
            resp = client.post(
                f"/admin/registrations/{pending_registration_id}/approve",
                headers=auth_headers,
            )
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "approved"

    def test_approve_already_approved_returns_400(
        self, client, auth_headers, pending_registration_id
    ):
        with patch("app.services.email_invoice.send_invoice_email_background"):
            client.post(
                f"/admin/registrations/{pending_registration_id}/approve",
                headers=auth_headers,
            )
            resp = client.post(
                f"/admin/registrations/{pending_registration_id}/approve",
                headers=auth_headers,
            )
        assert resp.status_code == 400

    def test_approve_invalid_uuid_returns_404(self, client, auth_headers):
        resp = client.post(
            "/admin/registrations/ikke-et-uuid/approve", headers=auth_headers
        )
        assert resp.status_code == 404

    def test_approve_not_found_returns_404(self, client, auth_headers):
        resp = client.post(
            "/admin/registrations/00000000-0000-0000-0000-000000000000/approve",
            headers=auth_headers,
        )
        assert resp.status_code == 404

    def test_reject_pending_registration(
        self, client, auth_headers, pending_registration_id
    ):
        with patch("app.services.email_rejection.send_rejection_email_background"):
            resp = client.post(
                f"/admin/registrations/{pending_registration_id}/reject",
                headers=auth_headers,
                json={"notes": "Opfylder ikke krav til DI-medlemskab"},
            )
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "rejected"

    def test_reject_missing_notes_returns_400(
        self, client, auth_headers, pending_registration_id
    ):
        resp = client.post(
            f"/admin/registrations/{pending_registration_id}/reject",
            headers=auth_headers,
            json={},
        )
        assert resp.status_code == 400

    def test_reject_invalid_uuid_returns_404(self, client, auth_headers):
        resp = client.post(
            "/admin/registrations/ikke-et-uuid/reject",
            headers=auth_headers,
            json={"notes": "Begrundelse"},
        )
        assert resp.status_code == 404

    def test_reject_not_found_returns_404(self, client, auth_headers):
        resp = client.post(
            "/admin/registrations/00000000-0000-0000-0000-000000000000/reject",
            headers=auth_headers,
            json={"notes": "Begrundelse"},
        )
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# TestAdminNotes
# ---------------------------------------------------------------------------


class TestAdminNotes:
    def test_add_note_returns_201(self, client, auth_headers, pending_registration_id):
        resp = client.post(
            f"/admin/registrations/{pending_registration_id}/notes",
            headers=auth_headers,
            json={"content": "Kontakt virksomheden for yderligere info"},
        )
        assert resp.status_code == 201
        assert resp.get_json()["content"] == "Kontakt virksomheden for yderligere info"

    def test_add_note_empty_content_returns_400(
        self, client, auth_headers, pending_registration_id
    ):
        resp = client.post(
            f"/admin/registrations/{pending_registration_id}/notes",
            headers=auth_headers,
            json={"content": "   "},
        )
        assert resp.status_code == 400

    def test_add_note_missing_content_returns_400(
        self, client, auth_headers, pending_registration_id
    ):
        resp = client.post(
            f"/admin/registrations/{pending_registration_id}/notes",
            headers=auth_headers,
            json={},
        )
        assert resp.status_code == 400

    def test_get_notes_returns_added_notes(
        self, client, auth_headers, pending_registration_id
    ):
        client.post(
            f"/admin/registrations/{pending_registration_id}/notes",
            headers=auth_headers,
            json={"content": "Første note"},
        )
        resp = client.get(
            f"/admin/registrations/{pending_registration_id}/notes",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        notes = resp.get_json()
        assert isinstance(notes, list)
        assert any(n["content"] == "Første note" for n in notes)

    def test_add_note_invalid_uuid_returns_404(self, client, auth_headers):
        resp = client.post(
            "/admin/registrations/ikke-et-uuid/notes",
            headers=auth_headers,
            json={"content": "Note"},
        )
        assert resp.status_code == 404

    def test_get_notes_invalid_uuid_returns_404(self, client, auth_headers):
        resp = client.get(
            "/admin/registrations/ikke-et-uuid/notes",
            headers=auth_headers,
        )
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# TestAdminStats
# ---------------------------------------------------------------------------


class TestAdminStats:
    def test_stats_returns_all_keys(self, client, auth_headers, pending_registration_id):
        resp = client.get("/admin/stats", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.get_json()
        assert "total" in data
        assert "pending" in data
        assert "approved" in data
        assert "rejected" in data

    def test_stats_counts_pending(self, client, auth_headers, pending_registration_id):
        resp = client.get("/admin/stats", headers=auth_headers)
        data = resp.get_json()
        assert data["total"] >= 1
        assert data["pending"] >= 1


# ---------------------------------------------------------------------------
# TestAdminSessions
# ---------------------------------------------------------------------------


class TestAdminSessions:
    def test_list_sessions_returns_200(self, client, auth_headers):
        resp = client.get("/admin/sessions", headers=auth_headers)
        assert resp.status_code == 200
        assert isinstance(resp.get_json(), list)

    def test_get_session_invalid_uuid_returns_404(self, client, auth_headers):
        resp = client.get("/admin/sessions/ikke-et-uuid", headers=auth_headers)
        assert resp.status_code == 404

    def test_get_session_not_found_returns_404(self, client, auth_headers):
        resp = client.get(
            "/admin/sessions/00000000-0000-0000-0000-000000000000",
            headers=auth_headers,
        )
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# TestAdminActivity
# ---------------------------------------------------------------------------


class TestAdminActivity:
    def test_activity_returns_list(self, client, auth_headers, pending_registration_id):
        resp = client.get("/admin/activity", headers=auth_headers)
        assert resp.status_code == 200
        assert isinstance(resp.get_json(), list)

    def test_activity_includes_submitted_registration(
        self, client, auth_headers, pending_registration_id
    ):
        resp = client.get("/admin/activity", headers=auth_headers)
        entries = resp.get_json()
        reg_ids = [e.get("registration_id") for e in entries]
        assert pending_registration_id in reg_ids
