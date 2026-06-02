from __future__ import annotations

import json

from app.core.database import get_db_cursor


def _serialize_row(row: dict) -> dict:
    result = {}
    for key, value in row.items():
        if hasattr(value, "isoformat"):
            result[key] = value.isoformat()
        elif hasattr(value, "hex"):
            result[key] = str(value)
        else:
            result[key] = value
    return result


def list_registrations(status_filter: str | None = None) -> list[dict]:
    query = """
        SELECT
            r.id,
            r.company_name,
            r.cvr_number,
            r.contact_name,
            r.contact_email,
            r.answers->>'membership_type' AS membership_type,
            r.created_at,
            r.status,
            r.reviewed_at
        FROM registrations r
    """
    params: list = []
    if status_filter:
        query += " WHERE r.status = %s"
        params.append(status_filter)
    query += " ORDER BY r.created_at DESC"

    with get_db_cursor(dict_rows=True) as (_, cursor):
        cursor.execute(query, params)
        rows = cursor.fetchall()
    return [_serialize_row(dict(row)) for row in rows]


def get_registration(registration_id: str) -> dict:
    query = """
        SELECT
            r.id,
            r.company_name,
            r.cvr_number,
            r.contact_name,
            r.contact_email,
            r.contact_phone,
            r.industry_code,
            r.employee_count,
            r.website,
            r.address,
            r.answers,
            r.status,
            r.reviewed_by,
            r.reviewed_at,
            r.notes,
            r.created_at,
            r.answers->>'membership_type' AS membership_type,
            a.full_name AS reviewer_name
        FROM registrations r
        LEFT JOIN admins a ON r.reviewed_by = a.id
        WHERE r.id = %s
    """
    with get_db_cursor(dict_rows=True) as (_, cursor):
        cursor.execute(query, (registration_id,))
        row = cursor.fetchone()
    if row is None:
        raise LookupError(f"Registrering ikke fundet: {registration_id}")
    return _serialize_row(dict(row))


def get_registration_documents(registration_id: str) -> list[dict]:
    query = """
        SELECT id, file_name, content_type, file_size_bytes, uploaded_at
        FROM uploaded_documents
        WHERE registration_id = %s
        ORDER BY uploaded_at ASC
    """
    with get_db_cursor(dict_rows=True) as (_, cursor):
        cursor.execute(query, (registration_id,))
        rows = cursor.fetchall()
    return [_serialize_row(dict(row)) for row in rows]


def approve_registration(registration_id: str, admin_id: str) -> dict:
    from app.services.email_invoice import send_invoice_email_background

    email_data = None
    with get_db_cursor(dict_rows=True) as (_, cursor):
        cursor.execute(
            "SELECT status, session_id FROM registrations WHERE id = %s",
            (registration_id,),
        )
        row = cursor.fetchone()
        if row is None:
            raise LookupError(f"Registrering ikke fundet: {registration_id}")
        if row["status"] != "pending":
            raise ValueError(
                f"Kan ikke godkende en ansøgning med status '{row['status']}'"
            )

        cursor.execute(
            """
            UPDATE registrations
            SET status = 'approved', reviewed_by = %s, reviewed_at = NOW()
            WHERE id = %s
            RETURNING id, status, reviewed_at
            """,
            (admin_id, registration_id),
        )
        updated = cursor.fetchone()

        if row["session_id"]:
            cursor.execute(
                "UPDATE registration_sessions SET status = 'approved' WHERE id = %s",
                (row["session_id"],),
            )

        cursor.execute(
            """
            SELECT company_name, cvr_number, contact_name, contact_email,
                   address, answers,
                   answers->>'membership_type' AS membership_type
            FROM registrations WHERE id = %s
            """,
            (registration_id,),
        )
        email_data = cursor.fetchone()

    if email_data:
        answers = email_data["answers"] or {}
        addr = email_data["address"] or {}
        address_parts = [
            addr.get("street", ""),
            f"{addr.get('zip', '')} {addr.get('city', '')}".strip(),
        ]
        address_str = ", ".join(p for p in address_parts if p)
        send_invoice_email_background(
            to_email=email_data["contact_email"],
            contact_name=email_data["contact_name"],
            company_name=email_data["company_name"],
            cvr_number=email_data["cvr_number"],
            address_str=address_str,
            membership_type=email_data["membership_type"]
            or answers.get("membership_type", ""),
            services=answers.get("services", []),
            branchefaellesskaber=answers.get("branchefaellesskaber", []),
        )

    return _serialize_row(dict(updated))


