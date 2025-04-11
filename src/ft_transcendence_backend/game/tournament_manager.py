import uuid

class TournamentManager:
    def __init__(self, players):
        self.players = players  # list of {"websocket": ..., "player": Player}
        self.current_round = 1
        self.total_rounds = self._calculate_total_rounds(len(players))
        self.active_matches = []  # list of (p1_entry, p2_entry)
        self.results = {}  # {winner_name: 1}
        self.match_history = []  # ← NEU: speichert alle abgeschlossenen Matches

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
        # Check if winner_name is a username rather than tournament_name
        # and find the corresponding tournament_name if needed
        tournament_player = None
        for player_entry in self.players:
            player = player_entry["player"]
            if player.name == winner_name:
                # Direct match found - winner_name is already a tournament_name
                tournament_player = player
                break
            # Check if this player's user profile has this username
            if hasattr(player, "user_profile") and player.user_profile and player.user_profile.get("username") == winner_name:
                # Found the player with this username
                tournament_player = player
                break
        
        # If we found a matching player, use their tournament name
        if tournament_player:
            winner_name = tournament_player.name
        
        # Now record the result with the correct tournament_name
        self.results[winner_name] = self.results.get(winner_name, 0) + 1

        print(f"record_result: {winner_name}")
        print(f"active_matches: {self.active_matches}")
        print(f"match_history: {self.match_history}")
        print(f"results: {self.results}")
        print(f"current_round: {self.current_round}")
        print(f"players: {self.players}")
        print(f"is_finished: {self.is_finished()}")
        
        # Gewinner und Verlierer merken
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

    def get_match_history(self):
        return self.match_history

    def next_round(self):
        self.current_round += 1
        advancing = [entry for entry in self.players if entry["player"].name in self.results]
        self.players = advancing
        self.results = {}
        return self.create_matchups()

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
