from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..services.auth_service import AuthService
from ..services.change_password import ChangePasswordService
from ..services.otp_service import OTPService
from ..serializers import ChangePasswordSerializer, LoginSerializer


class AuthView(APIView):
    """
    Authentication view that handles login, OTP verification, and password change.
    Uses AuthService, ChangePasswordService, and OTPService.
    """

    throttle_scope = "auth"
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Handle authentication requests.
        Supports: login, OTP verification, password change
        """
        action = request.data.get("action")

        if action == "login":
            return self._handle_login(request)
        elif action == "verify_otp":
            return self._handle_verify_otp(request)
        elif action == "change_password":
            return self._handle_change_password(request)
        elif action == "generate_otp":
            return self._handle_generate_otp(request)
        else:
            return Response(
                {
                    "error": True,
                    "message": "Invalid action. Supported actions: login, verify_otp, change_password, generate_otp",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    def _handle_login(self, request):
        """Handle login using AuthService."""
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data.get("email")
        password = serializer.validated_data.get("password")

        # Get device info from request
        device_info = {
            "device_id": request.headers.get("X-Device-ID"),
            "platform": request.headers.get("X-Platform"),
            "os": request.headers.get("X-OS"),
            "device": request.headers.get("X-Device"),
            "ip_address": self._get_client_ip(request),
        }

        result = AuthService.login(email, password, device_info)

        # Return appropriate status code
        if result.get("error"):
            status_code = status.HTTP_401_UNAUTHORIZED
            if result.get("change_password_required"):
                status_code = status.HTTP_200_OK
            return Response(result, status=status_code)

        return Response(result, status=status.HTTP_200_OK)

    def _handle_verify_otp(self, request):
        """Handle OTP verification using OTPService."""
        email = request.data.get("email")
        code = request.data.get("code")

        if not email or not code:
            return Response(
                {"error": True, "message": "Email and OTP code are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get device info from request
        device_info = {
            "device_id": request.headers.get("X-Device-ID"),
            "platform": request.headers.get("X-Platform"),
            "os": request.headers.get("X-OS"),
            "device": request.headers.get("X-Device"),
            "ip_address": self._get_client_ip(request),
            "days": 30,
        }

        result = OTPService.verify_otp(email, code, device_info)

        if result.get("error"):
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        return Response(result, status=status.HTTP_200_OK)

    def _handle_change_password(self, request):
        """Handle password change using ChangePasswordService."""
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data.get("email")
        current_password = serializer.validated_data.get("current_password")
        new_password = serializer.validated_data.get("new_password")

        result = ChangePasswordService.change(email, current_password, new_password)

        if result.get("error"):
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        return Response(result, status=status.HTTP_200_OK)

    def _handle_generate_otp(self, request):
        """Handle OTP generation using OTPService."""
        email = request.data.get("email")

        if not email:
            return Response(
                {"error": True, "message": "Email is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get user by email
        from ..models import User

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"error": True, "message": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        result = OTPService.generate_otp_code(user)

        if result.get("error"):
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        # In production, OTP would be sent via email/SMS
        return Response(
            {"error": False, "message": "OTP generated successfully"},
            status=status.HTTP_200_OK,
        )

    def _get_client_ip(self, request):
        """Get client IP address from request."""
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0]
        else:
            ip = request.META.get("REMOTE_ADDR")
        return ip
