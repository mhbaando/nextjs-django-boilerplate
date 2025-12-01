from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(
        required=True,
    )
    password = serializers.CharField(
        required=True,
        write_only=True,
    )


class ChangePasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(
        required=True,
    )
    current_password = serializers.CharField(
        required=True,
        write_only=True,
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
    )
