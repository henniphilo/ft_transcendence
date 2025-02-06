import random
from .models import Tournament, TournamentPlayer, TournamentMatch
from game.models import Game

class TournamentManager:
    def __init__(self, tournament_id):
        self.tournament = Tournament.objects.get(id=tournament_id)
        
    def create_matchups(self):
        """Erstellt die Spielpaarungen für die nächste Runde"""
        active_players = list(self.tournament.players.filter(eliminated=False))
        
        # Wenn ungerade Anzahl, ein Spieler bekommt Freilos
        if len(active_players) % 2 != 0:
            bye_player = random.choice(active_players)
            active_players.remove(bye_player)
        
        # Spieler zufällig mischen und Paare bilden
        random.shuffle(active_players)
        matches = []
        
        for i in range(0, len(active_players), 2):
            player1 = active_players[i]
            player2 = active_players[i + 1]
            
            # Neues Spiel erstellen
            game = Game.objects.create(
                player1=player1.user,
                player2=player2.user,
                tournament_mode=True
            )
            
            # Match erstellen
            match = TournamentMatch.objects.create(
                tournament=self.tournament,
                game=game,
                player1=player1,
                player2=player2,
                round_number=self.get_current_round()
            )
            matches.append(match)
            
        return matches
    
    def get_current_round(self):
        """Ermittelt die aktuelle Turnierrunde"""
        latest_match = self.tournament.matches.order_by('-round_number').first()
        return (latest_match.round_number + 1) if latest_match else 1
    
    def handle_match_result(self, match_id, winner_id):
        """Verarbeitet das Ergebnis eines Matches"""
        match = TournamentMatch.objects.get(id=match_id)
        winner = TournamentPlayer.objects.get(id=winner_id)
        loser = match.player2 if winner == match.player1 else match.player1
        
        match.winner = winner
        match.save()
        
        # Verlierer wird eliminiert
        loser.eliminated = True
        loser.save()
        
        # Prüfen ob Turnier beendet ist
        active_players = self.tournament.players.filter(eliminated=False)
        if active_players.count() == 1:
            self.tournament.is_active = False
            self.tournament.save()
            return True
        
        return False 