def reject_registration(registration_id: str, admin_id: str, notes: str) -> dict:
    from app.services.email_rejection import send_rejection_email_background

    notes = notes.strip()
    if not notes:
        raise ValueError("Afvisningsbegrundelse er påkrævet")

    email_data = None
    with get_db_cursor(dict_rows=True) as (_, cursor):
        cursor.execute(
            "SELECT status, session_id FROM registrations WHERE id = %s",
            (registration_id,),
        )
        row = cursor.fetchone()
        if row is None:
            raise LookupError(f"Registrering ikke fundet: {registration_id}")
        if row["status"] != "pending":
            raise ValueError(
                f"Kan ikke afvise en ansøgning med status '{row['status']}'"
            )

        cursor.execute(
            """
            UPDATE registrations
            SET status = 'rejected', reviewed_by = %s, reviewed_at = NOW(), notes = %s
            WHERE id = %s
            RETURNING id, status, reviewed_at, notes
            """,
            (admin_id, notes, registration_id),
        )
        updated = cursor.fetchone()

        if row["session_id"]:
            cursor.execute(
                "UPDATE registration_sessions SET status = 'rejected' WHERE id = %s",
                (row["session_id"],),
            )

        cursor.execute(
            "SELECT company_name, contact_name, contact_email FROM registrations WHERE id = %s",
            (registration_id,),
        )
        email_data = cursor.fetchone()

    if email_data:
        send_rejection_email_background(
            to_email=email_data["contact_email"],
            contact_name=email_data["contact_name"],
            company_name=email_data["company_name"],
            rejection_reason=notes,
        )

    return _serialize_row(dict(updated))


_FIELD_LABELS: dict[str, str] = {
    "company_name": "Virksomhedsnavn",
    "contact_name": "Kontaktnavn",
    "contact_email": "E-mail",
    "contact_phone": "Telefon",
    "industry_code": "Branchekode",
    "employee_count": "Antal ansatte",
    "website": "Hjemmeside",
    "address": "Adresse",
}


def update_registration(
    registration_id: str, data: dict, admin_id: str | None = None
) -> dict:
    ALLOWED_FIELDS = set(_FIELD_LABELS.keys())

    updates = {k: v for k, v in data.items() if k in ALLOWED_FIELDS}
    if not updates:
        raise ValueError("Ingen felter at opdatere")

    with get_db_cursor(dict_rows=True) as (_, cursor):
        cursor.execute(
            """
            SELECT status, company_name, contact_name, contact_email,
                   contact_phone, industry_code, employee_count, website, address
            FROM registrations WHERE id = %s
            """,
            (registration_id,),
        )
        current = cursor.fetchone()
        if current is None:
            raise LookupError(f"Registrering ikke fundet: {registration_id}")
        if current["status"] != "pending":
            raise ValueError("Kan kun redigere ansøgninger med status 'afventer'")

        def _values_differ(field: str, new_val) -> bool:
            old_val = current[field]
            if field == "address":
                old_norm = {k: (v or "").strip() for k, v in (old_val or {}).items()}
                new_norm = {k: (v or "").strip() for k, v in (new_val or {}).items()}
                return old_norm != new_norm
            if field == "employee_count":
                old_int = old_val if old_val is not None else None
                new_int = int(new_val) if new_val is not None else None
                return old_int != new_int
            return (old_val or "").strip() != (new_val or "").strip()

        actually_changed = [f for f, v in updates.items() if _values_differ(f, v)]

        set_clauses = []
        params: list = []
        for field, value in updates.items():
            if field == "address":
                set_clauses.append("address = %s::jsonb")
                params.append(json.dumps(value))
            else:
                set_clauses.append(f"{field} = %s")
                params.append(value)

        set_clauses.append("updated_at = NOW()")
        params.append(registration_id)

        cursor.execute(
            f"UPDATE registrations SET {', '.join(set_clauses)} WHERE id = %s",
            params,
        )

        if actually_changed:
            admin_name = "Admin"
            if admin_id:
                cursor.execute(
                    "SELECT full_name FROM admins WHERE id = %s", (admin_id,)
                )
                admin_row = cursor.fetchone()
                if admin_row:
                    admin_name = admin_row["full_name"]

            changed_labels = [_FIELD_LABELS[f] for f in actually_changed]
            cursor.execute(
                """
                INSERT INTO registration_edits
                    (registration_id, admin_id, admin_name, changed_fields)
                VALUES (%s, %s, %s, %s::jsonb)
                """,
                (registration_id, admin_id, admin_name, json.dumps(changed_labels)),
            )

    return get_registration(registration_id)


def get_stats() -> dict:
    with get_db_cursor(dict_rows=True) as (_, cursor):
        cursor.execute("""
            SELECT
                COUNT(*)                                        AS total,
                COUNT(*) FILTER (WHERE status = 'pending')     AS pending,
                COUNT(*) FILTER (WHERE status = 'approved')    AS approved,
                COUNT(*) FILTER (WHERE status = 'rejected')    AS rejected
            FROM registrations
        """)
        row = cursor.fetchone()
    return {
        "total": int(row["total"]),
        "pending": int(row["pending"]),
        "approved": int(row["approved"]),
        "rejected": int(row["rejected"]),
    }


