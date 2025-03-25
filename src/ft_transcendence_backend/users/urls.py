from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterUserView, send_verification_code, verify_code, get_leaderboard, get_current_user_stats  # 👈 Fehlende Funktionen importiert!

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

urlpatterns += [
    path('leaderboard/', get_leaderboard, name='leaderboard'),
]

urlpatterns += [
    path('current-stats/', get_current_user_stats, name='current-user-stats'),
]

from .views import logout_view
urlpatterns += [
    path("logout/", logout_view, name="logout"),
]

from .views import get_online_users
urlpatterns += [
    path("online-users/", get_online_users, name="online_users"),
]

from .views import add_friend, remove_friend, list_friends

urlpatterns += [
    path('friends/add/<str:username>/', add_friend, name='add-friend'),
    path('friends/remove/<str:username>/', remove_friend, name='remove-friend'),
    path('friends/list/', list_friends, name='list-friends'),
]

from .views import get_user_profile

urlpatterns += [
    path('profile/<str:username>/', get_user_profile, name='get_user_profile'),
]
