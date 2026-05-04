from __future__ import annotations

import json
from contextlib import suppress
from typing import Any

from pydantic import ValidationError

from app.core.database import get_db_cursor
from app.schemas.registration import STEP_SCHEMAS
from app.services.branch_mapping import get_suggestions
from app.services.flow_definition import FLOW_DEFINITION
from app.services.membership import calculate_membership, compute_tier


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _get_step_def(step_number: int) -> dict:
    for step in FLOW_DEFINITION["steps"]:
        if step["step_number"] == step_number:
            return step
    raise ValueError(f"Ukendt step: {step_number}")


def _check_blocking(step_number: int, data: dict) -> tuple[bool, dict | None]:
    step_def = _get_step_def(step_number)
    for blocker in (step_def.get("blocking_options") or []):
        field_val = data.get(blocker["field_id"])
        if isinstance(field_val, list):
            if any(v in blocker["blocking_values"] for v in field_val):
                return True, blocker["popup"]
        elif field_val in blocker["blocking_values"]:
            return True, blocker["popup"]
    return False, None


def _recompute_flags(step_data: dict) -> dict:
    """Genberegner flags fra det komplette step_data snapshot."""
    flags: dict[str, bool] = {}

    step5 = step_data.get("5", {})
    status = step5.get("overenskomst_status")
    ovk_type = step5.get("overenskomst_type")

    if status == "nej":
        flags["non_ovk"] = True
    elif status == "ja" and ovk_type == "direkte":
        flags["established_ag"] = True

    return flags


def _compute_membership_from_session(session: dict) -> str:
    tier = session.get("tier") or "mikro"
    flags = session.get("flags") or {}
    step6 = (session.get("step_data") or {}).get("6", {})
    step3 = (session.get("step_data") or {}).get("3", {})
    branches = step6.get("branchefaellesskaber", [])
    services = step3.get("selected_services", [])
    return calculate_membership(tier, flags, branches, services)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def create_session() -> dict:
    with get_db_cursor(dict_rows=True) as (_, cur):
        cur.execute(
            """
            INSERT INTO registration_sessions DEFAULT VALUES
            RETURNING id, current_step, expires_at
            """
        )
        row = cur.fetchone()
    return {
        "session_id": str(row["id"]),
        "current_step": row["current_step"],
        "expires_at": row["expires_at"].isoformat(),
    }


def get_session(session_id: str) -> dict:
    with get_db_cursor(dict_rows=True) as (_, cur):
        cur.execute(
            """
            SELECT id, current_step, tier, flags, step_data, status, expires_at
            FROM registration_sessions
            WHERE id = %s AND status = 'draft' AND expires_at > NOW()
            """,
            (session_id,),
        )
        row = cur.fetchone()

    if not row:
        raise LookupError("Session ikke fundet eller udløbet")

    return {
        "session_id": str(row["id"]),
        "current_step": row["current_step"],
        "tier": row["tier"],
        "flags": row["flags"] or {},
        "step_data": row["step_data"] or {},
        "status": row["status"],
        "expires_at": row["expires_at"].isoformat(),
    }


