from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import User
from ..services.users_services import UserService
from ..serializers import UserSerializer


class UserCRUDView(APIView):
    """
    User CRUD view that handles all user operations.
    Uses UserService for all business logic.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, user_id=None):
        """
        Handle GET requests.
        Without user_id: List users with filtering
        With user_id: Get specific user details
        """
        if user_id:
            return self._get_user_detail(request, user_id)
        else:
            return self._list_users(request)

    def post(self, request):
        """
        Handle POST requests: Create new user
        """
        return self._create_user(request)

    def put(self, request, user_id):
        """
        Handle PUT requests: Update user
        """
        return self._update_user(request, user_id)

    def delete(self, request, user_id):
        """
        Handle DELETE requests: Soft delete user
        """
        return self._delete_user(request, user_id)

    def _list_users(self, request):
        """List users with optional filtering using UserService."""
        filters = request.query_params.dict()
        result = UserService.get_users_with_statistics(filters)

        serializer = UserSerializer(result["queryset"], many=True)
        return Response(
            {
                "error": False,
                "users": serializer.data,
                "statistics": result["statistics"],
            }
        )

    def _get_user_detail(self, request, user_id):
        """Get user details."""
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": True, "message": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = UserSerializer(user)
        return Response({"error": False, "user": serializer.data})

    def _create_user(self, request):
        """Create new user using UserService."""
        data = request.data
        avatar = request.FILES.get("avatar")

        result = UserService.create_user(
            username=data.get("username"),
            email=data.get("email"),
            phone=data.get("phone"),
            password=data.get("password"),
            first_name=data.get("first_name"),
            last_name=data.get("last_name"),
            gender=data.get("gender"),
            avatar=avatar,
            is_admin=data.get("is_admin", False),
            is_state=data.get("is_state", False),
        )

        if isinstance(result, dict) and result.get("error"):
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        serializer = UserSerializer(result)
        return Response(
            {"error": False, "user": serializer.data}, status=status.HTTP_201_CREATED
        )

    def _update_user(self, request, user_id):
        """Update user using UserService."""
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": True, "message": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        data = request.data
        avatar = request.FILES.get("avatar")

        result = UserService.update_user(user, data, avatar)

        if isinstance(result, dict) and result.get("error"):
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        serializer = UserSerializer(result)
        return Response({"error": False, "user": serializer.data})

    def _delete_user(self, request, user_id):
        """Soft delete user."""
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": True, "message": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        user.soft_delete()
        return Response({"error": False, "message": "User deleted successfully"})

    def patch(self, request, user_id):
        """
        Handle PATCH requests for specific user actions.
        Actions: change_password, reset_password, update_status
        """
        action = request.data.get("action")

        if action == "change_password":
            return self._change_user_password(request, user_id)
        elif action == "reset_password":
            return self._reset_user_password(request, user_id)
        elif action == "update_status":
            return self._update_user_status(request, user_id)
        else:
            return Response(
                {
                    "error": True,
                    "message": "Invalid action. Supported actions: change_password, reset_password, update_status",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    def _change_user_password(self, request, user_id):
        """Change user password using UserService."""
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": True, "message": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        new_password = request.data.get("new_password")
        if not new_password:
            return Response(
                {"error": True, "message": "New password is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        UserService.change_user_password(user, new_password)
        return Response({"error": False, "message": "Password changed successfully"})

    def _reset_user_password(self, request, user_id):
        """Reset user password using UserService."""
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": True, "message": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        new_password = UserService.reset_user_password(user)
        return Response(
            {
                "error": False,
                "message": "Password reset successfully",
                "new_password": new_password,
            }
        )

    def _update_user_status(self, request, user_id):
        """Update user status using UserService."""
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": True, "message": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        status_value = request.data.get("status")
        if not status_value:
            return Response(
                {"error": True, "message": "Status is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = UserService.update_user_status(user, status_value)

        if isinstance(result, dict) and result.get("error"):
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        serializer = UserSerializer(result)
        return Response({"error": False, "user": serializer.data})
