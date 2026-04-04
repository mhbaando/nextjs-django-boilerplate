from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken
from two_factor.models import AdvancedOTPDevice

from ..models import User
from .trusted_device_service import DeviceService
from .user_lookup_service import find_user_by_email


class OTPService:
    @staticmethod
    def generate_otp_code(user):
        """Generate OTP code for user authentication."""
        device, _ = AdvancedOTPDevice.objects.get_or_create(
            user=user, name="email_otp_device"
        )
        result = device.generate_token()

        if result.get("error"):
            return {"error": True, "message": result["message"]}

        otp_code = result.get("otp_code")
        if otp_code:
            # TODO: Send OTP via email or SMS
            print(otp_code)
            return {"error": False, "otp_code": otp_code}

        return {"error": True, "message": "Failed to generate OTP"}

    @staticmethod
    def verify_otp(email, code, device_info):
        """Verify OTP code and authenticate user."""
        user = find_user_by_email(email)
        if not user:
            return {"error": True, "message": "Invalid credentials"}

        try:
            device = AdvancedOTPDevice.objects.get(user=user, name="email_otp_device")
        except AdvancedOTPDevice.DoesNotExist:
            return {"error": True, "message": "OTP verification error"}

        verification_result = device.verify_token(code)

        if verification_result.get("error"):
            return {"error": True, "message": verification_result["message"]}

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        # Create trusted device if device info is provided
        trusted_device = None
        signature = None

        if device_info:
            trusted_device, signature = DeviceService.trust_device(
                user=user, device_info=device_info, days=device_info.get("days", 7)
            )

        # Update last login
        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])

        response_data = {
            "error": False,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "username": user.username,
                "avatar": user.avatar.url if user.avatar else None,
            },
            "access_token": str(refresh.access_token),
            "refresh_token": str(refresh),
        }

        # Add device info if trusted device was created
        if trusted_device and signature:
            response_data["device_id"] = trusted_device.device_id
            response_data["device_signature"] = signature
        else:
            response_data["device_id"] = None
            response_data["device_signature"] = None

        return response_data
