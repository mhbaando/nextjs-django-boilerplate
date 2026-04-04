from typing import Optional

from ..models import User


def find_user_by_email(email: str) -> Optional[User]:
    """
    Finds a user by their email address.

    Args:
        email: The user's email address (USERNAME_FIELD).

    Returns:
        The User object if found, otherwise None.
    """
    try:
        return User.objects.get(email=email)
    except User.DoesNotExist:
        return None


def find_user_by_id(user_id: str) -> Optional[User]:
    """
    Finds a user by their primary key.

    This is used by processes that already have the user's unique ID, such as
    JWT validation or Django's session management (`get_user`).

    Args:
        user_id: The user's primary key.

    Returns:
        The User object if found, otherwise None.
    """
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return None
