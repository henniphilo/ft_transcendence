import uuid

class TournamentManager:
    def __init__(self, players):
        self.players = players  # list of {"websocket": ..., "player": Player}
        self.current_round = 1
        self.total_rounds = self._calculate_total_rounds(len(players))
        self.active_matches = []  # list of (p1_entry, p2_entry)
        self.results = {}  # {winner_name: 1}
        self.match_history = []  # ← NEU: speichert alle abgeschlossenen Matches
        self.finished = False  # ← Neu: Flag, ob Turnier abgeschlossen wurde

    def _calculate_total_rounds(self, num_players):
        import math
        return math.ceil(math.log2(num_players))

    def create_matchups(self):
        from random import shuffle
        shuffle(self.players)
        self.active_matches = []

        for i in range(0, len(self.players), 2):
            if i + 1 < len(self.players):
                self.active_matches.append((self.players[i], self.players[i + 1]))
            else:
                self.results[self.players[i]["player"].name] = 1  # bye round

        return self.active_matches

    def record_result(self, winner_name):
    # Finde den richtigen Spielernamen im Turnier
        tournament_player = None
        for player_entry in self.players:
            player = player_entry["player"]
            if player.name == winner_name:
                tournament_player = player
                break
            if hasattr(player, "user_profile") and player.user_profile:
                if player.user_profile.get("username") == winner_name:
                    tournament_player = player
                    break

        if tournament_player:
            winner_name = tournament_player.name
        else:
            print(f"⚠️ Kein passender Spieler gefunden für: {winner_name}")
            return

        # Verhindere Duplikate: Match darf nur einmal gewertet werden
        if winner_name in self.results:
            print(f"⚠️ Ergebnis für {winner_name} bereits eingetragen – ignoriert.")
            return

        # Ergebnis eintragen
        self.results[winner_name] = 1
        print(f"✅ Ergebnis eingetragen: {winner_name}")

        # Matchhistorie ergänzen
        for p1_entry, p2_entry in self.active_matches:
            p1 = p1_entry["player"].name
            p2 = p2_entry["player"].name
            if winner_name in [p1, p2]:
                loser = p2 if winner_name == p1 else p1
                self.match_history.append({
                    "round": self.current_round,
                    "player1": p1,
                    "player2": p2,
                    "winner": winner_name,
                    "loser": loser
                })
                break

        # Check: Sind alle Spiele abgeschlossen?
        if len(self.results) >= len(self.active_matches):
            print("🎯 Alle Spiele abgeschlossen. Prüfe, ob Turnier beendet ist...")
            if len([p for p in self.players if p["player"].name in self.results]) == 1:
                winner = winner_name
                self.finished = True
                print(f"🏁 Turnier ist jetzt beendet! Gewinner: {winner}")


    def get_match_history(self):
        return self.match_history

    def next_round(self):
        # Nur starten, wenn Turnier noch nicht vorbei ist
        if self.is_finished():
            print("🏁 Turnier ist bereits beendet.")
            self.finished = True
            return []

        print(f"🚀 Starte Runde {self.current_round + 1}")
        
        self.current_round += 1

        # Filtere die Spieler, deren Namen in den aktuellen Ergebnissen vorkommen
        advancing = [
            entry for entry in self.players
            if entry["player"].name in self.results
        ]

        self.players = advancing
        self.results = {}  # reset für nächste Runde

        matchups = self.create_matchups()
        
        if self.is_finished():
            self.finished = True
            print(f"🏆 Turniergewinner: {self.get_winner()}")

        return matchups


    def is_finished(self):
        return len(self.players) == 1

    def get_winner(self):
        if self.is_finished():
            return self.players[0]["player"].name
        return None
    
    def get_current_matchups(self):
        return [
            {
                "player1": p1_entry["player"].name,
                "player2": p2_entry["player"].name
            }
            for p1_entry, p2_entry in self.active_matches
        ]
