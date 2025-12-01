from rest_framework.exceptions import Throttled
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    """
    Custom exception handler for Django REST Framework.

    This handler intercepts the `Throttled` exception and formats the response
    to match the standard API error format: `{"error": True, "message": "..."}`.

    For all other exceptions, it falls back to the default DRF exception handler,
    ensuring consistent behavior for validation errors, authentication errors, etc.
    """
    # First, get the standard error response from the default DRF exception handler.
    response = exception_handler(exc, context)

    # Now, check if the raised exception is a Throttled exception.
    if isinstance(exc, Throttled):
        # If the default handler has generated a response, we'll override its data.
        if response is not None:
            # Create the custom response data in the desired format with a generic message
            # to avoid leaking information about the throttle delay.
            custom_data = {
                "error": True,
                "message": "Too many requests. Please try again later.",
            }

            # Replace the default response data with our custom format.
            response.data = custom_data

    # Return the response, which is either the modified one or the default one.
    return response
