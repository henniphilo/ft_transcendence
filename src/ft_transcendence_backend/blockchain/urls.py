from django.urls import path
from . import views

urlpatterns = [
    path('add-score/', views.add_tournament_score, name='add_score'),
    path('get-scores/<int:tournament_id>/', views.get_tournament_scores_view, name='get_scores'),
]