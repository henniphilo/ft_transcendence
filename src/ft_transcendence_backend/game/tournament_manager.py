import uuid

class TournamentManager:
    def __init__(self, players):
        self.players = players  # list of {"websocket": ..., "player": Player}
        self.current_round = 1
        self.total_rounds = self._calculate_total_rounds(len(players))
        self.active_matches = []  # list of (p1_entry, p2_entry)
        self.results = {}  # {winner_name: 1}

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
        self.results[winner_name] = self.results.get(winner_name, 0) + 1

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