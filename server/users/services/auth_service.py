from typing import Any, Dict, Optional

from django.db import transaction
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken
from two_factor.models import TrustedDevice

from ..models import User
from .credential_service import CredentialService
from .otp_service import OTPService
from .status_service import StatusService
from .trusted_device_service import DeviceService


class AuthService:
    @staticmethod
    @transaction.atomic
    def login(
        email: str, password: str, device_info: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Handles the complete user login flow.
        1. Verifies credentials.
        2. Checks user status and password change requirements.
        3. Manages trusted device verification and OTP flow.
        4. Returns JWT tokens upon successful authentication.
        """
        device_info = device_info or {}

        user = CredentialService.verify(email, password)
        if not user:
            return {
                "error": True,
                "message": "Invalid email or password.",
            }

        # Perform status checks
        status_checks = [
            StatusService.check_user_status(user),
            StatusService.check_password_change(user),
        ]
        for check in status_checks:
            if check and check.get("error"):
                return check

        # Handle trusted device logic
        device_id = device_info.get("device_id", "")
        if device_id and not DeviceService.verify_device_id(
            device_id, device_info.get("device_signature", "")
        ):
            device_id = ""  # Invalid signature, treat as new device

        if DeviceService.is_new_device(user, device_id):
            otp_result = OTPService.generate_otp_code(user)
            if otp_result.get("error"):
                return otp_result
            return {
                "error": False,
                "otp_required": True,
                "message": "Si Guul ah ayaa lambarka xaqiijinta laguugu soo diray.",
                "email": user.email,
            }

        return AuthService._get_success_login_response(user, device_id)

    @staticmethod
    def _get_success_login_response(user: User, device_id: str) -> Dict[str, Any]:
        """
        Constructs the successful login response with JWT tokens and user data.
        """
        # Update last_login timestamp
        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])

        # Generate tokens
        refresh = RefreshToken.for_user(user)

        response_data = {
            "error": False,
            "otp_required": False,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "username": user.username,
                "full_name": user.get_full_name(),
                "avatar": user.avatar.url if user.avatar else None,
            },
            "access_token": str(refresh.access_token),
            "refresh_token": str(refresh),
        }

        # Re-sign the device_id to ensure the signature is always fresh
        if device_id:
            # We don't need to check for trusted_device here because
            # is_new_device already confirmed it's a trusted device.
            response_data["device_id"] = device_id
            response_data["device_signature"] = DeviceService.sign_device_id(device_id)
        else:
            response_data["device_id"] = None
            response_data["device_signature"] = None

        return response_data

    @staticmethod
    def reset_password(user_badge, email):
        pass

    @staticmethod
    def change_password(user_badge, email, old_password, new_password):
        pass
