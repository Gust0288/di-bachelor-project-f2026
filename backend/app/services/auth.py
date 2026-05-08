from __future__ import annotations

import random
import string
from datetime import datetime, timezone, timedelta

from app.core.database import get_db_cursor
from app.core.security import create_token, verify_password
from app.services.email_verification import send_verification_email


def _generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


async def send_login_otp(email: str) -> dict:
    code = _generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    with get_db_cursor(dict_rows=True) as (_, cur):
        cur.execute(
            """
            SELECT id FROM registration_sessions
            WHERE (
                contact_email = %s
                OR step_data -> '1' ->> 'contact_email' = %s
            )
            AND status = 'draft' AND expires_at > NOW()
            LIMIT 1
            """,
            (email, email),
        )
        if not cur.fetchone():
            raise ValueError("Ingen aktiv ansøgning fundet for denne e-mail")

        cur.execute("DELETE FROM login_otps WHERE email = %s", (email,))
        cur.execute(
            "INSERT INTO login_otps (email, code, expires_at) VALUES (%s, %s, %s)",
            (email, code, expires_at),
        )

    await send_verification_email(email, code)
    return {"session_exists": True}


def verify_login_otp(email: str, code: str) -> dict:
    with get_db_cursor(dict_rows=True) as (_, cur):
        cur.execute(
            """
            SELECT id, expires_at, used FROM login_otps
            WHERE email = %s AND code = %s
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (email, code),
        )
        otp_row = cur.fetchone()

        if not otp_row:
            raise ValueError("Forkert bekræftelseskode")
        if otp_row["used"]:
            raise ValueError("Koden er allerede brugt")
        if otp_row["expires_at"] < datetime.now(timezone.utc):
            raise ValueError("Bekræftelseskoden er udløbet")

        cur.execute(
            "UPDATE login_otps SET used = TRUE WHERE id = %s",
            (otp_row["id"],),
        )

        cur.execute(
            """
            SELECT id FROM registration_sessions
            WHERE (
                contact_email = %s
                OR step_data -> '1' ->> 'contact_email' = %s
            )
            AND status = 'draft' AND expires_at > NOW()
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (email, email),
        )
        session_row = cur.fetchone()

        if not session_row:
            raise ValueError("Ingen aktiv ansøgning fundet for denne e-mail")

        session_id = str(session_row["id"])

    return {"session_id": session_id}


def admin_login(email: str, password: str) -> dict:
    with get_db_cursor(dict_rows=True) as (_, cur):
        cur.execute(
            "SELECT id, password_hash FROM admins WHERE email = %s AND is_active = TRUE",
            (email,),
        )
        row = cur.fetchone()

    if not row or not verify_password(password, row["password_hash"]):
        raise ValueError("Forkert email eller adgangskode")

    token = create_token(
        {"sub": str(row["id"]), "role": "admin"}, expires_in_minutes=480
    )
    return {"token": token, "admin_id": str(row["id"])}
