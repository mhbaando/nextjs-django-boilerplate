from django.urls import path
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

from .views import ForceChangePassword, Login

urlpatterns = [
    path("login/", Login.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path(
        "force-change-password/",
        ForceChangePassword.as_view(),
        name="force_change_password",
    ),
]
