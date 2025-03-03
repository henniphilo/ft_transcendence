from django.db import models
from django.contrib.auth import get_user_model
from game.models import Game
# for prometheus monitoring
from django_prometheus.models import ExportModelOperationsMixin


User = get_user_model()

class Tournament(ExportModelOperationsMixin('Tournament'), models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_tournaments')
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
class TournamentPlayer(ExportModelOperationsMixin('TournamentPlayer'), models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='players')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    display_name = models.CharField(max_length=50)
    eliminated = models.BooleanField(default=False)
    
class TournamentMatch(ExportModelOperationsMixin('TournamentMatch'), models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='matches')
    game = models.OneToOneField(Game, on_delete=models.CASCADE, null=True)
    player1 = models.ForeignKey(TournamentPlayer, on_delete=models.CASCADE, related_name='matches_as_player1')
    player2 = models.ForeignKey(TournamentPlayer, on_delete=models.CASCADE, related_name='matches_as_player2')
    round_number = models.IntegerField()
    winner = models.ForeignKey(TournamentPlayer, on_delete=models.CASCADE, null=True, related_name='matches_won')