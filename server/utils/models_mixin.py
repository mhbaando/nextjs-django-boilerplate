"""
Django model mixins for common fields and functionality.
Provides base fields: UUID ID, created_at, and updated_at.
"""

import uuid

from django.db import models


class UUIDMixin(models.Model):
    """
    Mixin that adds a UUID primary key field.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        verbose_name="Unique identifier",
    )

    class Meta:
        abstract = True


class TimestampMixin(models.Model):
    """
    Mixin that adds created_at and updated_at timestamp fields.
    """

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created at")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated at")

    class Meta:
        abstract = True


class BaseModel(UUIDMixin, TimestampMixin):
    """
    Base model that includes both UUID primary key and timestamp fields.
    This is the recommended base model for most Django models.
    """

    class Meta:
        abstract = True


class SoftDeleteMixin(models.Model):
    """
    Mixin that adds soft delete functionality with deleted_at field.
    """

    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="Deleted at")

    @property
    def is_deleted(self):
        """Check if the record is soft deleted."""
        return self.deleted_at is not None

    def soft_delete(self):
        """Soft delete the record by setting deleted_at to current time."""
        from django.utils import timezone

        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        """Restore a soft deleted record."""
        self.deleted_at = None
        self.save()

    class Meta:
        abstract = True


class BaseModelWithSoftDelete(BaseModel, SoftDeleteMixin):
    """
    Base model that includes standard fields and soft delete functionality.
    """

    class Meta:
        abstract = True


# Example usage:
"""
class User(BaseModelWithSoftDelete):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)

    class Meta:
        db_table = "users"
        ordering = ("-created_at",)

class Organization(BaseModel):
    name = models.CharField(max_length=255, unique=True)

    class Meta:
        db_table = "organizations"
        ordering = ("name",)
"""
