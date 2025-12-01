from django.core.cache import cache
from django.http import JsonResponse
from rest_framework import status

from misc.models import BlockedIP
from utils.ip_detection import get_client_ip_only

MAX_ATTEMPTS = 5
REDIS_EXPIRE_SECONDS = 60 * 15  # 15 minutes


def is_ip_in_db_blocklist(ip_address: str) -> bool:
    """
    Checks the SQL database to see if this IP is permanently blocked.
    Uses Redis cache to avoid frequent database queries.
    """
    cache_key = f"blocked_ip:{ip_address}"

    # Check Redis cache first
    cached_result = cache.get(cache_key)
    if cached_result is not None:
        return bool(cached_result)

    # Query database if not in cache
    is_blocked = BlockedIP.objects.filter(
        blocked_ip=ip_address, is_blocked=True
    ).exists()

    # Cache the result for 5 minutes
    cache.set(cache_key, is_blocked, timeout=300)

    return is_blocked


def increment_attempts_in_redis(ip_address: str) -> int:
    """
    Safely increments the failed login attempts for a given IP in Redis.
    If the counter for the IP does not exist, it initializes it to 1.
    Returns the new count of attempts.
    """
    key = f"login_attempts:{ip_address}"
    try:
        # The `incr` method in django-redis raises a ValueError if the key
        # does not exist. We handle this to initialize the key.
        attempts = cache.incr(key)
    except ValueError:
        # Key does not exist, so this is the first failed attempt.
        # We set the key to 1 and apply the expiration time.
        cache.set(key, 1, timeout=REDIS_EXPIRE_SECONDS)
        attempts = 1
    return attempts


def reset_attempts_in_redis(ip_address: str):
    """
    Clear the attempts counter in Redis for this IP.
    """
    key = f"login_attempts:{ip_address}"
    cache.delete(key)


def permanently_block_ip(ip_address: str):
    """
    Create or update the block record in the DB. This is your 'permanent' block logic
    until an admin unblocks it.
    """
    blocked_ip_obj, created = BlockedIP.objects.get_or_create(
        blocked_ip=ip_address, defaults={"is_blocked": True}
    )

    if not created and not blocked_ip_obj.is_blocked:
        blocked_ip_obj.is_blocked = True
        blocked_ip_obj.save()

    # Update Redis cache
    cache_key = f"blocked_ip:{ip_address}"
    cache.set(cache_key, True, timeout=300)

    # Reset attempts in Redis
    reset_attempts_in_redis(ip_address)


def block_ip(request):
    """
    Main IP blocking logic. Call this in views that handle sensitive actions.
    """
    request_ip = get_client_ip_only(request)
    if not request_ip:
        return JsonResponse(
            {"error": True, "message": "Your request cannot be processed."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if is_ip_in_db_blocklist(request_ip):
        return JsonResponse(
            {
                "error": True,
                "message": "Access denied. Please contact support.",
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    attempts = increment_attempts_in_redis(request_ip)

    if attempts >= MAX_ATTEMPTS:
        permanently_block_ip(request_ip)
        return JsonResponse(
            {
                "error": True,
                "message": "Helitaanka waa la diiday. Fadlan la xiriir taageerada.",
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    # Return None to indicate the request can proceed
    return None
