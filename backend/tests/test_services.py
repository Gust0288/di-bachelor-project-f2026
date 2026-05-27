"""
Unit og integrationstests for services og core modules.

Unit tests (ingen DB):
  - TestSecurity       – password hashing og JWT
  - TestBranchMapping  – CVR branchekode-mapping
  - TestCvrService     – CVR API-kald (httpx mockes)
  - TestEmailServices  – e-mail afsendelse (httpx/aiosmtplib mockes)

Integrationstests (kræver PostgreSQL):
  - TestAuthService    – OTP-flow via HTTP-endpoints
"""

from __future__ import annotations

import asyncio
import json
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.database import get_db_cursor
from app.core.security import (
    create_token,
    hash_password,
    verify_password,
    verify_token,
)
from app.main import app as flask_app
from app.services.branch_mapping import DI_BRANCH_COMMUNITIES, get_suggestions
from app.services.cvr import lookup_company
from app.services.email_confirmation import send_registration_confirmation
from app.services.email_verification import send_verification_email

TEST_EMAIL = "test-services@example.com"


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


@pytest.fixture(autouse=True)
def cleanup_db():
    """Sletter login_otps og sessions oprettet under testen."""
    try:
        with get_db_cursor() as (_, cur):
            cur.execute("SELECT id FROM registration_sessions")
            existing_ids = {str(r[0]) for r in cur.fetchall()}
    except Exception:
        yield
        return

    yield

    try:
        with get_db_cursor() as (_, cur):
            cur.execute("DELETE FROM login_otps WHERE email = %s", (TEST_EMAIL,))
            cur.execute("SELECT id FROM registration_sessions")
            all_ids = {str(r[0]) for r in cur.fetchall()}
            new_ids = list(all_ids - existing_ids)
            if new_ids:
                cur.execute(
                    "DELETE FROM registration_sessions WHERE id = ANY(%s::uuid[])",
                    (new_ids,),
                )
    except Exception:
        pass


# ---------------------------------------------------------------------------
# TestSecurity – unit tests, ingen DB
# ---------------------------------------------------------------------------


class TestSecurity:
    def test_hash_password_not_plaintext(self):
        hashed = hash_password("hemmelig123")
        assert hashed != "hemmelig123"
        assert hashed.startswith("$2")  # bcrypt-format

    def test_verify_password_correct(self):
        hashed = hash_password("korrekt")
        assert verify_password("korrekt", hashed) is True

    def test_verify_password_wrong(self):
        hashed = hash_password("korrekt")
        assert verify_password("forkert", hashed) is False

    def test_create_token_contains_sub(self):
        token = create_token({"sub": "bruger-123"})
        payload = verify_token(token)
        assert payload["sub"] == "bruger-123"

    def test_create_token_custom_claim(self):
        token = create_token({"sub": "a", "role": "admin"})
        payload = verify_token(token)
        assert payload["role"] == "admin"

    def test_verify_token_expired(self):
        token = create_token({"sub": "x"}, expires_in_minutes=-1)
        with pytest.raises(ValueError, match="udløbet"):
            verify_token(token)

    def test_verify_token_invalid_signature(self):
        import jwt as pyjwt

        token = pyjwt.encode({"sub": "x"}, "forkert-nøgle", algorithm="HS256")
        with pytest.raises(ValueError, match="Ugyldigt"):
            verify_token(token)


# ---------------------------------------------------------------------------
# TestBranchMapping – unit tests, ingen DB
# ---------------------------------------------------------------------------


class TestBranchMapping:
    def test_known_code_maps_correctly(self):
        result = get_suggestions(["620100"])
        assert "di-digital" in result["mandatory"]

    def test_unknown_code_uses_default(self):
        result = get_suggestions(["999999"])
        assert "di-produktion" in result["mandatory"]

    def test_optional_does_not_overlap_with_mandatory(self):
        # Kode "21" → lifescience mandatory, biosolutions optional
        result = get_suggestions(["210000"])
        assert set(result["mandatory"]).isdisjoint(set(result["suggested"]))

    def test_multiple_codes_merged(self):
        result = get_suggestions(["620100", "350000"])  # digital + energi
        assert "di-digital" in result["mandatory"]
        assert "di-energi" in result["mandatory"]

    def test_all_contains_full_list(self):
        result = get_suggestions(["620100"])
        assert result["all"] == DI_BRANCH_COMMUNITIES

    def test_empty_codes_gives_empty_suggestions(self):
        result = get_suggestions([])
        assert result["mandatory"] == []
        assert result["suggested"] == []


# ---------------------------------------------------------------------------
# TestCvrService – unit tests med mocket httpx
# ---------------------------------------------------------------------------


