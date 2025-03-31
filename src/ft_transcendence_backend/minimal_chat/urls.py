from django.urls import path
from . import views

urlpatterns = [
    path('api/users/by-username/<str:username>/', views.get_user_by_username, name='get_user_by_username'),
    path('api/users/<int:user_id>/', views.get_user_by_id, name='get_user_by_id'),
    path('api/users/block/', views.block_user, name='block_user'),
    path('api/users/unblock/', views.unblock_user, name='unblock_user'),
    path('api/users/blocked/', views.get_blocked_users, name='get_blocked_users'),
] 