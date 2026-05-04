"""
Integration tests for the wizard flow.
Kræver en kørende PostgreSQL-instans (via docker-compose up db).
Kør med: cd backend && pytest tests/test_wizard_flow.py -v
"""

import pytest

from app.core.database import get_db_cursor
from app.main import app as flask_app
from app.services.membership import calculate_membership, compute_tier

# ---------------------------------------------------------------------------
# Flask test client fixture
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
    """
    Sletter kun sessions oprettet UNDER testen – rører ikke eksisterende dev-data.
    Springer over hvis DB ikke er tilgængelig (unit-tests kræver ikke DB).
    """
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
            cur.execute("SELECT id FROM registration_sessions")
            all_ids = {str(r[0]) for r in cur.fetchall()}
            new_ids = list(all_ids - existing_ids)
            if new_ids:
                cur.execute(
                    "DELETE FROM uploaded_documents WHERE session_id = ANY(%s::uuid[])",
                    (new_ids,),
                )
                cur.execute(
                    "DELETE FROM registrations WHERE session_id = ANY(%s::uuid[])",
                    (new_ids,),
                )
                cur.execute(
                    "DELETE FROM registration_sessions WHERE id = ANY(%s::uuid[])",
                    (new_ids,),
                )
    except Exception:
        pass


# ---------------------------------------------------------------------------
# Unit tests – membership beregning (ingen DB)
# ---------------------------------------------------------------------------


class TestComputeTier:
    def test_mikro(self):
        assert compute_tier(1) == "mikro"
        assert compute_tier(9) == "mikro"

    def test_smv(self):
        assert compute_tier(10) == "smv"
        assert compute_tier(49) == "smv"

    def test_erhverv(self):
        assert compute_tier(50) == "erhverv"
        assert compute_tier(500) == "erhverv"


class TestCalculateMembership:
    def test_mikro_always_associeret(self):
        assert calculate_membership("mikro", {}, [], []) == "Associeret"
        assert (
            calculate_membership(
                "mikro", {"established_ag": True}, ["di-byggeri"], ["overenskomst"]
            )
            == "Associeret"
        )

    def test_smv_with_agreement_is_arbejdsgiver(self):
        assert (
            calculate_membership("smv", {"established_ag": True}, [], [])
            == "Arbejdsgiver"
        )

    def test_smv_without_agreement_is_associeret(self):
        assert calculate_membership("smv", {"non_ovk": True}, [], []) == "Associeret"
        assert calculate_membership("smv", {}, [], []) == "Associeret"

    def test_smv_overenskomst_service_lifts_to_arbejdsgiver(self):
        assert (
            calculate_membership("smv", {"non_ovk": True}, [], ["overenskomst"])
            == "Arbejdsgiver"
        )

    def test_smv_personalejuridisk_lifts_to_arbejdsgiver(self):
        assert (
            calculate_membership("smv", {}, [], ["personalejuridisk_raadgivning"])
            == "Arbejdsgiver"
        )

    def test_smv_erhvervsjuridisk_lifts_to_arbejdsgiver(self):
        assert (
            calculate_membership("smv", {}, [], ["erhvervsjuridisk_raadgivning"])
            == "Arbejdsgiver"
        )

    def test_erhverv_with_branch_is_branchemedlem(self):
        assert (
            calculate_membership("erhverv", {}, ["di-byggeri"], []) == "Branchemedlem"
        )

    def test_erhverv_without_branch_is_erhvervsmedlem(self):
        assert calculate_membership("erhverv", {}, [], []) == "Erhvervsmedlem"

    def test_di_byggeri_sektion_service_counts_as_branch(self):
        assert (
            calculate_membership("erhverv", {}, [], ["di_byggeri_sektion"])
            == "Branchemedlem"
        )

    def test_byggegaranti_service_adds_di_byggeri(self):
        assert (
            calculate_membership("erhverv", {}, [], ["byggegaranti"]) == "Branchemedlem"
        )

    def test_di_byggeri_sektion_does_not_affect_mikro(self):
        assert (
            calculate_membership("mikro", {}, [], ["di_byggeri_sektion"])
            == "Associeret"
        )

    def test_byggegaranti_does_not_affect_mikro(self):
        assert calculate_membership("mikro", {}, [], ["byggegaranti"]) == "Associeret"


# ---------------------------------------------------------------------------
# Integration tests – API endpoints (kræver DB)
# ---------------------------------------------------------------------------