class TestCvrService:
    def test_mock_mode_returns_test_data(self):
        with patch("app.services.cvr.get_settings") as mock_settings:
            mock_settings.return_value.cvr_mock = True
            result = lookup_company("12345678", "vat")
        assert result["navn"] == "Test Virksomhed ApS"
        assert result["cvr"] == "12345678"

    def test_real_mode_success(self):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = ""
        mock_response.json.return_value = {
            "name": "Testfirma A/S",
            "vat": "87654321",
            "companydesc": "Aktieselskab",
            "address": "Testvej 2",
            "zipcode": "8000",
            "city": "Aarhus",
            "industrycode": "620100",
            "industrydesc": "Computerprogrammering",
        }

        with patch("app.services.cvr.get_settings") as mock_settings, patch(
            "httpx.Client"
        ) as mock_client_cls:
            mock_settings.return_value.cvr_mock = False
            mock_settings.return_value.cvr_api_key = ""
            mock_settings.return_value.cvr_contact_email = "test@di.dk"
            mock_settings.return_value.virkdata_api_key = ""
            mock_client_cls.return_value.__enter__.return_value.get.return_value = (
                mock_response
            )
            result = lookup_company("87654321", "vat")

        assert result["navn"] == "Testfirma A/S"
        assert result["by"] == "Aarhus"
        assert result["branchekode"] == "620100"

    def test_real_mode_api_error(self):
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_response.text = ""
        mock_response.json.return_value = {"error": "not found"}

        with patch("app.services.cvr.get_settings") as mock_settings, patch(
            "httpx.Client"
        ) as mock_client_cls:
            mock_settings.return_value.cvr_mock = False
            mock_settings.return_value.cvr_api_key = ""
            mock_settings.return_value.cvr_contact_email = "test@di.dk"
            mock_settings.return_value.virkdata_api_key = ""
            mock_client_cls.return_value.__enter__.return_value.get.return_value = (
                mock_response
            )
            with pytest.raises(ValueError, match="not found"):
                lookup_company("00000000", "vat")

    def test_real_mode_timeout_raises(self):
        import httpx as httpx_lib

        with patch("app.services.cvr.get_settings") as mock_settings, patch(
            "httpx.Client"
        ) as mock_client_cls:
            mock_settings.return_value.cvr_mock = False
            mock_settings.return_value.cvr_api_key = ""
            mock_settings.return_value.cvr_contact_email = "test@di.dk"
            mock_settings.return_value.virkdata_api_key = ""
            mock_client_cls.return_value.__enter__.return_value.get.side_effect = (
                httpx_lib.TimeoutException("timeout")
            )
            with pytest.raises(httpx_lib.TimeoutException):
                lookup_company("12345678", "vat")

    def test_virkdata_success(self):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = ""
        mock_response.json.return_value = {
            "name": "Virkdata Firma A/S",
            "vat": "11223344",
            "companydesc": "Aktieselskab",
            "address": "Virkdatavej 5",
            "zipcode": "2100",
            "city": "København Ø",
            "industrycode": "620100",
            "industrydesc": "Computerprogrammering",
        }

        with patch("app.services.cvr.get_settings") as mock_settings, patch(
            "httpx.Client"
        ) as mock_client_cls:
            mock_settings.return_value.cvr_mock = False
            mock_settings.return_value.virkdata_api_key = "test-virkdata-key"
            mock_get = mock_client_cls.return_value.__enter__.return_value.get
            mock_get.return_value = mock_response
            result = lookup_company("11223344", "vat")

        call_kwargs = mock_get.call_args
        assert call_kwargs[0][0] == "https://virkdata.dk/api/"
        assert call_kwargs[1]["headers"]["Authorization"] == "test-virkdata-key"
        assert call_kwargs[1]["params"]["search"] == "11223344"
        assert result["navn"] == "Virkdata Firma A/S"
        assert result["by"] == "København Ø"

    def test_virkdata_not_found(self):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = ""
        mock_response.json.return_value = {
            "error_code": 3002,
            "response": "no_results",
            "message": "No results found",
        }

        with patch("app.services.cvr.get_settings") as mock_settings, patch(
            "httpx.Client"
        ) as mock_client_cls:
            mock_settings.return_value.cvr_mock = False
            mock_settings.return_value.virkdata_api_key = "test-virkdata-key"
            mock_client_cls.return_value.__enter__.return_value.get.return_value = (
                mock_response
            )
            with pytest.raises(ValueError, match="NOT_FOUND"):
                lookup_company("00000000", "vat")

    def test_virkdata_api_error(self):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = ""
        mock_response.json.return_value = {
            "error_code": 1001,
            "response": "invalid_api_key",
            "message": "Invalid API key",
        }

        with patch("app.services.cvr.get_settings") as mock_settings, patch(
            "httpx.Client"
        ) as mock_client_cls:
            mock_settings.return_value.cvr_mock = False
            mock_settings.return_value.virkdata_api_key = "bad-key"
            mock_client_cls.return_value.__enter__.return_value.get.return_value = (
                mock_response
            )
            with pytest.raises(ValueError, match="invalid_api_key"):
                lookup_company("12345678", "vat")


