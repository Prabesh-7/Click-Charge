## Reservation confirmation email

The manager reservation page can send a confirmation email to the reserved user through SMTP.

Set these environment variables in `backend/.env`:

- `SMTP_HOST` (for Gmail, use `smtp.gmail.com`)
- `SMTP_PORT` (for Gmail STARTTLS, use `587`)
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_FROM_EMAIL`
- `SMTP_FROM_NAME`
- `SMTP_USE_STARTTLS` (`true` by default)
- `SMTP_USE_SSL` (`false` by default)
- `SMTP_TIMEOUT_SECONDS`

The manager endpoint is `POST /manager/slots/{slot_id}/send-confirmation`.

## Password reset email

Users can request a password reset from the login page.

The reset flow uses a one-time code sent over SMTP. No extra reset-specific env keys are needed beyond the SMTP settings.

Optional: set `PASSWORD_RESET_OTP_EXPIRY_MINUTES` to change the code lifetime. Default is `10`.

The auth endpoints are:

- `POST /forgot-password`
- `POST /reset-password`
