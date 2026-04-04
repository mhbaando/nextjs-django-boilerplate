from rest_framework import serializers

from users.models import User


class UserTableListSerializer(serializers.ModelSerializer):
    """Serializer for displaying user data in tables"""

    full_name = serializers.SerializerMethodField()
    last_login = serializers.SerializerMethodField()
    created_at = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "full_name",
            "status",
            "email",
            "phone",
            "last_login",
            "created_at",
            "gender",
        ]
        read_only_fields = ["id", "created_at", "last_login"]

    def get_full_name(self, obj):
        """Combine first_name and last_name to create full_name"""
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        elif obj.first_name:
            return obj.first_name
        elif obj.last_name:
            return obj.last_name
        return ""

    def get_last_login(self, obj):
        """Format last_login datetime"""
        if obj.last_login:
            return obj.last_login.strftime("%Y-%m-%d %H:%M:%S")
        return None

    def get_created_at(self, obj):
        """Format created_at datetime"""
        if obj.created_at:
            return obj.created_at.strftime("%Y-%m-%d %H:%M:%S")
        return None

    def to_representation(self, instance):
        """Custom representation to handle photo and fadhiga fields"""
        representation = super().to_representation(instance)

        # Add avatar field for backward compatibility with full URL
        request = self.context.get("request")
        if instance.avatar:
            if request:
                representation["avatar"] = request.build_absolute_uri(
                    instance.avatar.url
                )
            else:
                representation["avatar"] = instance.avatar.url
        else:
            representation["avatar"] = None
        return representation
