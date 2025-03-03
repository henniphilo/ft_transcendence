from rest_framework import serializers
from .models import Gamestats

class GamestatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gamestats
        fields = '__all__'  # gibt alle Felder zurück
