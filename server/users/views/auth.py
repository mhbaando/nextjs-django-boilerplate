from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from ..services.auth_service import AuthService
from ..services.change_password import ChangePasswordService
from ..services.otp_service import OTPService


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):

        # Extract data from request
        email = request.data.get("email")
        password = request.data.get("password")
        device_info = request.data.get("device_info", {})
        print(device_info)

        # Validate required fields
        if not email or not password:
            return Response(
                {
                    "error": True,
                    "message": "Fadlan Soo gali ID Numberkada iyo fure sireedkaada",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        auth_result = AuthService.login(
            email=email, password=password, device_info=device_info
        )

        # Determine status code based on response
        if auth_result.get("error") or auth_result.get("isError"):
            status_code = status.HTTP_400_BAD_REQUEST
        elif auth_result.get("otp_required"):
            status_code = status.HTTP_200_OK
        else:
            status_code = status.HTTP_200_OK

        return Response(auth_result, status=status_code)


class VerifyOTP(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        otp_code = request.data.get("otp_code")
        device_info = request.data.get("device_info", {})

        if not email or not otp_code:
            return Response(
                {"error": True, "message": "Fadlan Buuxi Meelaaha Banaan"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = OTPService.verify_otp(
            email=email, code=otp_code, device_info=device_info
        )

        # Determine status code based on response
        if result.get("error") or result.get("isError"):
            status_code = status.HTTP_400_BAD_REQUEST
        else:
            status_code = status.HTTP_200_OK

        return Response(result, status=status_code)


class ChangePassword(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", None)
        old_password = request.data.get("old_password", None)
        new_password = request.data.get("new_password", None)

        if not all([email, old_password, new_password]):
            return Response(
                {"error": True, "message": "Fadlan Buxi Meelaha Banaan"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Password validation rules
        if len(new_password) < 8:
            return Response(
                {
                    "error": True,
                    "message": "Fure sireedka cusub waa inuu ka yaraadaa 8 xaraf",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check for at least one lowercase letter
        if not any(c.islower() for c in new_password):
            return Response(
                {
                    "error": True,
                    "message": "Fure sireedka waa inuu ka kooban yahay ugu yaraan hal xaraf yar (a-z)",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check for at least one uppercase letter
        if not any(c.isupper() for c in new_password):
            return Response(
                {
                    "error": True,
                    "message": "Fure sireedka waa inuu ka kooban yahay ugu yaraan hal xaraf weyn (A-Z)",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check for at least one digit
        if not any(c.isdigit() for c in new_password):
            return Response(
                {
                    "error": True,
                    "message": "Fure sireedka waa inuu ka kooban yahay ugu yaraan hal lambar (0-9)",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check for at least one special character
        special_characters = "!@#$%^&*()_+-=[]{}|;:,.<>?/~`\"'\\"
        if not any(c in special_characters for c in new_password):
            return Response(
                {
                    "error": True,
                    "message": "Fure sireedka waa inuu ka kooban yahay ugu yaraan hal astaamo gaar ah (!@#$%^&*()_+-=[]{}|;:,.<>?/~`\"'\\\\)",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = ChangePasswordService.change(email, old_password, new_password)

        if result.get("error"):
            status_code = status.HTTP_400_BAD_REQUEST
        else:
            status_code = status.HTTP_200_OK

        return Response(result, status=status_code)
