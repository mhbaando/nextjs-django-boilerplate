from django.urls import include, path

urlpatterns = [
    path("api/v1/auth/", include("users.urls")),
    path("api/v1/token/", include("two_factor.urls")),
]
