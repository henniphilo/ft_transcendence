import uuid
import math
from random import shuffle

class TournamentManager:
    def __init__(self, players):
        self.players = players  # list of {"websocket": ..., "player": Player}
        self.current_round = 1
        self.total_rounds = self._calculate_total_rounds(len(players))
        self.active_matches = []  # list of (p1_entry, p2_entry)
        self.results = {}  # {winner_name: 1}
        self.match_history = []  # speichert alle abgeschlossenen Matches
        self.finished = False

        # Neu: für KO-Finale & Spiel um Platz 3
        self.final_match = None
        self.third_place_match = None
        self.final_result = None
        self.third_place_result = None

        print(f"📋 Turniermanager initialisiert mit {len(players)} Spielern")

    def _calculate_total_rounds(self, num_players):
        return math.ceil(math.log2(num_players))

    def create_matchups(self):
        shuffle(self.players)
        self.active_matches = []

        for i in range(0, len(self.players), 2):
            if i + 1 < len(self.players):
                self.active_matches.append((self.players[i], self.players[i + 1]))
            else:
                name = self.players[i]["player"].name
                self.results[name] = 1  # bye round
                print(f"🛋️ {name} bekommt ein Freilos")

        return self.active_matches

    def record_result(self, winner_name):
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

        # Finale?
        if self.final_match:
            p1 = self.final_match[0]["player"].name
            p2 = self.final_match[1]["player"].name
            if winner_name in [p1, p2]:
                loser = p2 if winner_name == p1 else p1
                self.final_result = {"winner": winner_name, "loser": loser}
                self.finished = True
                print(f"🏁 Turnier ist jetzt beendet! Gewinner: {winner_name}")
                return

        # Spiel um Platz 3?
        if self.third_place_match:
            p1 = self.third_place_match[0]["player"].name
            p2 = self.third_place_match[1]["player"].name
            if winner_name in [p1, p2]:
                loser = p2 if winner_name == p1 else p1
                self.third_place_result = {"winner": winner_name, "loser": loser}
                print(f"🥉 Spiel um Platz 3 gewonnen: {winner_name}")
                return

        if winner_name in self.results:
            print(f"⚠️ Ergebnis für {winner_name} bereits eingetragen – ignoriert.")
            return

        self.results[winner_name] = 1
        print(f"✅ Ergebnis eingetragen: {winner_name}")

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

        if len(self.results) >= len(self.active_matches):
            print("🎯 Alle Spiele abgeschlossen. Prüfe, ob Turnier beendet ist...")
            if len([p for p in self.players if p["player"].name in self.results]) == 1:
                winner = winner_name
                self.finished = True
                print(f"🏁 Turnier ist jetzt beendet! Gewinner: {winner}")

    def next_round(self):
        if self.is_finished():
            print("🏁 Turnier ist bereits beendet.")
            self.finished = True
            return []

        self.current_round += 1
        print(f"🚀 Starte Runde {self.current_round}")

        advancing = [
            entry for entry in self.players
            if entry["player"].name in self.results
        ]
        self.players = advancing
        self.results = {}

        matchups = self.create_matchups()

        # 💡 Hier ist das neue Log:
        print("🔮 Vorschau auf neue Matchups:")
        for p1, p2 in matchups:
            print(f"   ➤ {p1['player'].name} vs {p2['player'].name}")

        if self.is_finished():
            self.finished = True
            print(f"🏆 Turniergewinner: {self.get_winner()}")

        return matchups


    def get_match_history(self):
        return self.match_history

    def is_finished(self):
        return self.finished

    def get_winner(self):
        if self.final_result:
            return self.final_result["winner"]
        if len(self.players) == 1:
            return self.players[0]["player"].name
        return None

    def get_current_matchups(self):
        if self.final_match:
            return [{
                "player1": self.final_match[0]["player"].name,
                "player2": self.final_match[1]["player"].name
            }]
        return [
            {
                "player1": p1_entry["player"].name,
                "player2": p2_entry["player"].name
            }
            for p1_entry, p2_entry in self.active_matches
        ]

    def get_placements(self):
        if not self.finished or not self.final_result:
            return {}

        placements = {
            "1st": self.final_result["winner"],
            "2nd": self.final_result["loser"]
        }

        if self.third_place_result:
            placements["3rd"] = self.third_place_result["winner"]
            placements["4th"] = self.third_place_result["loser"]

        return placements
