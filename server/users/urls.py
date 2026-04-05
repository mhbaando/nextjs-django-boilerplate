from django.urls import path
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

from .views import UserCRUDView
from .views.auth import ChangePassword, LoginView, VerifyOTP

urlpatterns = [
    # Authentication endpoints (all handled by AuthView)
    path("", LoginView.as_view(), name="sign_in"),
    path("verify_otp", VerifyOTP.as_view(), name="verify_otp"),
    path("change_password", ChangePassword.as_view(), name="chnage_password"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # User CRUD endpoints (all handled by UserCRUDView)
    path("users/", UserCRUDView.as_view(), name="users"),
    path("users/<uuid:user_id>/", UserCRUDView.as_view(), name="user_detail"),
]
