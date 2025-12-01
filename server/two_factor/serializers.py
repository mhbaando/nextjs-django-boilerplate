from rest_framework import serializers


class Verify2FASerializer(serializers.Serializer):
    email = serializers.EmailField(
        required=True,
    )
    otp_code = serializers.CharField(
        min_length=6,
        max_length=6,
        required=True,
    )