class TestFlowEndpoint:
    def test_get_flow_returns_11_steps(self, client):
        resp = client.get("/registration/flow")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["version"] == "1.0"
        assert data["total_steps"] == 11
        assert len(data["steps"]) == 11

    def test_step_ids_are_correct(self, client):
        resp = client.get("/registration/flow")
        steps = resp.get_json()["steps"]
        ids = [s["step_id"] for s in steps]
        assert "virksomhedsinformation" in ids
        assert "overenskomst" in ids
        assert "bekraeftelse" in ids


class TestSessionLifecycle:
    def test_create_session(self, client):
        resp = client.post("/registration/session")
        assert resp.status_code == 201
        data = resp.get_json()
        assert "session_id" in data
        assert data["current_step"] == 1

    def test_get_session_not_found(self, client):
        resp = client.get("/registration/session/00000000-0000-0000-0000-000000000000")
        assert resp.status_code == 404

    def test_get_session_after_create(self, client):
        session_id = client.post("/registration/session").get_json()["session_id"]
        resp = client.get(f"/registration/session/{session_id}")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["session_id"] == session_id
        assert data["current_step"] == 1
        assert data["flags"] == {}
        assert data["tier"] is None


class TestStepSave:
    def _new_session(self, client) -> str:
        return client.post("/registration/session").get_json()["session_id"]

    def test_step1_advances_to_step2(self, client):
        sid = self._new_session(client)
        resp = client.post(
            f"/registration/session/{sid}/step/1",
            json={
                "cvr_number": "12345678",
                "company_name": "Test A/S",
                "contact_name": "Test Person",
                "contact_email": "test@test.dk",
            },
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["is_blocked"] is False
        assert data["current_step"] == 2

    def test_step1_invalid_cvr_returns_422(self, client):
        sid = self._new_session(client)
        resp = client.post(
            f"/registration/session/{sid}/step/1",
            json={
                "cvr_number": "abc",
                "company_name": "Test",
                "contact_name": "Test",
                "contact_email": "test@test.dk",
            },
        )
        assert resp.status_code == 422

    def test_step4_sets_tier_mikro(self, client):
        sid = self._new_session(client)
        # Gem step 1 og 2 hurtigt
        client.post(
            f"/registration/session/{sid}/step/1",
            json={
                "cvr_number": "12345678",
                "company_name": "Test A/S",
                "contact_name": "Test",
                "contact_email": "t@t.dk",
            },
        )
        client.post(f"/registration/session/{sid}/step/2", json={"cvr_confirmed": True})
        client.post(
            f"/registration/session/{sid}/step/3",
            json={"selected_services": ["overenskomst"]},
        )
        resp = client.post(
            f"/registration/session/{sid}/step/4", json={"employee_count": 5, "no_employees": False, "employee_types": ["funktionaer"], "total_loensum": 2000000}
        )
        assert resp.status_code == 200
        assert resp.get_json()["tier"] == "mikro"

    def test_step4_sets_tier_smv(self, client):
        sid = self._new_session(client)
        client.post(
            f"/registration/session/{sid}/step/1",
            json={
                "cvr_number": "12345678",
                "company_name": "Test A/S",
                "contact_name": "Test",
                "contact_email": "t@t.dk",
            },
        )
        client.post(f"/registration/session/{sid}/step/2", json={"cvr_confirmed": True})
        client.post(
            f"/registration/session/{sid}/step/3",
            json={"selected_services": ["overenskomst"]},
        )
        resp = client.post(
            f"/registration/session/{sid}/step/4", json={"employee_count": 25, "no_employees": False, "employee_types": ["funktionaer"], "total_loensum": 10000000}
        )
        assert resp.get_json()["tier"] == "smv"

    def test_step4_sets_tier_erhverv(self, client):
        sid = self._new_session(client)
        client.post(
            f"/registration/session/{sid}/step/1",
            json={
                "cvr_number": "12345678",
                "company_name": "Test A/S",
                "contact_name": "Test",
                "contact_email": "t@t.dk",
            },
        )
        client.post(f"/registration/session/{sid}/step/2", json={"cvr_confirmed": True})
        client.post(
            f"/registration/session/{sid}/step/3",
            json={"selected_services": ["overenskomst"]},
        )
        resp = client.post(
            f"/registration/session/{sid}/step/4", json={"employee_count": 100, "no_employees": False, "employee_types": ["funktionaer", "timeloennet"], "total_loensum": 40000000}
        )
        assert resp.get_json()["tier"] == "erhverv"


class TestBlockingOptions:
    def _session_at_step5(self, client) -> str:
        sid = client.post("/registration/session").get_json()["session_id"]
        client.post(
            f"/registration/session/{sid}/step/1",
            json={
                "cvr_number": "12345678",
                "company_name": "Test A/S",
                "contact_name": "Test",
                "contact_email": "t@t.dk",
            },
        )
        client.post(f"/registration/session/{sid}/step/2", json={"cvr_confirmed": True})
        client.post(
            f"/registration/session/{sid}/step/3",
            json={"selected_services": ["overenskomst"]},
        )
        client.post(f"/registration/session/{sid}/step/4", json={"employee_count": 25, "no_employees": False, "employee_types": ["funktionaer"], "total_loensum": 10000000})
        return sid

    def test_ved_ikke_is_blocked(self, client):
        sid = self._session_at_step5(client)
        resp = client.post(
            f"/registration/session/{sid}/step/5",
            json={
                "overenskomst_status": "ved_ikke",
            },
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["is_blocked"] is True
        assert data["blocking_popup"] is not None
        assert data["current_step"] == 5  # step rykker ikke frem

    def test_anden_overenskomsttype_is_blocked(self, client):
        sid = self._session_at_step5(client)
        resp = client.post(
            f"/registration/session/{sid}/step/5",
            json={
                "overenskomst_status": "ja",
                "overenskomst_type": "anden",
            },
        )
        data = resp.get_json()
        assert data["is_blocked"] is True
        assert data["current_step"] == 5

    def test_nej_is_not_blocked_and_sets_flag(self, client):
        sid = self._session_at_step5(client)
        resp = client.post(
            f"/registration/session/{sid}/step/5",
            json={
                "overenskomst_status": "nej",
            },
        )
        data = resp.get_json()
        assert data["is_blocked"] is False
        assert data["flags"].get("non_ovk") is True
        assert data["current_step"] == 6

    def test_ja_direkte_sets_established_ag(self, client):
        sid = self._session_at_step5(client)
        resp = client.post(
            f"/registration/session/{sid}/step/5",
            json={
                "overenskomst_status": "ja",
                "overenskomst_type": "direkte",
                "document_id": "550e8400-e29b-41d4-a716-446655440000",  # simuleret upload
            },
        )
        data = resp.get_json()
        assert data["is_blocked"] is False
        assert data["flags"].get("established_ag") is True

    def test_ja_direkte_without_document_returns_422(self, client):
        sid = self._session_at_step5(client)
        resp = client.post(
            f"/registration/session/{sid}/step/5",
            json={
                "overenskomst_status": "ja",
                "overenskomst_type": "direkte",
                # mangler document_id
            },
        )
        assert resp.status_code == 422


class TestMembershipCalculation:
    def _run_through_step6(
        self,
        client,
        employee_count: int,
        overenskomst_status: str,
        overenskomst_type: str | None,
        branches: list[str],
        document_id: str | None = None,
    ) -> dict:
        sid = client.post("/registration/session").get_json()["session_id"]
        client.post(
            f"/registration/session/{sid}/step/1",
            json={
                "cvr_number": "12345678",
                "company_name": "Test A/S",
                "contact_name": "Test",
                "contact_email": "t@t.dk",
            },
        )
        client.post(f"/registration/session/{sid}/step/2", json={"cvr_confirmed": True})
        client.post(
            f"/registration/session/{sid}/step/3",
            json={"selected_services": ["overenskomst"]},
        )
        client.post(
            f"/registration/session/{sid}/step/4",
            json={"employee_count": employee_count, "no_employees": employee_count == 0, "employee_types": ["funktionaer"], "total_loensum": employee_count * 400000},
        )
        step5_data: dict = {"overenskomst_status": overenskomst_status}
        if overenskomst_type:
            step5_data["overenskomst_type"] = overenskomst_type
        if document_id:
            step5_data["document_id"] = document_id
        client.post(f"/registration/session/{sid}/step/5", json=step5_data)
        resp = client.post(
            f"/registration/session/{sid}/step/6",
            json={
                "branchefaellesskaber": branches,
            },
        )
        return resp.get_json()

    def test_mikro_is_associeret(self, client):
        data = self._run_through_step6(client, 5, "nej", None, [])
        session = client.get(f"/registration/session/{data['session_id']}").get_json()
        assert session["step_data"]["7"]["computed_membership"] == "Associeret"

    def test_smv_with_agreement_is_arbejdsgiver(self, client):
        data = self._run_through_step6(
            client,
            25,
            "ja",
            "direkte",
            [],
            document_id="550e8400-e29b-41d4-a716-446655440000",
        )
        session = client.get(f"/registration/session/{data['session_id']}").get_json()
        assert session["step_data"]["7"]["computed_membership"] == "Arbejdsgiver"

    def test_erhverv_with_branch_is_branchemedlem(self, client):
        data = self._run_through_step6(client, 100, "nej", None, ["di-byggeri"])
        session = client.get(f"/registration/session/{data['session_id']}").get_json()
        assert session["step_data"]["7"]["computed_membership"] == "Branchemedlem"

    def test_erhverv_always_gets_mandatory_branch(self, client):
        # Backend tilføjer altid det obligatoriske fællesskab (default: di-produktion)
        # så erhverv med tom liste ender som Branchemedlem, ikke Erhvervsmedlem
        data = self._run_through_step6(client, 100, "nej", None, [])
        session = client.get(f"/registration/session/{data['session_id']}").get_json()
        assert session["step_data"]["7"]["computed_membership"] == "Branchemedlem"
        assert "di-produktion" in session["step_data"]["6"]["branchefaellesskaber"]


# ---------------------------------------------------------------------------
# DB persistenstests – verificerer at data faktisk lander i PostgreSQL
# ---------------------------------------------------------------------------


class TestDatabasePersistence:
    """
    Forespørger direkte i DB efter hvert API-kald.
    Bekræfter at step_data, flags, tier og current_step er korrekt persisteret.
    """

    def _query_session(self, session_id: str) -> dict:
        with get_db_cursor(dict_rows=True) as (_, cur):
            cur.execute(
                "SELECT * FROM registration_sessions WHERE id = %s",
                (session_id,),
            )
            return dict(cur.fetchone())

    def _new_session(self, client) -> str:
        return client.post("/registration/session").get_json()["session_id"]

    def test_session_created_in_db(self, client):
        sid = self._new_session(client)
        row = self._query_session(sid)
        assert row is not None
        assert row["status"] == "draft"
        assert row["current_step"] == 1
        assert row["flags"] == {}
        assert row["tier"] is None

    def test_step1_data_persisted_in_db(self, client):
        sid = self._new_session(client)
        client.post(
            f"/registration/session/{sid}/step/1",
            json={
                "cvr_number": "12345678",
                "company_name": "Persistens A/S",
                "contact_name": "DB Test",
                "contact_email": "db@test.dk",
            },
        )
        row = self._query_session(sid)
        step1 = row["step_data"]["1"]
        assert step1["cvr_number"] == "12345678"
        assert step1["company_name"] == "Persistens A/S"
        assert step1["contact_name"] == "DB Test"

    def test_current_step_advances_in_db(self, client):
        sid = self._new_session(client)
        client.post(
            f"/registration/session/{sid}/step/1",
            json={
                "cvr_number": "12345678",
                "company_name": "Test A/S",
                "contact_name": "Test",
                "contact_email": "t@t.dk",
            },
        )
        row = self._query_session(sid)
        assert row["current_step"] == 2

    def test_step4_tier_persisted_in_db(self, client):
        sid = self._new_session(client)
        client.post(
            f"/registration/session/{sid}/step/1",
            json={
                "cvr_number": "12345678",
                "company_name": "Test A/S",
                "contact_name": "Test",
                "contact_email": "t@t.dk",
            },
        )
        client.post(f"/registration/session/{sid}/step/2", json={"cvr_confirmed": True})
        client.post(
            f"/registration/session/{sid}/step/3",
            json={"selected_services": ["overenskomst"]},
        )
        client.post(f"/registration/session/{sid}/step/4", json={"employee_count": 25, "no_employees": False, "employee_types": ["funktionaer"], "total_loensum": 10000000})
        row = self._query_session(sid)
        assert row["tier"] == "smv"

    def test_step5_non_ovk_flag_persisted_in_db(self, client):
        sid = self._new_session(client)
        client.post(
            f"/registration/session/{sid}/step/1",
            json={
                "cvr_number": "12345678",
                "company_name": "Test A/S",
                "contact_name": "Test",
                "contact_email": "t@t.dk",
            },
        )
        client.post(f"/registration/session/{sid}/step/2", json={"cvr_confirmed": True})
        client.post(
            f"/registration/session/{sid}/step/3",
            json={"selected_services": ["overenskomst"]},
        )
        client.post(f"/registration/session/{sid}/step/4", json={"employee_count": 25, "no_employees": False, "employee_types": ["funktionaer"], "total_loensum": 10000000})
        client.post(
            f"/registration/session/{sid}/step/5", json={"overenskomst_status": "nej"}
        )
        row = self._query_session(sid)
        assert row["flags"].get("non_ovk") is True
        assert "established_ag" not in row["flags"]

    def test_step5_established_ag_flag_persisted_in_db(self, client):
        sid = self._new_session(client)
        client.post(
            f"/registration/session/{sid}/step/1",
            json={
                "cvr_number": "12345678",
                "company_name": "Test A/S",
                "contact_name": "Test",
                "contact_email": "t@t.dk",
            },
        )
        client.post(f"/registration/session/{sid}/step/2", json={"cvr_confirmed": True})
        client.post(
            f"/registration/session/{sid}/step/3",
            json={"selected_services": ["overenskomst"]},
        )
        client.post(f"/registration/session/{sid}/step/4", json={"employee_count": 25, "no_employees": False, "employee_types": ["funktionaer"], "total_loensum": 10000000})
        client.post(
            f"/registration/session/{sid}/step/5",
            json={
                "overenskomst_status": "ja",
                "overenskomst_type": "direkte",
                "document_id": "550e8400-e29b-41d4-a716-446655440000",
            },
        )
        row = self._query_session(sid)
        assert row["flags"].get("established_ag") is True
        assert "non_ovk" not in row["flags"]

    def test_blocking_does_not_advance_current_step_in_db(self, client):
        sid = self._new_session(client)
        client.post(
            f"/registration/session/{sid}/step/1",
            json={
                "cvr_number": "12345678",
                "company_name": "Test A/S",
                "contact_name": "Test",
                "contact_email": "t@t.dk",
            },
        )
        client.post(f"/registration/session/{sid}/step/2", json={"cvr_confirmed": True})
        client.post(
            f"/registration/session/{sid}/step/3",
            json={"selected_services": ["overenskomst"]},
        )
        client.post(f"/registration/session/{sid}/step/4", json={"employee_count": 25, "no_employees": False, "employee_types": ["funktionaer"], "total_loensum": 10000000})
        client.post(
            f"/registration/session/{sid}/step/5",
            json={"overenskomst_status": "ved_ikke"},
        )
        row = self._query_session(sid)
        assert row["current_step"] == 5  # må ikke rykke frem
        assert row["flags"] == {}  # ingen flag sat ved blokering

    def test_step6_membership_precomputed_in_db(self, client):
        sid = self._new_session(client)
        client.post(
            f"/registration/session/{sid}/step/1",
            json={
                "cvr_number": "12345678",
                "company_name": "Test A/S",
                "contact_name": "Test",
                "contact_email": "t@t.dk",
            },
        )
        client.post(f"/registration/session/{sid}/step/2", json={"cvr_confirmed": True})
        client.post(
            f"/registration/session/{sid}/step/3",
            json={"selected_services": ["overenskomst"]},
        )
        client.post(f"/registration/session/{sid}/step/4", json={"employee_count": 25, "no_employees": False, "employee_types": ["funktionaer"], "total_loensum": 10000000})
        client.post(
            f"/registration/session/{sid}/step/5", json={"overenskomst_status": "nej"}
        )
        client.post(
            f"/registration/session/{sid}/step/6", json={"branchefaellesskaber": []}
        )
        row = self._query_session(sid)
        # computed_membership skal være gemt direkte i DB's step_data
        computed = row["step_data"]["7"]["computed_membership"]
        assert computed in (
            "Associeret",
            "Arbejdsgiver",
            "Branchemedlem",
            "Erhvervsmedlem",
        )

    def test_back_navigation_updates_step_data_not_current_step(self, client):
        sid = self._new_session(client)
        client.post(
            f"/registration/session/{sid}/step/1",
            json={
                "cvr_number": "12345678",
                "company_name": "Originalt Navn A/S",
                "contact_name": "Test",
                "contact_email": "t@t.dk",
            },
        )
        client.post(f"/registration/session/{sid}/step/2", json={"cvr_confirmed": True})
        # Nu current_step = 3 – gå tilbage og opdater step 1
        client.post(
            f"/registration/session/{sid}/step/1",
            json={
                "cvr_number": "12345678",
                "company_name": "Nyt Navn A/S",
                "contact_name": "Test",
                "contact_email": "t@t.dk",
            },
        )
        row = self._query_session(sid)
        assert row["step_data"]["1"]["company_name"] == "Nyt Navn A/S"
        assert row["current_step"] == 3  # forbliver på 3, går ikke tilbage til 2


# ---------------------------------------------------------------------------
# Submit + registrations-tabel
# ---------------------------------------------------------------------------


class TestSubmitPersistence:
    """Verificerer at den endelige registrering lander korrekt i registrations-tabellen."""

    def _run_full_flow(self, client) -> str:
        """Kører alle 11 steps og returnerer session_id."""
        sid = client.post("/registration/session").get_json()["session_id"]
        client.post(
            f"/registration/session/{sid}/step/1",
            json={
                "cvr_number": "12345678",
                "company_name": "Submit Test A/S",
                "contact_name": "Submit Person",
                "contact_email": "submit@test.dk",
                "contact_phone": "11223344",
            },
        )
        client.post(f"/registration/session/{sid}/step/2", json={"cvr_confirmed": True})
        client.post(
            f"/registration/session/{sid}/step/3",
            json={"selected_services": ["overenskomst"]},
        )
        client.post(f"/registration/session/{sid}/step/4", json={"employee_count": 25, "no_employees": False, "employee_types": ["funktionaer"], "total_loensum": 10000000})
        client.post(
            f"/registration/session/{sid}/step/5", json={"overenskomst_status": "nej"}
        )
        client.post(
            f"/registration/session/{sid}/step/6", json={"branchefaellesskaber": []}
        )
        membership = client.get(f"/registration/session/{sid}").get_json()["step_data"][
            "7"
        ]["computed_membership"]
        client.post(
            f"/registration/session/{sid}/step/7",
            json={
                "membership_type": membership,
                "accept_membership": True,
            },
        )
        client.post(
            f"/registration/session/{sid}/step/8",
            json={
                "managing_director": {"name": "Submit Person", "email": "submit@test.dk"},
                "invoice_delivery": "email",
            },
        )
        client.post(
            f"/registration/session/{sid}/step/9",
            json={
                "accept_terms": True,
                "accept_authority": True,
            },
        )
        client.post(f"/registration/session/{sid}/step/10", json={})
        return sid

    def _query_registration(self, session_id: str) -> dict | None:
        with get_db_cursor(dict_rows=True) as (_, cur):
            cur.execute(
                "SELECT * FROM registrations WHERE session_id = %s",
                (session_id,),
            )
            row = cur.fetchone()
            return dict(row) if row else None

    def test_submit_creates_registration_row(self, client):
        sid = self._run_full_flow(client)
        resp = client.post(f"/registration/session/{sid}/submit")
        assert resp.status_code == 200
        reg = self._query_registration(sid)
        assert reg is not None

    def test_registration_has_correct_company_data(self, client):
        sid = self._run_full_flow(client)
        client.post(f"/registration/session/{sid}/submit")
        reg = self._query_registration(sid)
        assert reg is not None
        assert reg["cvr_number"] == "12345678"
        assert reg["company_name"] == "Submit Test A/S"
        assert reg["contact_name"] == "Submit Person"
        assert reg["contact_email"] == "submit@test.dk"
        assert reg["employee_count"] == 25

    def test_registration_answers_contain_membership_and_services(self, client):
        sid = self._run_full_flow(client)
        client.post(f"/registration/session/{sid}/submit")
        reg = self._query_registration(sid)
        assert reg is not None
        answers = reg["answers"]
        assert "membership_type" in answers
        assert "services" in answers
        assert "overenskomst" in answers["services"]

    def test_session_status_set_to_submitted(self, client):
        sid = self._run_full_flow(client)
        client.post(f"/registration/session/{sid}/submit")
        with get_db_cursor(dict_rows=True) as (_, cur):
            cur.execute(
                "SELECT status FROM registration_sessions WHERE id = %s", (sid,)
            )
            row = cur.fetchone()
        assert row is not None
        assert row["status"] == "submitted"

    def test_cannot_submit_incomplete_wizard(self, client):
        sid = client.post("/registration/session").get_json()["session_id"]
        client.post(
            f"/registration/session/{sid}/step/1",
            json={
                "cvr_number": "12345678",
                "company_name": "Test A/S",
                "contact_name": "Test",
                "contact_email": "t@t.dk",
            },
        )
        resp = client.post(f"/registration/session/{sid}/submit")
        assert resp.status_code == 400
        assert self._query_registration(sid) is None
