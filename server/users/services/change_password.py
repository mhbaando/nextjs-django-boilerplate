import re

from django.db import transaction

from .user_lookup_service import find_user_by_email


class ChangePasswordService:
    @staticmethod
    @transaction.atomic
    def change(email: str, old_password: str, new_password: str):
        user = find_user_by_email(email)

        if not user or not user.check_password(old_password):
            return {
                "error": True,
                "message": "Invalid email or password.",
            }

        # Check if new password is different from old
        if old_password == new_password:
            return {
                "error": True,
                "message": "New password cannot be the same as old password",
            }

        # Update password on the user object
        user.set_password(new_password)
        user.has_changed_password = True
        user.save()

        #  TODO: Notify Via Email, password Changed

        return {
            "error": False,
            "message": "Password changed successfully",
        }
