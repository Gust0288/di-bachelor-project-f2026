from __future__ import annotations

import asyncio
import logging
import threading
from datetime import date
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib
import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_SERVICE_LABELS: dict[str, str] = {
    "overenskomst": "Overenskomst",
    "personalejuridisk_raadgivning": "Personalejuridisk rådgivning",
    "erhvervsjuridisk_raadgivning": "Erhvervsjuridisk rådgivning",
    "byggegaranti": "Byggegaranti",
    "di_byggeri_sektion": "Medlemskab af sektion i DI Byggeri",
    "andet": "Andet",
}


def _format_services(services: list[str]) -> str:
    if not services:
        return "Ingen valgte tjenester"
    return "\n".join(f"  - {_SERVICE_LABELS.get(s, s)}" for s in services)


def _format_services_html(services: list[str]) -> str:
    if not services:
        return "<em>Ingen valgte tjenester</em>"
    items = "".join(
        f'<li style="margin: 4px 0;">{_SERVICE_LABELS.get(s, s)}</li>' for s in services
    )
    return f'<ul style="margin: 4px 0 0; padding-left: 20px;">{items}</ul>'


def _format_branches_html(branches: list[str]) -> str:
    if not branches:
        return ""
    items = "".join(f'<li style="margin: 4px 0;">{b}</li>' for b in branches)
    return (
        '<tr><td style="padding: 8px 0; color: #555; width: 160px; vertical-align: top;">'
        "Branchefællesskaber</td>"
        f'<td style="padding: 8px 0; font-weight: 500; vertical-align: top;">'
        f'<ul style="margin: 0; padding-left: 20px;">{items}</ul></td></tr>'
    )


_TEXT_BODY = """\
Hej {contact_name},

Tillykke – {company_name} er nu godkendt som medlem af Dansk Industri.

FAKTURAOVERSIGT
===============

Virksomhed:   {company_name}
CVR-nummer:   {cvr_number}
Adresse:      {address_str}
Dato:         {approval_date}

VALGT MEDLEMSKAB
-----------------
{membership_type}

VALGTE TJENESTER
----------------
{services_text}
{branches_section}

Opkrævning foretages i henhold til DIs prisliste og fremsendes separat.

Har du spørgsmål, er du velkommen til at kontakte os på di.dk.

Med venlig hilsen
Dansk Industri
"""

_HTML_BODY = """\
<!DOCTYPE html>
<html lang="da">
<body style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
  <p>Hej {contact_name},</p>
  <p>Tillykke – <strong>{company_name}</strong> er nu godkendt som medlem af Dansk Industri.</p>

  <div style="background: #f0f7f0; border-left: 4px solid #2d7a3a; padding: 14px 16px; border-radius: 4px; margin: 20px 0;">
    <p style="margin: 0; font-size: 15px; font-weight: bold; color: #2d7a3a;">Ansøgning godkendt ✓</p>
  </div>

  <h2 style="font-size: 15px; font-weight: 600; margin: 24px 0 12px; border-bottom: 1px solid #e0e0e0; padding-bottom: 6px;">
    Fakturaoversigt
  </h2>

  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
    <tr>
      <td style="padding: 8px 0; color: #555; width: 160px;">Virksomhed</td>
      <td style="padding: 8px 0; font-weight: 500;">{company_name}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; color: #555;">CVR-nummer</td>
      <td style="padding: 8px 0; font-weight: 500; font-family: monospace;">{cvr_number}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; color: #555;">Adresse</td>
      <td style="padding: 8px 0;">{address_str}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; color: #555;">Fakturadato</td>
      <td style="padding: 8px 0;">{approval_date}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; color: #555; vertical-align: top;">Valgt medlemskab</td>
      <td style="padding: 8px 0;">
        <span style="background: #e8f0fe; color: #1a56db; padding: 3px 10px; border-radius: 999px; font-size: 13px; font-weight: 600;">
          {membership_type}
        </span>
      </td>
    </tr>
    <tr>
      <td style="padding: 8px 0; color: #555; vertical-align: top;">Valgte tjenester</td>
      <td style="padding: 8px 0;">{services_html}</td>
    </tr>
    {branches_row}
  </table>

  <div style="background: #f5f5f5; padding: 14px 16px; border-radius: 4px; margin: 24px 0; font-size: 13px; color: #555;">
    Opkrævning foretages i henhold til DIs prisliste og fremsendes separat.
  </div>

  <p style="font-size: 14px;">Har du spørgsmål, er du velkommen til at kontakte os på <a href="https://di.dk" style="color: #38025c;">di.dk</a>.</p>

  <p>Med venlig hilsen<br><strong>Dansk Industri</strong></p>
</body>
</html>
"""


async def send_invoice_email(
    to_email: str,
    contact_name: str,
    company_name: str,
    cvr_number: str,
    address_str: str,
    membership_type: str,
    services: list[str],
    branchefaellesskaber: list[str],
) -> None:
    settings = get_settings()
    approval_date = (
        date.today()
        .strftime("%-d. %B %Y")
        .replace("January", "januar")
        .replace("February", "februar")
        .replace("March", "marts")
        .replace("April", "april")
        .replace("May", "maj")
        .replace("June", "juni")
        .replace("July", "juli")
        .replace("August", "august")
        .replace("September", "september")
        .replace("October", "oktober")
        .replace("November", "november")
        .replace("December", "december")
    )

    branches_section = (
        "\nBRANCHEFÆLLESSKABER\n--------------------\n"
        + "\n".join(f"  - {b}" for b in branchefaellesskaber)
        if branchefaellesskaber
        else ""
    )

    subject = "Godkendt DI-medlemskab — Fakturaoversigt"
    text = _TEXT_BODY.format(
        contact_name=contact_name,
        company_name=company_name,
        cvr_number=cvr_number,
        address_str=address_str or "—",
        approval_date=approval_date,
        membership_type=membership_type or "—",
        services_text=_format_services(services),
        branches_section=branches_section,
    )
    html = _HTML_BODY.format(
        contact_name=contact_name,
        company_name=company_name,
        cvr_number=cvr_number,
        address_str=address_str or "—",
        approval_date=approval_date,
        membership_type=membership_type or "—",
        services_html=_format_services_html(services),
        branches_row=_format_branches_html(branchefaellesskaber),
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
            "Email ikke konfigureret – fakturamail ikke sendt til %s (%s)",
            to_email,
            company_name,
        )


def send_invoice_email_background(
    to_email: str,
    contact_name: str,
    company_name: str,
    cvr_number: str,
    address_str: str,
    membership_type: str,
    services: list[str],
    branchefaellesskaber: list[str],
) -> None:
    def _run() -> None:
        try:
            asyncio.run(
                send_invoice_email(
                    to_email=to_email,
                    contact_name=contact_name,
                    company_name=company_name,
                    cvr_number=cvr_number,
                    address_str=address_str,
                    membership_type=membership_type,
                    services=services,
                    branchefaellesskaber=branchefaellesskaber,
                )
            )
        except Exception:
            logger.exception(
                "Fakturamail ikke sendt til %s (%s)", to_email, company_name
            )

    threading.Thread(target=_run, daemon=True).start()
