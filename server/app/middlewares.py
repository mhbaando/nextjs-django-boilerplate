from django.conf import settings
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from rest_framework import status

from utils.blocked_ip import is_ip_in_db_blocklist
from utils.ip_detection import get_client_ip_only


class IPBlockMiddleware(MiddlewareMixin):
    """
    Highly efficient middleware that checks if a client's IP is permanently blocked.

    This middleware leverages Redis caching to minimize database load. It runs on
    every request and performs the following steps:
    1.  Retrieves the client's IP address.
    2.  Calls the `is_ip_in_db_blocklist` utility, which first checks for the IP
        in a fast Redis cache.
    3.  Only if the IP is not found in the cache does it query the database.
    4.  If the IP is found to be blocked (either from cache or DB), the request
        is immediately rejected with a 403 Forbidden response.
    5.  Otherwise, the request proceeds to the next middleware or view.
    """

    def process_request(self, request):
        # 1. Get the client IP using centralized IP detection
        request_ip = get_client_ip_only(request)
        # In development mode, be more lenient about IP detection failures
        if not request_ip:
            if settings.DEBUG:
                # In development, allow requests to proceed even if IP detection fails
                return None
            else:
                # In production, deny requests with undetectable IPs for security
                return JsonResponse(
                    {
                        "error": True,
                        "message": "Unable to process your request.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # 2. Check if the IP is blocked using the efficient, cached function.
        if is_ip_in_db_blocklist(request_ip):
            # 3. Block immediately with a generic message if blocked.
            return JsonResponse(
                {
                    "error": True,
                    "message": "Access denied. Please contact support.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # 4. If not blocked, allow the request to continue.
        return None
