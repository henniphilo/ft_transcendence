from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from .models import Gamestats
from .serializers import GamestatsSerializer

class GamestatsViewSet(viewsets.ModelViewSet):
    queryset = Gamestats.objects.all().order_by('-created_at')
    serializer_class = GamestatsSerializer
