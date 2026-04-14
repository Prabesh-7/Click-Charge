from __future__ import annotations

import asyncio
import os
import smtplib
import ssl
from email.message import EmailMessage


class EmailDeliveryError(RuntimeError):
    pass


def _get_smtp_settings() -> dict[str, object]:
    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "587"))
    raw_username = os.getenv("SMTP_USERNAME")
    password = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv("SMTP_FROM_EMAIL") or raw_username or os.getenv("SUPPORT_EMAIL")
    username = raw_username or from_email
    from_name = os.getenv("SMTP_FROM_NAME", "Click&Charge")
    use_ssl = os.getenv("SMTP_USE_SSL", "false").strip().lower() in {"1", "true", "yes", "on"}
    use_starttls = os.getenv("SMTP_USE_STARTTLS", "true").strip().lower() in {"1", "true", "yes", "on"}
    timeout = float(os.getenv("SMTP_TIMEOUT_SECONDS", "15"))

    if not from_email:
        raise EmailDeliveryError("SMTP_FROM_EMAIL or SMTP_USERNAME must be configured")

    if not password:
        raise EmailDeliveryError("SMTP_PASSWORD must be configured")

    if use_ssl and use_starttls:
        raise EmailDeliveryError("SMTP_USE_SSL and SMTP_USE_STARTTLS cannot both be enabled")

    return {
        "host": host,
        "port": port,
        "username": username,
        "password": password,
        "from_email": from_email,
        "from_name": from_name,
        "use_ssl": use_ssl,
        "use_starttls": use_starttls,
        "timeout": timeout,
    }


def _send_email_sync(message: EmailMessage) -> None:
    settings = _get_smtp_settings()
    host = str(settings["host"])
    port = int(settings["port"])
    username = settings["username"]
    password = settings["password"]
    use_ssl = bool(settings["use_ssl"])
    use_starttls = bool(settings["use_starttls"])
    timeout = float(settings["timeout"])

    if use_ssl:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(host, port, timeout=timeout, context=context) as smtp:
            if username and password:
                smtp.login(str(username), str(password))
            smtp.send_message(message)
        return

    with smtplib.SMTP(host, port, timeout=timeout) as smtp:
        smtp.ehlo()
        if use_starttls:
            context = ssl.create_default_context()
            smtp.starttls(context=context)
            smtp.ehlo()
        if username and password:
            smtp.login(str(username), str(password))
        smtp.send_message(message)


async def send_email(subject: str, recipient_email: str, body_text: str) -> None:
    settings = _get_smtp_settings()
    from_email = str(settings["from_email"])
    from_name = str(settings["from_name"])

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = f"{from_name} <{from_email}>"
    message["To"] = recipient_email
    message.set_content(body_text)

    try:
        await asyncio.to_thread(_send_email_sync, message)
    except Exception as exc:  # pragma: no cover - surfaced as HTTP error by caller
        raise EmailDeliveryError(f"Failed to send email: {exc}") from exc


async def send_password_reset_otp_email(
    recipient_email: str,
    recipient_name: str,
    otp: str,
    expiry_minutes: int,
) -> None:
    subject = "Your Click&Charge password reset code"
    body = (
        f"Hello {recipient_name},\n\n"
        f"We received a request to reset your Click&Charge password.\n\n"
        f"Your one-time password reset code is: {otp}\n\n"
        f"This code expires in {expiry_minutes} minutes. If you did not request a password reset, you can safely ignore this email.\n\n"
        f"Thank you,\n"
        f"Click&Charge"
    )

    await send_email(subject=subject, recipient_email=recipient_email, body_text=body)
