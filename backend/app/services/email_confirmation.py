from __future__ import annotations

import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib
import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_TEXT_BODY = """\
Hej {contact_name},

Vi har modtaget din ansøgning om indmeldelse af {company_name} i Dansk Industri.

Din ansøgning er nu under behandling. Vi vil kontakte dig via {contact_channel}, \
når vi har gennemgået din ansøgning.

Din referencekode er: {registration_id}

Med venlig hilsen
Dansk Industri
"""

_HTML_BODY = """\
<!DOCTYPE html>
<html lang="da">
<body style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 480px; margin: 0 auto; padding: 24px;">
  <p>Hej {contact_name},</p>
  <p>Vi har modtaget din ansøgning om indmeldelse af <strong>{company_name}</strong> i Dansk Industri.</p>
  <p>Din ansøgning er nu under behandling. Vi vil kontakte dig via {contact_channel}, når vi har gennemgået din ansøgning.</p>
  <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 24px 0;">
    <p style="margin: 0; font-size: 14px; color: #666;">Referencekode</p>
    <p style="margin: 4px 0 0; font-weight: bold; font-size: 16px;">{registration_id}</p>
  </div>
  <p>Med venlig hilsen<br><strong>Dansk Industri</strong></p>
</body>
</html>
"""


async def send_registration_confirmation(
    to_email: str,
    contact_name: str,
    company_name: str,
    contact_phone: str | None,
    registration_id: str,
) -> None:
    settings = get_settings()

    contact_channel = (
        f"dit telefonnummer {contact_phone}"
        if contact_phone
        else f"din e-mailadresse {to_email}"
    )

    subject = "Ansøgning modtaget – DI Indmeldelses Portal"
    text = _TEXT_BODY.format(
        contact_name=contact_name,
        company_name=company_name,
        contact_channel=contact_channel,
        registration_id=registration_id,
    )
    html = _HTML_BODY.format(
        contact_name=contact_name,
        company_name=company_name,
        contact_channel=contact_channel,
        registration_id=registration_id,
    )

    if settings.resend_api_key:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {settings.resend_api_key}"},
                json={
                    "from": settings.email_from
                    or "DI Indmeldelses Portal <onboarding@resend.dev>",
                    "to": [to_email],
                    "subject": subject,
                    "text": text,
                    "html": html,
                },
            )
            response.raise_for_status()
    elif settings.smtp_user and settings.smtp_password:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.email_from or settings.smtp_user
        msg["To"] = to_email
        msg.attach(MIMEText(text, "plain", "utf-8"))
        msg.attach(MIMEText(html, "html", "utf-8"))

        await aiosmtplib.send(
            msg,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user,
            password=settings.smtp_password,
            start_tls=True,
        )
    else:
        logger.warning(
            "Email ikke konfigureret – bekræftelsesmail ikke sendt til %s (registration_id=%s)",
            to_email,
            registration_id,
        )