# ---------------------------------------------------------------------------
# TestEmailServices – unit tests med mocket httpx
# ---------------------------------------------------------------------------


class TestEmailServices:
    def _make_async_http_mock(self):
        """Returnerer (mock_ctx, mock_client_cls) til brug med `patch('httpx.AsyncClient')`."""
        mock_response = AsyncMock()
        mock_response.raise_for_status = MagicMock()
        mock_ctx = AsyncMock()
        mock_ctx.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
        return mock_ctx

    def test_verification_email_via_resend(self):
        mock_ctx = self._make_async_http_mock()

        with patch(
            "app.services.email_verification.get_settings"
        ) as mock_settings, patch("httpx.AsyncClient", return_value=mock_ctx):
            mock_settings.return_value.resend_api_key = "test-key"
            mock_settings.return_value.email_from = "noreply@di.dk"
            mock_settings.return_value.smtp_user = ""
            mock_settings.return_value.smtp_password = ""
            asyncio.run(send_verification_email(TEST_EMAIL, "123456"))

        mock_ctx.__aenter__.return_value.post.assert_called_once()
        payload = mock_ctx.__aenter__.return_value.post.call_args.kwargs["json"]
        assert "123456" in payload["text"]
        assert TEST_EMAIL in payload["to"]

    def test_verification_email_via_smtp(self):
        with patch(
            "app.services.email_verification.get_settings"
        ) as mock_settings, patch("aiosmtplib.send", new_callable=AsyncMock):
            mock_settings.return_value.resend_api_key = ""
            mock_settings.return_value.smtp_user = "user@di.dk"
            mock_settings.return_value.smtp_password = "hemmeligt"
            mock_settings.return_value.smtp_host = "smtp.di.dk"
            mock_settings.return_value.smtp_port = 587
            mock_settings.return_value.email_from = ""
            asyncio.run(send_verification_email(TEST_EMAIL, "777777"))

    def test_verification_email_no_config_logs_warning(self, caplog):
        import logging

        with patch("app.services.email_verification.get_settings") as mock_settings:
            mock_settings.return_value.resend_api_key = ""
            mock_settings.return_value.smtp_user = ""
            mock_settings.return_value.smtp_password = ""
            with caplog.at_level(logging.WARNING):
                asyncio.run(send_verification_email(TEST_EMAIL, "999999"))

        assert "999999" in caplog.text

    def test_confirmation_email_via_resend(self):
        mock_ctx = self._make_async_http_mock()

        with patch(
            "app.services.email_confirmation.get_settings"
        ) as mock_settings, patch("httpx.AsyncClient", return_value=mock_ctx):
            mock_settings.return_value.resend_api_key = "test-key"
            mock_settings.return_value.email_from = "noreply@di.dk"
            mock_settings.return_value.smtp_user = ""
            mock_settings.return_value.smtp_password = ""
            asyncio.run(
                send_registration_confirmation(
                    TEST_EMAIL, "Jens Jensen", "Testfirma A/S", "12345678", "reg-001"
                )
            )

        mock_ctx.__aenter__.return_value.post.assert_called_once()

    def test_confirmation_email_no_config_logs_warning(self, caplog):
        import logging

        with patch("app.services.email_confirmation.get_settings") as mock_settings:
            mock_settings.return_value.resend_api_key = ""
            mock_settings.return_value.smtp_user = ""
            mock_settings.return_value.smtp_password = ""
            with caplog.at_level(logging.WARNING):
                asyncio.run(
                    send_registration_confirmation(
                        TEST_EMAIL, "Jens Jensen", "Testfirma A/S", None, "reg-002"
                    )
                )

        assert "reg-002" in caplog.text


# ---------------------------------------------------------------------------
# TestAuthService – integrationstests, kræver PostgreSQL
# ---------------------------------------------------------------------------


