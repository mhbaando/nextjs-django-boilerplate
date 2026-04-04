import random
import string
from typing import Any, Dict, Optional

from django.core.files.uploadedfile import UploadedFile
from django.db import transaction
from django.db.models import Case, Count, IntegerField, Q, When

from ..models import User


class UserService:
    """
    Provides a suite of services for managing user-related operations.

    This service layer abstracts the logic for creating, updating, and querying
    users.
    """

    @staticmethod
    def generate_strong_password(length: int = 12) -> str:
        """
        Generates a cryptographically strong random password.

        The password is guaranteed to contain at least one lowercase letter,
        one uppercase letter, one digit, and one special symbol.

        Args:
            length: The desired length of the password. Minimum is 8.

        Returns:
            A string containing the generated strong password.
        """
        if length < 8:
            length = 8

        # Define character sets for password generation
        lowercase = string.ascii_lowercase
        uppercase = string.ascii_uppercase
        digits = string.digits
        symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?"

        # Ensure the password contains at least one character from each set
        password_chars = [
            random.choice(lowercase),
            random.choice(uppercase),
            random.choice(digits),
            random.choice(symbols),
        ]

        # Fill the remaining length with a random selection from all characters
        all_chars = lowercase + uppercase + digits + symbols
        password_chars.extend(random.choice(all_chars) for _ in range(length - 4))

        # Shuffle the list to ensure randomness
        random.shuffle(password_chars)

        return "".join(password_chars)

    @staticmethod
    def get_users_with_statistics(filters: Optional[Dict[str, Any]] = None):
        """
        Retrieves a queryset of users along with account status statistics.

        Args:
            filters: A dictionary of filters to apply to the user query.

        Returns:
            A dictionary containing the filtered queryset and statistics.
        """
        queryset = User.objects.all()

        if filters:
            filter_conditions = Q()
            if "name" in filters:
                name_term = filters["name"]
                filter_conditions &= Q(first_name__icontains=name_term) | Q(
                    last_name__icontains=name_term
                )
            if "email" in filters:
                filter_conditions &= Q(email__icontains=filters["email"])
            if "username" in filters:
                filter_conditions &= Q(username__icontains=filters["username"])
            if "phone" in filters:
                filter_conditions &= Q(phone__icontains=filters["phone"])

            queryset = queryset.filter(filter_conditions)

        # Aggregate statistics in a single, efficient database query
        stats_aggregation = queryset.aggregate(
            total=Count("id"),
            active=Count(
                Case(When(status="active", then=1), output_field=IntegerField())
            ),
            inactive=Count(
                Case(When(status="inactive", then=1), output_field=IntegerField())
            ),
            suspended=Count(
                Case(When(status="suspended", then=1), output_field=IntegerField())
            ),
            blocked=Count(
                Case(When(status="blocked", then=1), output_field=IntegerField())
            ),
        )

        statistics = {
            "total": stats_aggregation.get("total", 0),
            "active": stats_aggregation.get("active", 0),
            "inactive": stats_aggregation.get("inactive", 0),
            "suspended": stats_aggregation.get("suspended", 0),
            "blocked": stats_aggregation.get("blocked", 0),
        }

        return {"queryset": queryset.order_by("-created_at"), "statistics": statistics}

    @staticmethod
    def create_user(
        username: str,
        email: str,
        phone: str,
        password: str,
        first_name: str,
        last_name: str,
        gender: str,
        avatar: Optional[UploadedFile],
        **extra_fields,
    ):
        """
        Creates a new user in the system.

        Returns:
            The created User object or a dictionary with an error message.
        """
        if avatar:
            validation_error = UserService._validate_avatar_file(avatar)
            if validation_error:
                return validation_error

        # Check for existing user with same email or username
        if User.objects.filter(
            Q(email__iexact=email) | Q(username__iexact=username)
        ).exists():
            return {
                "error": True,
                "message": "User with same email or username already exists.",
            }

        generated_password = None
        if not password:
            generated_password = UserService.generate_strong_password()
            password = generated_password

        with transaction.atomic():
            user = User(
                username=username,
                email=User.objects.normalize_email(email),
                phone=phone,
                first_name=first_name,
                last_name=last_name,
                gender=gender,
                **extra_fields,
            )
            if avatar:
                user.avatar = avatar
            user.set_password(password)
            user.save()

            if generated_password:
                user._generated_password = generated_password

        # TODO: Implement email notification for the new user
        return user

    @staticmethod
    def update_user(user: User, data: dict, avatar: Optional[UploadedFile] = None):
        """Updates a user's information."""
        protected_fields = ["password"]

        with transaction.atomic():
            for field, value in data.items():
                if field in protected_fields:
                    continue
                setattr(user, field, value)

            if avatar:
                validation_error = UserService._validate_avatar_file(avatar)
                if validation_error:
                    return validation_error
                user.avatar.save(avatar.name, avatar, save=False)

            user.save()
        return user

    @staticmethod
    def change_user_password(user: User, new_password: str) -> None:
        """Changes a user's password and marks it as changed."""
        user.set_password(new_password)
        user.has_changed_password = True
        user.save(update_fields=["password", "has_changed_password"])

    @staticmethod
    def reset_user_password(user: User) -> str:
        """Resets a user's password and requires them to change it on next login."""
        new_password = UserService.generate_strong_password()
        user.set_password(new_password)
        user.has_changed_password = False
        user.save(update_fields=["password", "has_changed_password"])
        return new_password

    @staticmethod
    def update_user_status(user: User, status: str):
        """Updates the status of a user account."""
        valid_statuses = [choice[0] for choice in User.STATUS_CHOICES]
        if status not in valid_statuses:
            return {"error": True, "message": "Xaalada Lama soo helin"}

        user.status = status
        user.save(update_fields=["status"])
        return user

    @staticmethod
    def _validate_avatar_file(avatar_file: UploadedFile):
        """Validates the user's avatar file for extension and size."""
        allowed_extensions = [".jpg", ".jpeg", ".png"]
        file_name = avatar_file.name.lower()

        if not any(file_name.endswith(ext) for ext in allowed_extensions):
            return {
                "error": True,
                "message": "Kaliya Jpeg ama Png Sawir ah ayaa la ogolyahay",
            }

        max_size = 2 * 1024 * 1024  # 2MB in bytes
        if avatar_file.size > max_size:
            return {"error": True, "message": "2Mb kabada masoo upload greyn kartid"}
        return None
