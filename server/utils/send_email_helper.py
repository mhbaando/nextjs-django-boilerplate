from pathlib import Path

from django.conf import settings
from django.core.mail import send_mail

from app.celery import app


@app.task
def send_otp(to_email, otp):
    subject = "NEXT-DJANGO - OTP Verification"

    # Load HTML template directly from file system
    template_path = Path(__file__).parent / "templates" / "sendotp.html"

    try:
        with open(template_path, "r", encoding="utf-8") as file:
            html_content = file.read()

        # Replace the OTP placeholder with actual OTP code
        email_content = html_content.replace("{{OTP_CODE}}", str(otp))

    except FileNotFoundError:
        # Fallback to simple text email if template not found
        email_content = f"""
        NEXT-DJANGO - Vehicle Registration & Licenses System

        Your One-Time Password (OTP) is: {otp}

        This code will expire in 10 minutes.

        Important Instructions:
        • Enter this code in the verification field on our website
        • Do not share this code with anyone
        • The code is valid for one use only
        • If you didn't request this code, please ignore this email

        Security Notice:
        NEXT-DJANGO will never ask for your password or OTP via phone, email, or text message.
        Keep your verification codes confidential.

        This is an automated message from NEXT-DJANGO System
        Please do not reply to this email

        Need help? Contact our support team at support@NEXT-DJANGO.gov
        """

    send_mail(
        subject,
        "",
        settings.EMAIL_HOST_USER,
        [to_email],
        html_message=email_content,
        fail_silently=False,
    )
