from __future__ import annotations

import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

from app.core.config import get_settings

logger = logging.getLogger(__name__)


async def send_verification_email(to_email: str, code: str) -> None:
    settings = get_settings()

    if not settings.smtp_user or not settings.smtp_password:
        logger.warning(
            "SMTP ikke konfigureret – email ikke sendt. Bekræftelseskode: %s", code
        )
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Bekræft din e-mail – DI Indmeldelses Portal"
    msg["From"] = settings.email_from or settings.smtp_user
    msg["To"] = to_email

    text_body = f"""\
Hej,

Du er ved at tilmelde din virksomhed hos Dansk Industri.

Din bekræftelseskode er:

{code}

Koden er gyldig i 10 minutter.

Hvis du ikke har igangsat denne tilmelding, kan du se bort fra denne besked.

Med venlig hilsen
Dansk Industri
"""

    html_body = f"""\
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

    msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    await aiosmtplib.send(
        msg,
        hostname=settings.smtp_host,
        port=settings.smtp_port,
        username=settings.smtp_user,
        password=settings.smtp_password,
        start_tls=True,
    )
