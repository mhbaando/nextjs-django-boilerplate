import base64
import hashlib
import hmac
import os
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from two_factor.models import TrustedDevice


class DeviceService:
    """
    A service layer for managing trusted devices and device-related security.

    This service handles the creation, signing, and verification of device IDs,
    as well as the logic for trusting a new device.
    """

    @staticmethod
    def generate_device_id() -> str:
        """Generate a secure, random, URL-safe device ID."""
        random_bytes = os.urandom(32)  # 256 bits of randomness
        return base64.urlsafe_b64encode(random_bytes).decode("utf-8")

    @staticmethod
    def sign_device_id(device_id: str) -> str:
        """
        Create a cryptographic HMAC signature for a device ID.

        This signature allows the server to verify that a device ID provided
        by a client has not been tampered with.
        """
        signature = hmac.new(
            key=settings.SECRET_KEY.encode(),
            msg=device_id.encode(),
            digestmod=hashlib.sha256,
        ).digest()
        return base64.urlsafe_b64encode(signature).decode("utf-8")

    @staticmethod
    def verify_device_id(device_id: str, signature: str) -> bool:
        """
        Verify the signature of a device ID in a constant-time manner.

        Uses `hmac.compare_digest` to prevent timing attacks.
        """
        expected_sig = DeviceService.sign_device_id(device_id)
        return hmac.compare_digest(expected_sig, signature)

    @staticmethod
    def is_new_device(user, device_id: str) -> bool:
        """
        Check if a given device_id corresponds to a currently active trusted device for the user.
        """
        if not device_id:
            return True  # No device ID always means it's a new device.

        # Check for a device that is active and has not expired.
        trusted_device = TrustedDevice.objects.filter(
            user=user,
            device_id=device_id,
            is_active=True,
            expires_at__gt=timezone.now(),
        ).first()

        return trusted_device is None

    @staticmethod
    def trust_device(user, device_info=None, days=30):
        """
        Create a new TrustedDevice record with detailed information.

        This method now captures and stores the full set of device, location,
        and network information provided by the client application.
        """
        device_info = device_info or {}

        # Extract all available information from the device_info dictionary.
        # Basic Info
        platform = device_info.get("platform")
        os_info = device_info.get("os")
        device = device_info.get("device")
        # Network Info
        ip_address = device_info.get("ip_address")
        isp = device_info.get("isp")
        org = device_info.get("org")
        # Location Info
        city = device_info.get("city")
        country = device_info.get("country")
        latitude = device_info.get("latitude")
        longitude = device_info.get("longitude")

        device_id = DeviceService.generate_device_id()
        expires_at = timezone.now() + timedelta(days=days)

        # Create the new trusted device record.
        # We use create() directly as a new device ID is always generated.
        trusted_device = TrustedDevice.objects.create(
            user=user,
            device_id=device_id,
            platform=platform,
            os=os_info,
            device=device,
            ip_address=ip_address,
            isp=isp,
            org=org,
            city=city,
            country=country,
            latitude=latitude,
            longitude=longitude,
            expires_at=expires_at,
        )

        # Generate a new signature for the client to store.
        signature = DeviceService.sign_device_id(trusted_device.device_id)

        return trusted_device, signature