class TestAuthService:
    def _create_session(self, email: str) -> str:
        """Indsætter en draft-session med kontaktemail i step_data."""
        step_data = json.dumps({"1": {"contact_email": email}})
        with get_db_cursor() as (_, cur):
            cur.execute(
                """
                INSERT INTO registration_sessions (step_data, current_step, status, expires_at)
                VALUES (%s::jsonb, 1, 'draft', NOW() + INTERVAL '1 week')
                RETURNING id
                """,
                (step_data,),
            )
            return str(cur.fetchone()[0])

    def _insert_otp(
        self, email: str, code: str, expires_at: datetime, used: bool = False
    ):
        with get_db_cursor() as (_, cur):
            cur.execute(
                "INSERT INTO login_otps (email, code, expires_at, used) VALUES (%s, %s, %s, %s)",
                (email, code, expires_at, used),
            )

    def test_send_otp_creates_db_record(self, client):
        self._create_session(TEST_EMAIL)

        with patch("app.services.auth.send_verification_email", new_callable=AsyncMock):
            resp = client.post("/auth/otp/send", json={"email": TEST_EMAIL})

        assert resp.status_code == 200
        with get_db_cursor(dict_rows=True) as (_, cur):
            cur.execute(
                "SELECT code, used FROM login_otps WHERE email = %s ORDER BY created_at DESC LIMIT 1",
                (TEST_EMAIL,),
            )
            row = cur.fetchone()
        assert row is not None
        assert len(row["code"]) == 6
        assert row["used"] is False

    def test_send_otp_no_session_returns_400(self, client):
        with patch("app.services.auth.send_verification_email", new_callable=AsyncMock):
            resp = client.post(
                "/auth/otp/send", json={"email": "ingen-session@example.com"}
            )
        assert resp.status_code == 400

    def test_send_otp_missing_email_returns_400(self, client):
        resp = client.post("/auth/otp/send", json={})
        assert resp.status_code == 400

    def test_verify_otp_correct_returns_session_id(self, client):
        session_id = self._create_session(TEST_EMAIL)
        expires = datetime.now(timezone.utc) + timedelta(minutes=10)
        self._insert_otp(TEST_EMAIL, "654321", expires)

        resp = client.post(
            "/auth/otp/verify", json={"email": TEST_EMAIL, "code": "654321"}
        )

        assert resp.status_code == 200
        assert resp.get_json()["session_id"] == session_id

    def test_verify_otp_wrong_code_returns_400(self, client):
        self._create_session(TEST_EMAIL)
        expires = datetime.now(timezone.utc) + timedelta(minutes=10)
        self._insert_otp(TEST_EMAIL, "111111", expires)

        resp = client.post(
            "/auth/otp/verify", json={"email": TEST_EMAIL, "code": "999999"}
        )
        assert resp.status_code == 400

    def test_verify_otp_expired_returns_400(self, client):
        self._create_session(TEST_EMAIL)
        expires = datetime.now(timezone.utc) - timedelta(minutes=1)
        self._insert_otp(TEST_EMAIL, "222222", expires)

        resp = client.post(
            "/auth/otp/verify", json={"email": TEST_EMAIL, "code": "222222"}
        )
        assert resp.status_code == 400
        assert "udløbet" in resp.get_json()["error"].lower()

    def test_verify_otp_already_used_returns_400(self, client):
        self._create_session(TEST_EMAIL)
        expires = datetime.now(timezone.utc) + timedelta(minutes=10)
        self._insert_otp(TEST_EMAIL, "333333", expires, used=True)

        resp = client.post(
            "/auth/otp/verify", json={"email": TEST_EMAIL, "code": "333333"}
        )
        assert resp.status_code == 400

    def test_verify_otp_missing_fields_returns_400(self, client):
        resp = client.post("/auth/otp/verify", json={"email": TEST_EMAIL})
        assert resp.status_code == 400


# ---------------------------------------------------------------------------
# TestCvrEndpoint – integrationstests via HTTP-klient med mocket service
# ---------------------------------------------------------------------------


class TestCvrEndpoint:
    def test_lookup_by_vat_success(self, client):
        mock_result = {"navn": "Testfirma", "cvr": "12345678"}
        with patch("app.api.routes.cvr.lookup_company", return_value=mock_result):
            resp = client.get("/cvr/lookup?vat=12345678")
        assert resp.status_code == 200
        assert resp.get_json()["cvr"] == "12345678"

    def test_lookup_by_name_success(self, client):
        mock_result = {"navn": "Testfirma", "cvr": "12345678"}
        with patch("app.api.routes.cvr.lookup_company", return_value=mock_result):
            resp = client.get("/cvr/lookup?name=Testfirma")
        assert resp.status_code == 200

    def test_lookup_missing_params_returns_400(self, client):
        resp = client.get("/cvr/lookup")
        assert resp.status_code == 400

    def test_lookup_not_found_returns_404(self, client):
        with patch(
            "app.api.routes.cvr.lookup_company", side_effect=ValueError("NOT_FOUND")
        ):
            resp = client.get("/cvr/lookup?vat=00000000")
        assert resp.status_code == 404

    def test_lookup_upstream_error_returns_502(self, client):
        with patch(
            "app.api.routes.cvr.lookup_company",
            side_effect=ValueError("upstream fejl"),
        ):
            resp = client.get("/cvr/lookup?vat=12345678")
        assert resp.status_code == 502
