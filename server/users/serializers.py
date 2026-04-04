from rest_framework import serializers

from .models import User


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


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "gender",
            "avatar",
            "is_admin",
            "is_state",
            "status",
            "has_changed_password",
            "is_active",
            "date_joined",
            "last_login",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "has_changed_password",
            "date_joined",
            "last_login",
            "created_at",
            "updated_at",
        ]

    def validate_email(self, value):
        """
        Validate that email is unique.
        """
        if self.instance and self.instance.email == value:
            return value

        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value):
        """
        Validate that username is unique.
        """
        if self.instance and self.instance.username == value:
            return value

        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError(
                "A user with this username already exists."
            )
        return value
