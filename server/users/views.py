from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from two_factor.models import TrustedDevice
from users.models import User
from utils.blocked_ip import block_ip
from utils.generate_otp import otp_generator
from utils.ip_detection import get_client_ip_only
from utils.user_agent_parser import parse_user_agent

from .serializers import ChangePasswordSerializer, LoginSerializer


class Login(APIView):
    throttle_scope = "login"
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data.get("email")
        password = serializer.validated_data.get("password")

        user = authenticate(request, email=email, password=password)

        if not user:
            # Failed login attempt, block IP and return error
            block_ip(request)
            return Response(
                {
                    "error": True,
                    "message": "The credentials you entered are incorrect.",
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # New: Check if the user must change their password
        if not user.has_changed_password:
            return Response(
                {
                    "error": False,
                    "change_password_required": True,
                    "message": "Please change your password to continue.",
                    "email": user.email,
                }
            )

        if not user.is_active:
            # User exists but is inactive, block IP and return error
            block_ip(request)
            return Response(
                {
                    "error": True,
                    "message": "Your account has been suspended. Goodbye 👋",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # --- Start of "Smart OTP" Bypass Logic ---
        device_id = request.COOKIES.get("trusted_device")
        trusted_device = None

        if device_id:
            try:
                # Check if a valid, active, non-expired trusted device exists for this user
                trusted_device = TrustedDevice.objects.get(
                    user=user, device_id=device_id, is_active=True
                )

                # Check if device has expired
                if trusted_device.is_expired:
                    trusted_device.delete()
                    trusted_device = None

            except TrustedDevice.DoesNotExist:
                # The cookie is invalid, expired, or for another user, proceed to OTP
                trusted_device = None

        if trusted_device:
            # --- Device is trusted, bypass OTP and log the user in directly ---

            # 1. Update device information for session management
            ip_address = get_client_ip_only(request)
            ua_info = parse_user_agent(request)

            # Note: Geolocation (city, country) would require an external service
            # like GeoIP2. For now, we'll set them to None.
            trusted_device.ip_address = ip_address
            trusted_device.city = None
            trusted_device.country = None
            trusted_device.browser = ua_info["browser"]
            trusted_device.os = ua_info["os"]
            trusted_device.device = ua_info["device"]
            trusted_device.renew()  # Renew expiration and update last_login

            # 2. Update user's last login timestamp
            user.last_login = timezone.localtime(timezone.now())
            user.save(update_fields=["last_login"])

            # 3. Generate JWT tokens
            refresh = RefreshToken.for_user(user)

            # 4. Return tokens to the frontend
            avatar_url = (
                request.build_absolute_uri(user.avatar.url) if user.avatar else None
            )
            return Response(
                {
                    "error": False,
                    "otp_required": False,  # Signal to the frontend that login is complete
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "username": user.username,
                        "avatar": avatar_url,
                    },
                    "access_token": str(refresh.access_token),
                    "refresh_token": str(refresh),
                }
            )

        else:
            # --- Device is not trusted, proceed to the standard OTP flow ---
            return otp_generator(user)
        # --- End of "Smart OTP" Bypass Logic ---


class ForceChangePassword(APIView):
    """
    Force password change endpoint for users who haven't changed their initial password.
    This is typically used after first login or when password change is required.
    """

    throttle_scope = "password_change"
    permission_classes = [AllowAny]
    serializer_class = ChangePasswordSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data.get("email")
        current_password = serializer.validated_data.get("current_password")
        new_password = serializer.validated_data.get("new_password")

        # Authenticate user with current credentials
        user = authenticate(request, email=email, password=current_password)
        if not user:
            return Response(
                {"error": True, "message": "Incorrect email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Check if user is allowed to change password (not suspended)
        if not user.is_active:
            return Response(
                {"error": True, "message": "Your account has been suspended."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Set new password and mark as changed
        user.set_password(new_password)
        user.has_changed_password = True
        user.save()

        return Response(
            {
                "error": False,
                "message": "Password changed successfully. You can now log in with your new password.",
            },
            status=status.HTTP_200_OK,
        )
