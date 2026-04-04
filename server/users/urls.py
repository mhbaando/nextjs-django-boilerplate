from django.urls import path
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

from .views import AuthView, UserCRUDView

urlpatterns = [
    # Authentication endpoints (all handled by AuthView)
    path("auth/", AuthView.as_view(), name="auth"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # User CRUD endpoints (all handled by UserCRUDView)
    path("users/", UserCRUDView.as_view(), name="users"),
    path("users/<uuid:user_id>/", UserCRUDView.as_view(), name="user_detail"),
]