def get_notes(registration_id: str) -> list[dict]:
    with get_db_cursor(dict_rows=True) as (_, cursor):
        cursor.execute(
            """
            SELECT id, content, admin_name, created_at
            FROM registration_notes
            WHERE registration_id = %s
            ORDER BY created_at ASC
            """,
            (registration_id,),
        )
        rows = cursor.fetchall()
    return [_serialize_row(dict(row)) for row in rows]


def add_note(registration_id: str, admin_id: str, content: str) -> dict:
    content = content.strip()
    if not content:
        raise ValueError("Note-indhold er påkrævet")

    with get_db_cursor(dict_rows=True) as (_, cursor):
        cursor.execute("SELECT id FROM registrations WHERE id = %s", (registration_id,))
        if cursor.fetchone() is None:
            raise LookupError(f"Registrering ikke fundet: {registration_id}")

        cursor.execute("SELECT full_name FROM admins WHERE id = %s", (admin_id,))
        admin_row = cursor.fetchone()
        admin_name = admin_row["full_name"] if admin_row else "Admin"

        cursor.execute(
            """
            INSERT INTO registration_notes (registration_id, admin_id, admin_name, content)
            VALUES (%s, %s, %s, %s)
            RETURNING id, content, admin_name, created_at
            """,
            (registration_id, admin_id, admin_name, content),
        )
        row = cursor.fetchone()
    return _serialize_row(dict(row))


def list_sessions() -> list[dict]:
    query = """
        SELECT
            id,
            company_cvr,
            current_step,
            contact_name,
            contact_email,
            tier,
            created_at,
            updated_at,
            expires_at
        FROM registration_sessions
        WHERE status = 'draft' AND expires_at > NOW() AND email_verified = TRUE
        ORDER BY updated_at DESC
    """
    with get_db_cursor(dict_rows=True) as (_, cursor):
        cursor.execute(query)
        rows = cursor.fetchall()
    return [_serialize_row(dict(row)) for row in rows]


def get_session_detail(session_id: str) -> dict:
    query = """
        SELECT
            id,
            company_cvr,
            current_step,
            contact_name,
            contact_email,
            tier,
            flags,
            step_data,
            created_at,
            updated_at,
            expires_at,
            email_verified
        FROM registration_sessions
        WHERE id = %s AND status = 'draft'
    """
    with get_db_cursor(dict_rows=True) as (_, cursor):
        cursor.execute(query, (session_id,))
        row = cursor.fetchone()
    if row is None:
        raise LookupError(f"Session ikke fundet: {session_id}")
    return _serialize_row(dict(row))


def get_activity(limit: int = 200) -> list[dict]:
    query = """
        SELECT
            CASE WHEN r.status = 'approved' THEN 'approval' ELSE 'rejection' END AS type,
            r.id          AS registration_id,
            r.company_name,
            a.full_name   AS admin_name,
            r.notes       AS content,
            r.reviewed_at AS created_at
        FROM registrations r
        LEFT JOIN admins a ON r.reviewed_by = a.id
        WHERE r.status IN ('approved', 'rejected')
          AND r.reviewed_at IS NOT NULL

        UNION ALL

        SELECT
            'note'              AS type,
            n.registration_id,
            r.company_name,
            n.admin_name,
            n.content,
            n.created_at
        FROM registration_notes n
        JOIN registrations r ON n.registration_id = r.id

        UNION ALL

        SELECT
            'edit'              AS type,
            e.registration_id,
            r.company_name,
            e.admin_name,
            array_to_string(ARRAY(SELECT jsonb_array_elements_text(e.changed_fields)), ', ') AS content,
            e.created_at
        FROM registration_edits e
        JOIN registrations r ON e.registration_id = r.id

        UNION ALL

        SELECT
            'application_started'                                          AS type,
            rs.id                                                          AS registration_id,
            COALESCE(rs.company_cvr, 'Ukendt virksomhed')                 AS company_name,
            COALESCE(rs.contact_name, rs.contact_email, 'Bruger')         AS admin_name,
            rs.contact_email                                               AS content,
            rs.created_at
        FROM registration_sessions rs
        WHERE rs.created_at >= NOW() - INTERVAL '14 days'

        UNION ALL

        SELECT
            'application_submitted'                                        AS type,
            r.id                                                           AS registration_id,
            r.company_name,
            COALESCE(r.contact_name, r.contact_email)                     AS admin_name,
            r.contact_email                                                AS content,
            r.created_at
        FROM registrations r
        WHERE r.created_at >= NOW() - INTERVAL '14 days'

        ORDER BY created_at DESC
        LIMIT %s
    """
    with get_db_cursor(dict_rows=True) as (_, cursor):
        cursor.execute(query, (limit,))
        rows = cursor.fetchall()
    return [_serialize_row(dict(row)) for row in rows]
