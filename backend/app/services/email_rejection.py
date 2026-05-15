from __future__ import annotations

import asyncio
import logging
import threading
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib
import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_TEXT_BODY = """\
Hej {contact_name},

Vi har gennemgået ansøgningen om indmeldelse af {company_name} i Dansk Industri \
og desværre ikke kunnet imødekomme den.

BEGRUNDELSE
-----------
{rejection_reason}

Har du spørgsmål til afgørelsen, er du velkommen til at kontakte os på di.dk.

Med venlig hilsen
Dansk Industri
"""

_HTML_BODY = """\
<!DOCTYPE html>
<html lang="da">
<body style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
  <p>Hej {contact_name},</p>
  <p>Vi har gennemgået ansøgningen om indmeldelse af <strong>{company_name}</strong> i Dansk Industri \
og desværre ikke kunnet imødekomme den.</p>

  <div style="background: #fef2f2; border-left: 4px solid #c0392b; padding: 14px 16px; border-radius: 4px; margin: 20px 0;">
    <p style="margin: 0 0 6px; font-size: 13px; font-weight: 600; color: #c0392b; text-transform: uppercase; letter-spacing: 0.04em;">
      Ansøgning afvist
    </p>
    <p style="margin: 0; font-size: 14px; color: #1a1a1a; white-space: pre-wrap;">{rejection_reason}</p>
  </div>

  <p style="font-size: 14px;">Har du spørgsmål til afgørelsen, er du velkommen til at kontakte os på \
<a href="https://di.dk" style="color: #38025c;">di.dk</a>.</p>

  <p>Med venlig hilsen<br><strong>Dansk Industri</strong></p>
</body>
</html>
"""


async def send_rejection_email(
    to_email: str,
    contact_name: str,
    company_name: str,
    rejection_reason: str,
) -> None:
    settings = get_settings()
    subject = "Ansøgning om DI-medlemskab — Afgørelse"
    text = _TEXT_BODY.format(
        contact_name=contact_name,
        company_name=company_name,
        rejection_reason=rejection_reason,
    )
    html = _HTML_BODY.format(
        contact_name=contact_name,
        company_name=company_name,
        rejection_reason=rejection_reason,
    )

    if settings.resend_api_key:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {settings.resend_api_key}"},
                json={
                    "from": settings.email_from or "DI Indmeldelses Portal <onboarding@resend.dev>",
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
            "Email ikke konfigureret – afvisningsmail ikke sendt til %s (%s)",
            to_email,
            company_name,
        )


def send_rejection_email_background(
    to_email: str,
    contact_name: str,
    company_name: str,
    rejection_reason: str,
) -> None:
    def _run() -> None:
        try:
            asyncio.run(send_rejection_email(
                to_email=to_email,
                contact_name=contact_name,
                company_name=company_name,
                rejection_reason=rejection_reason,
            ))
        except Exception:
            logger.exception("Afvisningsmail ikke sendt til %s (%s)", to_email, company_name)

    threading.Thread(target=_run, daemon=True).start()
