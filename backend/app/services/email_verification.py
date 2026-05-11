from __future__ import annotations

import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib
import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_TEXT_BODY = """\
Hej,

Du er ved at tilmelde din virksomhed hos Dansk Industri.

Din bekræftelseskode er:

{code}

Koden er gyldig i 10 minutter.

Hvis du ikke har igangsat denne tilmelding, kan du se bort fra denne besked.

Med venlig hilsen
Dansk Industri
"""

_HTML_BODY = """\
<!DOCTYPE html>
<html lang="da">
<body style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 480px; margin: 0 auto; padding: 24px;">
  <p>Hej,</p>
  <p>Du er ved at tilmelde din virksomhed hos Dansk Industri.</p>
  <p>Din bekræftelseskode er:</p>
  <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center;
              background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 24px 0;">
    {code}
  </div>
  <p style="color: #666; font-size: 14px;">Koden er gyldig i 10 minutter.</p>
  <p style="color: #666; font-size: 14px;">
    Hvis du ikke har igangsat denne tilmelding, kan du se bort fra denne besked.
  </p>
  <p>Med venlig hilsen<br><strong>Dansk Industri</strong></p>
</body>
</html>
"""


async def send_verification_email(to_email: str, code: str) -> None:
    settings = get_settings()

    if settings.resend_api_key:
        await _send_via_resend(
            to_email, code, settings.resend_api_key, settings.email_from
        )
    elif settings.smtp_user and settings.smtp_password:
        await _send_via_smtp(to_email, code, settings)
    else:
        logger.warning(
            "Email ikke konfigureret – email ikke sendt. Bekræftelseskode: %s", code
        )


async def _send_via_resend(
    to_email: str, code: str, api_key: str, from_address: str
) -> None:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "from": from_address
                or "DI Indmeldelses Portal <onboarding@resend.dev>",
                "to": [to_email],
                "subject": "Bekræft din e-mail – DI Indmeldelses Portal",
                "text": _TEXT_BODY.format(code=code),
                "html": _HTML_BODY.format(code=code),
            },
        )
        response.raise_for_status()


async def _send_via_smtp(to_email: str, code: str, settings) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Bekræft din e-mail – DI Indmeldelses Portal"
    msg["From"] = settings.email_from or settings.smtp_user
    msg["To"] = to_email
    msg.attach(MIMEText(_TEXT_BODY.format(code=code), "plain", "utf-8"))
    msg.attach(MIMEText(_HTML_BODY.format(code=code), "html", "utf-8"))

    await aiosmtplib.send(
        msg,
        hostname=settings.smtp_host,
        port=settings.smtp_port,
        username=settings.smtp_user,
        password=settings.smtp_password,
        start_tls=True,
    )
