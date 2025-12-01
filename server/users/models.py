from datetime import datetime

from django.contrib.auth.models import AbstractUser
from django.db import models

from utils.models_mixin import BaseModelWithSoftDelete
from utils.validate_image import validate_image


def user_avatar_upload_path(instance, filename):
    ext = filename.split(".")[-1].lower()
    user_id = instance.id if instance.id else "new_user"
    date_str = datetime.now().strftime("%Y-%m-%d")
    return f"avatars/user/{date_str}/{user_id}.{ext}"


class User(AbstractUser, BaseModelWithSoftDelete):
    """
    Custom User model that extends Django's AbstractUser with additional fields.
    Uses custom related_name to avoid conflicts with Django's default User model.
    """

    GENDER_CHOICES = (
        ("Lab", "Lab"),
        ("Dheddig", "Dheddig"),
    )
    STATUS_CHOICES = (
        ("active", "Active"),
        ("inactive", "Inactive"),
        ("suspended", "Suspended"),
        ("blocked", "Blocked"),
    )

    # Custom fields
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=50)
    gender = models.CharField(
        max_length=10, choices=GENDER_CHOICES, null=True, blank=True
    )
    avatar = models.FileField(
        upload_to=user_avatar_upload_path,
        validators=[validate_image],
        null=True,
        blank=True,
    )
    is_admin = models.BooleanField(default=False)
    is_state = models.BooleanField(default=False)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="inactive")
    has_changed_password = models.BooleanField(default=False)

    # Use email as the username field
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        db_table = "users"
        ordering = ("-created_at",)
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return f"{self.email} ({self.username})"
