# Create your models here.
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Gamestats(models.Model):
    game_id = models.AutoField(primary_key=True)
    player1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name="gamestats_as_player1")
    player2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name="gamestats_as_player2")
    player1_username = models.CharField(max_length=150)
    player2_username = models.CharField(max_length=150)
    player1_score = models.IntegerField()
    player2_score = models.IntegerField()
    winner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="gamestats_won")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Game {self.game_id}: {self.player1_username} vs {self.player2_username}"
