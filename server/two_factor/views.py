import secrets

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from utils.ip_detection import get_client_ip_only
from utils.user_agent_parser import parse_user_agent

from .models import AdvancedOTPDevice, TrustedDevice
from .serializers import Verify2FASerializer


class Verify2Fa(APIView):
    throttle_scope = "otp"
    permission_classes = [AllowAny]
    serializer_class = Verify2FASerializer

    def post(self, request):
        serializer = Verify2FASerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        code = serializer.validated_data["otp_code"]

        try:
            # Use select_related to fetch the user and device in a single, efficient query.
            device = AdvancedOTPDevice.objects.select_related("user").get(
                user__email=email, name="email_otp_device"
            )
            user = device.user

            verification_result = device.verify_token(code)
            if verification_result.get("error"):
                return Response(
                    {"error": True, "message": verification_result["message"]},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # --- Start of New "Risk Based Authentication" Logic ---

            # 1. Generate JWT tokens for the session
            refresh = RefreshToken.for_user(user)

            # 2. Gather all device information
            device_id = secrets.token_urlsafe(32)
            ua_info = parse_user_agent(request)
            ip_address = get_client_ip_only(request)

            # Note: Geolocation (city, country) would require an external service
            # like GeoIP2. For now, we'll set them to None.
            city = None
            country = None

            # 3. Enforce session limits before creating new trusted device
            TrustedDevice.enforce_session_limits(user)

            # 4. Create the TrustedDevice record to "remember" this device
            TrustedDevice.objects.create(
                user=user,
                device_id=device_id,
                browser=ua_info["browser"],
                os=ua_info["os"],
                device=ua_info["device"],
                ip_address=ip_address,
                city=city,
                country=country,
            )

            # 4. Update user's last login timestamp
            user.last_login = timezone.localtime(timezone.now())
            user.save(update_fields=["last_login"])

            # 5. Prepare the API response payload
            avatar_url = (
                request.build_absolute_uri(user.avatar.url) if user.avatar else None
            )
            response_data = {
                "error": False,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "username": user.username,
                    "avatar": avatar_url,
                },
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
            }

            # 6. Add the trusted_device_id to the response body
            response_data["trusted_device_id"] = device_id
            response = Response(response_data, status=status.HTTP_200_OK)

            return response
            # --- End of New "Risk Based Authentication" Logic ---

        except AdvancedOTPDevice.DoesNotExist:
            return Response(
                {
                    "error": True,
                    "message": "OTP device not found. Please try again.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
