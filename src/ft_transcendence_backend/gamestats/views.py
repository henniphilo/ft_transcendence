from django.shortcuts import render

# # Create your views here.
# from rest_framework import viewsets
# from .models import Gamestats
# from .serializers import GamestatsSerializer

# class GamestatsViewSet(viewsets.ModelViewSet):
#     queryset = Gamestats.objects.all().order_by('-created_at')
#     serializer_class = GamestatsSerializer


from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from .models import Gamestats
from .serializers import GamestatsSerializer

User = get_user_model()

class GamestatsViewSet(viewsets.ModelViewSet):
    queryset = Gamestats.objects.all().order_by('-created_at')
    serializer_class = GamestatsSerializer

    @action(detail=False, methods=['get'], url_path='user/(?P<user_id>[^/.]+)')
    def by_user(self, request, user_id=None):
        games = Gamestats.objects.filter(
            models.Q(player1__id=user_id) | models.Q(player2__id=user_id)
        ).order_by('-created_at')
        serializer = self.get_serializer(games, many=True)
        return Response(serializer.data)
        
    @action(detail=False, methods=['get'], url_path='username/(?P<username>[^/.]+)')
    def by_username(self, request, username=None):
        # Finde den Benutzer anhand des Benutzernamens
        user = get_object_or_404(User, username=username)
        
        # Finde alle Spiele, bei denen der Benutzer teilgenommen hat
        games = Gamestats.objects.filter(
            models.Q(player1=user) | models.Q(player2=user)
        ).order_by('-created_at')
        
        serializer = self.get_serializer(games, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='leaderboard')
    def leaderboard(self, request):
        from django.db.models import Count

        winners = Gamestats.objects.values('winner__username').annotate(
            wins=Count('winner')
        ).order_by('-wins')

        return Response(winners)