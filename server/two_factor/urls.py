from django.urls import path

from .views import Verify2Fa

urlpatterns = [
    path("verify-otp/", Verify2Fa.as_view(), name="login"),
]
