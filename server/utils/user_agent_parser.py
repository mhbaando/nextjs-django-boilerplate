# crms-next/server/utils/user_agent_parser.py

import user_agents
from ua_parser import user_agent_parser


def parse_user_agent(request):
    """
    Parses the User-Agent string from a Django request object using a primary
    and fallback parser for improved accuracy.

    This function first uses the 'ua-parser' library for detailed parsing. If
    the results are too generic (e.g., 'Other'), it falls back to the
    'user-agents' library to get more specific information, especially for
    identifying bots or mobile devices.

    Args:
        request: The Django HttpRequest object.

    Returns:
        A dictionary containing the parsed information:
        {
            'browser': 'Chrome',
            'os': 'Windows',
            'device': 'PC'
        }
        Defaults to 'Unknown' or 'Other' if parsing fails.
    """
    ua_string = request.META.get("HTTP_USER_AGENT", "")
    if not ua_string:
        return {"browser": "Unknown", "os": "Unknown", "device": "Unknown"}

    # Primary parser: ua-parser (good for detailed family info)
    parsed_ua = user_agent_parser.Parse(ua_string)

    browser = parsed_ua.get("user_agent", {}).get("family", "Unknown")
    os = parsed_ua.get("os", {}).get("family", "Unknown")
    device = parsed_ua.get("device", {}).get("family", "Other")

    # Fallback parser: user-agents (good for device type and bot detection)
    if device == "Other" or browser == "Unknown":
        try:
            ua = user_agents.parse(ua_string)

            # Determine a more specific device type
            if ua.is_pc:
                device_fallback = "PC"
            elif ua.is_tablet:
                device_fallback = "Tablet"
            elif ua.is_mobile:
                device_fallback = "Mobile"
            elif ua.is_bot:
                device_fallback = "Bot"
            else:
                device_fallback = "Other"

            # Override if the fallback is more specific
            if device == "Other":
                device = device_fallback

            # Override browser if the primary was unknown
            if browser == "Unknown" and ua.browser.family != "Other":
                browser = ua.browser.family

        except Exception:
            # If the fallback parser fails, stick with the primary results.
            pass

    return {
        "browser": browser,
        "os": os,
        "device": device,
    }