def save_step(session_id: str, step_number: int, raw_data: dict) -> dict:
    if step_number < 1 or step_number > 10:
        raise ValueError(f"Ugyldigt step nummer: {step_number}")

    schema_cls = STEP_SCHEMAS.get(step_number)

    with get_db_cursor(dict_rows=True) as (_, cur):
        # Lock row for the transaction
        cur.execute(
            """
            SELECT id, current_step, tier, flags, step_data, status
            FROM registration_sessions
            WHERE id = %s AND status = 'draft' AND expires_at > NOW()
            FOR UPDATE
            """,
            (session_id,),
        )
        row = cur.fetchone()
        if not row:
            raise LookupError("Session ikke fundet eller udløbet")

        current_step: int = row["current_step"]
        existing_step_data: dict = row["step_data"] or {}
        existing_flags: dict = row["flags"] or {}
        existing_tier: str | None = row["tier"]

        # Validate that user is not jumping too far ahead
        if step_number > current_step + 1:
            raise ValueError(
                f"Kan ikke springe til step {step_number} – nuværende step er {current_step}"
            )

        # Validate with Pydantic schema
        if schema_cls:
            try:
                validated = schema_cls(**raw_data)
                step_payload = validated.model_dump(exclude_none=False)
            except ValidationError:
                raise

        # Check for blocking options BEFORE setting flags
        is_blocked, popup = _check_blocking(step_number, raw_data)

        # Merge step data into existing snapshot
        merged_step_data = {**existing_step_data, str(step_number): step_payload}

        # If blocked: save data but do NOT update flags or advance step
        if is_blocked:
            cur.execute(
                """
                UPDATE registration_sessions
                SET step_data = step_data || %s::jsonb,
                    updated_at = NOW()
                WHERE id = %s
                """,
                (json.dumps({str(step_number): step_payload}), session_id),
            )
            return {
                "session_id": session_id,
                "current_step": current_step,
                "tier": existing_tier,
                "flags": existing_flags,
                "is_blocked": True,
                "blocking_popup": popup,
                "next_step": None,
            }

        # Recompute flags from full merged snapshot
        new_flags = _recompute_flags(merged_step_data)

        # Compute tier from step 4
        new_tier = existing_tier
        if step_number == 4:
            new_tier = compute_tier(step_payload["employee_count"])

        # Pre-compute membership and store into step 7 slot after step 6
        if step_number == 6:
            # Sørg for at det obligatoriske fællesskab altid er med
            suggestions = get_suggestions(
                [merged_step_data.get("1", {}).get("industry_code") or ""]
            )
            mandatory = suggestions["mandatory"]
            chosen = set(step_payload.get("branchefaellesskaber", []))
            for m in mandatory:
                chosen.add(m)
            # Byggegaranti kræver DI Byggeri
            step3_services = set(merged_step_data.get("3", {}).get("selected_services", []))
            if step3_services & {"byggegaranti", "di_byggeri_sektion"}:
                chosen.add("di-byggeri")
            merged_step_data["6"]["branchefaellesskaber"] = list(chosen)
            step_payload["branchefaellesskaber"] = list(chosen)

            session_snapshot = {
                "tier": new_tier,
                "flags": new_flags,
                "step_data": merged_step_data,
            }
            membership = _compute_membership_from_session(session_snapshot)
            merged_step_data["7"] = {
                **merged_step_data.get("7", {}),
                "computed_membership": membership,
                "membership_type": membership,
            }

        # Auto-approve MitID mock (step 10)
        if step_number == 10:
            merged_step_data["10"] = {**step_payload, "mitid_verified": True}

        new_current_step = max(current_step, step_number + 1)

        cur.execute(
            """
            UPDATE registration_sessions
            SET step_data    = %s::jsonb,
                flags        = %s::jsonb,
                tier         = %s,
                current_step = %s,
                updated_at   = NOW()
            WHERE id = %s
            """,
            (
                json.dumps(merged_step_data),
                json.dumps(new_flags),
                new_tier,
                new_current_step,
                session_id,
            ),
        )

    return {
        "session_id": session_id,
        "current_step": new_current_step,
        "tier": new_tier,
        "flags": new_flags,
        "is_blocked": False,
        "blocking_popup": None,
        "next_step": new_current_step,
    }


def get_branch_suggestions(session_id: str) -> dict:
    session = get_session(session_id)
    step1 = session["step_data"].get("1", {})
    # CVR branchekode may be a string like "412000" or a list from the CVR result
    industry_code = step1.get("industry_code") or ""
    branch_codes = [industry_code] if industry_code else []
    return get_suggestions(branch_codes)


def submit_registration(session_id: str) -> dict:
    session = get_session(session_id)

    if session["current_step"] < 11:
        raise ValueError("Wizard er ikke gennemført endnu")

    step_data = session["step_data"]
    step1 = step_data.get("1", {})
    step2 = step_data.get("2", {})
    step4 = step_data.get("4", {})
    step7 = step_data.get("7", {})

    address: dict[str, Any] = {}
    if step2.get("address_choice") == "manual":
        address = {
            "street": step2.get("manual_address"),
            "zip": step2.get("manual_zip"),
            "city": step2.get("manual_city"),
        }

    answers = {
        "services": step_data.get("3", {}).get("selected_services", []),
        "overenskomst": step_data.get("5", {}),
        "branchefaellesskaber": step_data.get("6", {}).get("branchefaellesskaber", []),
        "membership_type": step7.get("membership_type"),
        "kontaktpersoner": step_data.get("8", {}),
    }

    with get_db_cursor(dict_rows=True) as (_, cur):
        cur.execute(
            """
            INSERT INTO registrations (
                session_id, company_name, cvr_number,
                contact_name, contact_email, contact_phone,
                industry_code, employee_count, website,
                address, answers
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s::jsonb)
            RETURNING id
            """,
            (
                session_id,
                step1.get("company_name", ""),
                step1.get("cvr_number", ""),
                step1.get("contact_name", ""),
                step1.get("contact_email", ""),
                step1.get("contact_phone"),
                step1.get("industry_code"),
                step4.get("employee_count"),
                step1.get("website"),
                json.dumps(address),
                json.dumps(answers),
            ),
        )
        reg_row = cur.fetchone()
        registration_id = str(reg_row["id"])

        cur.execute(
            "UPDATE uploaded_documents SET registration_id = %s WHERE session_id = %s",
            (registration_id, session_id),
        )

        cur.execute(
            "UPDATE registration_sessions SET status = 'submitted', submitted_at = NOW() WHERE id = %s",
            (session_id,),
        )

    return {
        "registration_id": registration_id,
        "session_id": session_id,
        "status": "submitted",
    }
