from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.response import Response

from two_factor.models import AdvancedOTPDevice
from utils.send_email_helper import send_otp

User = get_user_model()


def otp_generator(user: User) -> Response:
    """
    Generates and sends an OTP to the user's email, handling rate limiting and errors.

    Args:
        user: The user instance for whom to generate the OTP.

    Returns:
        A Django Rest Framework Response object.
    """
    # Use a more descriptive name for the device since we are sending via email.
    device, _ = AdvancedOTPDevice.objects.get_or_create(
        user=user, name="email_otp_device"
    )

    # Call the model's method to generate the token.
    result = device.generate_token()

    # If the model returns an error (e.g., rate-limited, locked), forward it.
    if result.get("error"):
        # Default to 400 Bad Request if a specific status code isn't provided.
        status_code = result.get("status_code", status.HTTP_400_BAD_REQUEST)
        return Response(
            {"error": True, "message": result["message"]}, status=status_code
        )

    # On success, send the OTP via the background task.
    otp_code = result.get("otp_code")
    print("OTP:", otp_code)
    if otp_code:
        print("OTP:", otp_code)
        # Send OTP via email using Celery background task for non-blocking operation.
        # send_otp.delay(user.email, otp_code) # enable to send email
    else:
        # This case should ideally not happen if error is False, but it's good practice to handle it.
        return Response(
            {
                "error": True,
                "message": "Cilad farsamo ayaa dhacday, fadlan isku day mar kale.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Return a success response to the user.
    return Response(
        {
            "error": False,
            "otp_required": True,
            "message": "OTP si guul leh ayaa loogu diray iimaylkaaga.",
            "email": user.email,
        },
        status=status.HTTP_200_OK,
    )
