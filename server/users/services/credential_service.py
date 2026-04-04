from typing import Optional

from ..models import User

from .user_lookup_service import find_user_by_email


class CredentialService:
    """
    Handles user credential verification.
    """

    @staticmethod
    def verify(email: str, password: str) -> Optional[User]:
        """
        Verifies a user's credentials (email and password).

        Args:
            email: The user's email address.
            password: The user's password.

        Returns:
            The authenticated User object, or None if authentication fails.
        """
        user = find_user_by_email(email)

        if user and user.check_password(password) and user.is_active:
            return user

        return None
