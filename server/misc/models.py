from django.db import models

from utils.models_mixin import BaseModelWithSoftDelete


# Create your models here.
class BlockedIP(BaseModelWithSoftDelete):
    blocked_ip = models.CharField(max_length=255, unique=True)
    blocked_at = models.DateTimeField(auto_now_add=True)
    is_blocked = models.BooleanField(default=True)

    class Meta:
        db_table = "blocked_ips"
        ordering = ("-blocked_at",)
        verbose_name = "Blocked IP"
        verbose_name_plural = "Blocked IPs"

    def __str__(self):
        return self.blocked_ip
