"""
Centralized IP detection utility for consistent IP address extraction across the Django application.

This module provides a unified interface for extracting client IP addresses from requests,
ensuring consistent behavior across all views, middleware, and utilities that need IP information.
The configuration is centralized here to follow the DRY principle and make maintenance easier.
"""

from ipware import get_client_ip

# Headers that ipware will check for client IP (in order of preference).
# The `ipware` library will automatically fall back to `request.META['REMOTE_ADDR']`
# if no IP is found in these headers, which is the desired behavior.
IP_HEADERS = [
    "HTTP_X_FORWARDED_FOR",  # Standard proxy header (set by Next.js proxy)
    "HTTP_X_REAL_IP",  # Common proxy header (set by Next.js proxy)
    "HTTP_CF_CONNECTING_IP",  # Cloudflare
    "HTTP_TRUE_CLIENT_IP",  # Akamai and others
    "HTTP_X_VERCEL_FORWARDED_FOR",  # Vercel
]


def get_client_ip_address(request):
    """
    Extract the client's IP address from the request using centralized configuration.

    This function wraps ipware's get_client_ip with our custom header configuration
    to ensure consistent IP detection across the entire application.

    Args:
        request: Django HttpRequest object

    Returns:
        tuple: (ip_address: str, is_routable: bool)
    """
    return get_client_ip(request, request_header_order=IP_HEADERS)


def get_client_ip_only(request):
    """
    Extract only the client's IP address (without routable flag).

    This is a convenience function for cases where you only need the IP address
    and don't care about the routable status.

    Args:
        request: Django HttpRequest object

    Returns:
        str: The client's IP address, or None if not detectable
    """
    ip_address, _ = get_client_ip_address(request)
    return ip_address


def is_ip_routable(request):
    """
    Check if the client's IP address is routable (public).

    This is useful for security checks and geolocation purposes.

    Args:
        request: Django HttpRequest object

    Returns:
        bool: True if the IP is routable, False otherwise
    """
    _, is_routable = get_client_ip_address(request)
    return is_routable


def get_user_agent(request):
    """
    Extracts the User-Agent string from the request.

    Args:
        request: Django HttpRequest object

    Returns:
        str: The User-Agent string, or an empty string if not found.
    """
    return request.META.get("HTTP_USER_AGENT", "")
