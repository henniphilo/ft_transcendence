import asyncio
from typing import Dict, List, Optional
import uuid
from models.game import PongGame
from models.player import Player
import logging
import random

logger = logging.getLogger('game')

class TournamentMatch:
    def __init__(self, match_id: str, round_number: int):
        self.id = match_id
        self.round = round_number
        self.player1: Optional[dict] = None
        self.player2: Optional[dict] = None
        self.winner: Optional[dict] = None
        self.game: Optional[PongGame] = None
        self.next_match_id: Optional[str] = None
        self.status = "pending"  # pending, in_progress, completed

class Tournament:
    def __init__(self, num_players: int):
        self.id = str(uuid.uuid4())
        self.num_players = num_players
        self.players: List[dict] = []
        self.matches: Dict[str, TournamentMatch] = {}
        self.current_round = 1
        self.status = "waiting"  # waiting, in_progress, completed
        self.websockets = {}  # player_id -> websocket
        
        # Initialisiere den Turnierbaum
        self.initialize_bracket()
        logger.info(f"Tournament created: {self.id} for {num_players} players")

    def initialize_bracket(self):
        """Erstellt die initiale Struktur des Turnierbaums"""
        num_rounds = 3 if self.num_players == 8 else 2  # 8 Spieler = 3 Runden, 4 Spieler = 2 Runden
        
        # Erstelle Matches für jede Runde
        for round_num in range(1, num_rounds + 1):
            matches_in_round = self.num_players // (2 ** round_num)
            for _ in range(matches_in_round):
                match_id = str(uuid.uuid4())
                self.matches[match_id] = TournamentMatch(match_id, round_num)

        # Verbinde die Matches miteinander
        self.connect_matches()

    def connect_matches(self):
        """Verbindet die Matches, sodass Gewinner in die nächste Runde weitergehen"""
        matches_by_round = {}
        for match in self.matches.values():
            if match.round not in matches_by_round:
                matches_by_round[match.round] = []
            matches_by_round[match.round].append(match)

        # Verbinde jede Runde mit der nächsten
        for round_num in range(1, max(matches_by_round.keys())):
            current_round = matches_by_round[round_num]
            next_round = matches_by_round[round_num + 1]
            
            for i in range(0, len(current_round), 2):
                next_match = next_round[i // 2]
                current_round[i].next_match_id = next_match.id
                if i + 1 < len(current_round):
                    current_round[i + 1].next_match_id = next_match.id

    async def add_player(self, player_data: dict, websocket) -> bool:
        """Fügt einen Spieler zum Turnier hinzu"""
        if len(self.players) >= self.num_players:
            logger.warning(f"Tournament {self.id} is full, rejecting player {player_data['username']}")
            return False

        # Prüfe, ob der Spieler bereits im Turnier ist
        if any(p['id'] == player_data['id'] for p in self.players):
            logger.warning(f"Player {player_data['username']} already in tournament {self.id}")
            return False

        self.players.append(player_data)
        self.websockets[player_data['id']] = websocket
        logger.info(f"Player {player_data['username']} joined tournament {self.id}")

        # Informiere alle Spieler über den neuen Stand
        await self.broadcast_status()

        # Wenn alle Spieler da sind, starte das Turnier
        if len(self.players) == self.num_players:
            logger.info(f"Tournament {self.id} is full, starting...")
            await self.start_tournament()
        
        return True

    async def remove_player(self, player_id: str):
        """Entfernt einen Spieler aus dem Turnier"""
        self.players = [p for p in self.players if p['id'] != player_id]
        self.websockets.pop(player_id, None)
        logger.info(f"Player {player_id} left tournament {self.id}")

        if self.status == "waiting":
            await self.broadcast_status()
        elif self.status == "in_progress":
            # Wenn das Turnier läuft und ein Spieler verlässt, muss es abgebrochen werden
            await self.cancel_tournament()

    async def broadcast_status(self):
        """Sendet den aktuellen Turnierstatus an alle Spieler"""
        status_data = {
            'action': 'tournament_status',
            'status': self.status,
            'players': {
                'joined': len(self.players),
                'needed': self.num_players,
                'list': [
                    {
                        'username': p['username'],
                        'id': p['id']
                    } for p in self.players
                ]
            }
        }

        # Füge Match-Daten hinzu, wenn das Turnier gestartet ist
        if self.status != "waiting":
            status_data['matches'] = self.get_matches_data()

        await self.broadcast_message(status_data)
        logger.debug(f"Status broadcast for tournament {self.id}: {len(self.players)}/{self.num_players} players")

    async def broadcast_message(self, message: dict):
        """Sendet eine Nachricht an alle verbundenen Spieler"""
        for ws in self.websockets.values():
            try:
                await ws.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting message: {e}")

    async def cancel_tournament(self):
        """Bricht das Turnier ab"""
        self.status = "cancelled"
        cancel_message = {
            'action': 'tournament_cancelled',
            'message': 'Tournament cancelled due to player disconnect'
        }
        await self.broadcast_message(cancel_message)
        logger.warning(f"Tournament {self.id} cancelled")

    async def start_tournament(self):
        """Startet das Turnier"""
        self.status = "in_progress"
        logger.info(f"Starting tournament {self.id}")

        # Mische die Spieler zufällig
        random.shuffle(self.players)
        
        # Setze die ersten Matches
        first_round_matches = [m for m in self.matches.values() if m.round == 1]
        for i in range(0, len(self.players), 2):
            match = first_round_matches[i // 2]
            match.player1 = self.players[i]
            match.player2 = self.players[i + 1]
        
        # Informiere alle über den Turnierstart
        start_data = {
            'action': 'tournament_start',
            'matches': self.get_matches_data()
        }
        await self.broadcast_message(start_data)
        
        # Starte die ersten Matches
        await self.start_round_matches(1)

    async def start_round_matches(self, round_number: int):
        """Startet alle Matches einer bestimmten Runde"""
        round_matches = [m for m in self.matches.values() 
                        if m.round == round_number and 
                        m.player1 and m.player2 and 
                        m.status == "pending"]
        
        for match in round_matches:
            await self.start_match(match)

    async def start_match(self, match: TournamentMatch):
        """Startet ein einzelnes Match"""
        match.status = "in_progress"
        
        # Erstelle ein neues Spiel
        game_id = str(uuid.uuid4())
        settings = {
            'mode': 'tournament',
            'ball_speed': 5,
            'paddle_speed': 5,
            'winning_score': 5,
            'paddle_size': 'middle'
        }
        
        # Informiere die Spieler über den Spielstart
        game_data = {
            'action': 'start_game',
            'game_id': game_id,
            'match_id': match.id,
            'player1': match.player1['username'],
            'player2': match.player2['username'],
            'settings': settings
        }

        # Sende jedem Spieler seine Rolle
        ws1 = self.websockets.get(match.player1['id'])
        ws2 = self.websockets.get(match.player2['id'])
        
        if ws1:
            await ws1.send_json({**game_data, 'playerRole': 'player1'})
        if ws2:
            await ws2.send_json({**game_data, 'playerRole': 'player2'})

    async def handle_match_result(self, match_id: str, winner_id: str):
        """Verarbeitet das Ergebnis eines Matches"""
        match = self.matches[match_id]
        winner_data = next(p for p in self.players if p['id'] == winner_id)
        match.winner = winner_data
        match.status = "completed"

        # Wenn es ein next_match gibt, füge den Gewinner dort ein
        if match.next_match_id:
            next_match = self.matches[match.next_match_id]
            if not next_match.player1:
                next_match.player1 = winner_data
            else:
                next_match.player2 = winner_data

            # Wenn beide Spieler im nächsten Match bereit sind, starte es
            if next_match.player1 and next_match.player2:
                await self.start_match(next_match)

        # Prüfe, ob das Turnier beendet ist
        if self.is_tournament_completed():
            await self.end_tournament()

        # Informiere alle über das Update
        await self.broadcast_status()

    def is_tournament_completed(self) -> bool:
        """Prüft, ob das Turnier beendet ist"""
        final_match = next(m for m in self.matches.values() 
                         if not m.next_match_id)
        return final_match.status == "completed"

    async def end_tournament(self):
        """Beendet das Turnier"""
        self.status = "completed"
        final_match = next(m for m in self.matches.values() 
                         if not m.next_match_id)
        
        end_data = {
            'action': 'tournament_end',
            'winner': final_match.winner,
            'matches': self.get_matches_data()
        }
        
        await self.broadcast_status()

    def get_matches_data(self) -> List[dict]:
        """Gibt die Match-Daten in einem Frontend-freundlichen Format zurück"""
        return [
            {
                'id': match.id,
                'round': match.round,
                'player1': match.player1,
                'player2': match.player2,
                'winner': match.winner,
                'status': match.status,
                'next_match_id': match.next_match_id
            }
            for match in self.matches.values()
        ]