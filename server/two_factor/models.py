import os
import random
import secrets
import string
import uuid

from cryptography.fernet import Fernet
from django.conf import settings
from django.db import models
from django.utils import timezone
from django_otp.models import Device

from utils.models_mixin import BaseModel


class AdvancedOTPDevice(Device):
    """
    An advanced OTP device with features like encryption, rate limiting,
    exponential backoff, and temporary locking to prevent brute-force attacks.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Encrypted OTP
    otp_encrypted = models.CharField(max_length=256, blank=True, null=True)

    # Timestamps
    otp_created_at = models.DateTimeField(blank=True, null=True)
    otp_expiry = models.DateTimeField(blank=True, null=True)

    # Usage & Security
    used = models.BooleanField(default=False)
    failed_attempts = models.PositiveIntegerField(default=0)
    max_failed_attempts = models.PositiveIntegerField(default=5)  # Stricter policy

    # Request Limits / Cooldowns
    last_request_time = models.DateTimeField(blank=True, null=True)
    next_allowed_request_time = models.DateTimeField(blank=True, null=True)
    cooldown_multiplier = models.FloatField(default=2.0)  # Exponential backoff factor

    # Lockout until a certain time if we exceed failed attempts
    lock_until = models.DateTimeField(blank=True, null=True)

    def _get_cipher(self):
        """
        Returns a Fernet cipher instance using the SECRET_KEY from environment variables.
        """
        secret_key = os.getenv("DJANGO_SECRET_KEY")
        if not secret_key:
            raise ValueError("SECRET_KEY environment variable not set.")
        return Fernet(secret_key.encode())

    def generate_token(
        self,
        code_length=6,
        valid_for_seconds=300,
        base_cooldown=60,
        random_wait_range=(5, 15),
    ):
        """
        Generates a one-time token with rate limiting and exponential cooldown.
        """
        now = timezone.now()
        fields_to_update = []

        # 1️⃣ **Check for rate limiting**
        if self.next_allowed_request_time and now < self.next_allowed_request_time:
            remaining_seconds = int(
                (self.next_allowed_request_time - now).total_seconds()
            )
            minutes = remaining_seconds // 60
            seconds = remaining_seconds % 60

            if minutes > 0:
                message = f"Please wait before requesting another OTP. You can try again in {minutes} minutes."
            else:
                message = f"Please wait before requesting another OTP. You can try again in {seconds} seconds."

            return {
                "error": True,
                "message": message,
                "status_code": 429,
            }  # HTTP 429 Too Many Requests

        # 2️⃣ **Auto-unlock device if lock period has expired**
        if self.lock_until and now >= self.lock_until:
            self.lock_until = None
            self.failed_attempts = 0
            fields_to_update.extend(["lock_until", "failed_attempts"])

        # 3️⃣ **Check if the device is locked**
        if self.lock_until and now < self.lock_until:
            remaining_lock_time = int((self.lock_until - now).total_seconds())
            minutes = remaining_lock_time // 60
            seconds = remaining_lock_time % 60

            if minutes > 0:
                message = f"Your device is temporarily locked. Please try again in {minutes} minutes."
            else:
                message = f"Your device is temporarily locked. Please try again in {seconds} seconds."

            return {
                "error": True,
                "message": message,
                "status_code": 423,
            }  # HTTP 423 LOCKED

        # 4️⃣ **Generate OTP**
        code = "".join(secrets.choice(string.digits) for _ in range(code_length))
        cipher = self._get_cipher()
        encrypted_otp = cipher.encrypt(code.encode()).decode()

        # 5️⃣ **Set OTP metadata**
        self.otp_encrypted = encrypted_otp
        self.otp_created_at = now
        self.otp_expiry = now + timezone.timedelta(seconds=valid_for_seconds)
        self.used = False

        # Reset failed attempts for the new token, but calculate cooldown before resetting
        cooldown_seconds = base_cooldown * (
            self.cooldown_multiplier**self.failed_attempts
        )
        self.failed_attempts = 0
        self.last_request_time = now

        self.next_allowed_request_time = now + timezone.timedelta(
            seconds=cooldown_seconds
        )

        # Apply random wait offset to make timing attacks harder
        min_wait, max_wait = random_wait_range
        random_offset = random.randint(min_wait, max_wait) if max_wait > min_wait else 0
        self.next_allowed_request_time += timezone.timedelta(seconds=random_offset)

        fields_to_update.extend(
            [
                "otp_encrypted",
                "otp_created_at",
                "otp_expiry",
                "used",
                "failed_attempts",
                "last_request_time",
                "next_allowed_request_time",
            ]
        )

        self.save(update_fields=list(set(fields_to_update)))

        return {
            "error": False,
            "message": "OTP generated successfully.",
            "otp_code": code,  # REMINDER: Remove this in production!
        }

    def verify_token(self, token):
        """
        Verifies the OTP, handles failures, and locks the device if necessary.
        """
        now = timezone.now()

        # 1️⃣ **Check if locked out**
        if self.lock_until and now < self.lock_until:
            remaining_seconds = int((self.lock_until - now).total_seconds())
            minutes = remaining_seconds // 60
            seconds = remaining_seconds % 60

            if minutes > 0:
                message = (
                    f"Too many failed attempts. Please try again in {minutes} minutes."
                )
            else:
                message = (
                    f"Too many failed attempts. Please try again in {seconds} seconds."
                )

            return {"error": True, "message": message}

        # 2️⃣ **Ensure an OTP was generated**
        if not self.otp_encrypted:
            return {"error": True, "message": "Invalid OTP."}

        # 3️⃣ **Check if OTP is expired**
        if self.otp_expiry and now > self.otp_expiry:
            return {"error": True, "message": "This OTP has expired."}

        # 4️⃣ **Check if OTP is already used**
        if self.used:
            return {"error": True, "message": "This OTP has already been used."}

        # 5️⃣ **Verify OTP**
        try:
            cipher = self._get_cipher()
            decrypted_otp = cipher.decrypt(self.otp_encrypted.encode()).decode()
        except Exception:
            return {
                "error": True,
                "message": "An error occurred. Please try again.",
            }

        if decrypted_otp != token:
            self.failed_attempts += 1
            fields_to_update = ["failed_attempts"]

            # Lock the device if failed attempts exceed the maximum
            if self.failed_attempts >= self.max_failed_attempts:
                min_lock_time = 5 * 60  # 5 minutes
                max_lock_time = 10 * 60  # 10 minutes
                random_lock_time = random.randint(min_lock_time, max_lock_time)
                self.lock_until = now + timezone.timedelta(seconds=random_lock_time)
                fields_to_update.append("lock_until")

                self.save(update_fields=fields_to_update)

                lock_minutes = random_lock_time // 60
                lock_seconds = random_lock_time % 60
                lock_message = f"Too many failed attempts. Please try again in {lock_minutes} minutes and {lock_seconds} seconds."
                return {"error": True, "message": lock_message}

            self.save(update_fields=fields_to_update)
            return {
                "error": True,
                "message": "Invalid OTP. Please try again.",
            }

        # ✅ **On successful verification, mark as used and reset security fields**
        self.used = True
        self.failed_attempts = 0
        self.lock_until = None
        self.otp_encrypted = None  # Invalidate the OTP
        self.save(
            update_fields=["used", "failed_attempts", "lock_until", "otp_encrypted"]
        )

        return {"error": False, "message": "OTP verified successfully."}


class TrustedDevice(BaseModel):
    """
    Represents a browser or device that a user has trusted.
    OTP verification can be bypassed for these devices, providing a "remember me" functionality.
    This also serves as a session management table.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="trusted_devices",
    )
    # A long, random, unguessable string stored in a secure cookie.
    device_id = models.CharField(max_length=255, unique=True, db_index=True)

    # Parsed User-Agent information for user-friendly display.
    browser = models.CharField(max_length=100)
    os = models.CharField(max_length=100)
    device = models.CharField(max_length=100)

    # Location information derived from IP for better user context.
    ip_address = models.GenericIPAddressField(
        null=True, blank=True, help_text="The IP address of the trusted device."
    )

    # Location information derived from IP for better user context.
    city = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)

    # Timestamps for session management and display.
    last_login = models.DateTimeField(auto_now=True)

    # Security controls
    expires_at = models.DateTimeField(
        default=None, help_text="When this trusted device will expire"
    )
    is_active = models.BooleanField(default=True)
    max_sessions = models.PositiveIntegerField(
        default=5, help_text="Maximum number of concurrent trusted devices allowed"
    )

    class Meta:
        db_table = "trusted_devices"
        ordering = ["-last_login"]
        # A user can't have duplicate device IDs, and a device ID must be unique per user.
        unique_together = ("user", "device_id")
        verbose_name = "Trusted Device"
        verbose_name_plural = "Trusted Devices"

    def __str__(self):
        return f"{self.user.email} on {self.browser} ({self.os})"

    @property
    def is_expired(self):
        """Check if the trusted device has expired."""
        return timezone.now() > self.expires_at

    @classmethod
    def cleanup_expired_devices(cls):
        """Remove expired trusted devices."""
        expired_devices = cls.objects.filter(expires_at__lt=timezone.now())
        count = expired_devices.count()
        expired_devices.delete()
        return count

    @classmethod
    def enforce_session_limits(cls, user):
        """Enforce maximum concurrent trusted devices per user."""
        active_devices = cls.objects.filter(user=user, is_active=True)

        if active_devices.count() > cls._meta.get_field("max_sessions").default:
            # Remove oldest devices beyond the limit
            excess_count = (
                active_devices.count() - cls._meta.get_field("max_sessions").default
            )
            # Identify the primary keys of the oldest devices to remove.
            devices_to_remove_ids = list(
                active_devices.order_by("last_login").values_list("id", flat=True)[
                    :excess_count
                ]
            )
            # Perform the delete on a new queryset filtered by those IDs.
            if devices_to_remove_ids:
                cls.objects.filter(id__in=devices_to_remove_ids).delete()

    def deactivate(self):
        """Deactivate this trusted device."""
        self.is_active = False
        self.save(update_fields=["is_active"])

    def save(self, *args, **kwargs):
        """Override save to set default expiration if not set."""
        if not self.expires_at:
            self.expires_at = timezone.now() + timezone.timedelta(days=30)
        super().save(*args, **kwargs)

    def renew(self, days=30):
        """Renew the trusted device expiration."""
        self.expires_at = timezone.now() + timezone.timedelta(days=days)
        self.save(update_fields=["expires_at"])
