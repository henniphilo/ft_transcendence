from django.urls import path
from . import views

urlpatterns = [
    path('sync_games/', views.sync_games, name='sync_games'),
    path('add_game/', views.add_game_manual, name='add_game_manual'),
    path('game/<int:index>/', views.get_game, name='get_game'),
    path('game_count/', views.get_game_count, name='get_game_count'),
]