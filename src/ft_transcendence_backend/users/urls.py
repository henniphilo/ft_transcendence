from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterUserView, send_verification_code, verify_code  # 👈 Fehlende Funktionen importiert!

urlpatterns = [
    path('register/', RegisterUserView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

urlpatterns += [
    path('verify/send/', send_verification_code, name='send_verification_code'),
    path('verify/', verify_code, name='verify_code'),
]

from .views import user_profile

urlpatterns += [
    path('profile/', user_profile, name='user_profile'),
]
