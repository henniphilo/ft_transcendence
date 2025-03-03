from .models import CustomUser

class Leaderboard:
    @staticmethod
    def get_top_players(limit=10):
        """
        Holt die Top-Spieler aus der Datenbank, sortiert nach Score
        """
        return CustomUser.objects.order_by('-score')[:limit].values(
            'username',
            'score'
        ) 