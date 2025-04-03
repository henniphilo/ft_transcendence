import asyncio
from typing import Dict, List, Optional
import uuid
from models.game import PongGame
from models.player import Player
import logging
import random
from fastapi import WebSocket, WebSocketDisconnect
from game_server import GameServer
from settings import GameSettings  # Import am Anfang der Datei

logger = logging.getLogger('game')

active_tournaments: Dict[str, 'Tournament'] = {}  # Global dictionary to store active tournaments

class TournamentMatch:
    def __init__(self, match_id: str, round_number: int):
        self.id = match_id
        self.round = round_number
        self.player1: Optional[dict] = None
        self.player2: Optional[dict] = None
        self.winner: Optional[dict] = None
        self.game: Optional[PongGame] = None
        self.next_match_id: Optional[str] = None
        self.status = "pending"  # pending, ready, in_progress, completed
        self.ready_players = set()  # Neue Property für Ready-Status

class Tournament:
    def __init__(self, num_players, game_server=None, game_settings=None):
        self.id = str(uuid.uuid4())
        self.num_players = num_players  # Verwende den übergebenen Wert
        self.players = []
        self.websockets = {}
        self.matches = {}
        self.status = "waiting"  # waiting, ready, in_progress, completed
        self.game_server = game_server  # Speichere die game_server-Instanz
        self.game_settings = game_settings  # Speichere die Einstellungen
        
        logger.info(f"Tournament created with ID {self.id} for {num_players} players")
        
        # Initialisiere den Turnierbaum
        self.initialize_bracket()

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

    async def add_player(self, player_data: dict, websocket: WebSocket) -> bool:
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

        # Wenn alle Spieler da sind, erstelle den Turnierbaum
        if len(self.players) == self.num_players:
            self.create_tournament_bracket()
            self.status = "ready"  # Ändere den Status von "waiting" zu "ready"
        
        # Informiere alle über den neuen Status
        await self.broadcast_status()
        return True

    def create_tournament_bracket(self):
        """Erstellt den initialen Turnierbaum"""
        # Mische die Spieler zufällig
        random.shuffle(self.players)
        
        # Erstelle die erste Runde von Matches
        first_round_matches = []
        for i in range(0, len(self.players), 2):
            match_id = str(uuid.uuid4())
            match = TournamentMatch(match_id, round_number=1)
            match.player1 = self.players[i]
            if i + 1 < len(self.players):
                match.player2 = self.players[i + 1]
            first_round_matches.append(match)
            self.matches[match_id] = match

        # Erstelle die weiteren Runden (für Gewinner)
        current_round = first_round_matches
        round_number = 2
        while len(current_round) > 1:
            next_round = []
            for i in range(0, len(current_round), 2):
                match_id = str(uuid.uuid4())
                match = TournamentMatch(match_id, round_number=round_number)
                next_round.append(match)
                self.matches[match_id] = match
                
                # Verknüpfe die Matches mit der nächsten Runde
                if i < len(current_round):
                    current_round[i].next_match_id = match_id
                if i + 1 < len(current_round):
                    current_round[i + 1].next_match_id = match_id
            
            current_round = next_round
            round_number += 1

        self.num_rounds = round_number - 1

    async def remove_player(self, player_id: str):
        """Entfernt einen Spieler aus dem Turnier"""
        self.players = [p for p in self.players if p['id'] != player_id]
        self.websockets.pop(player_id, None)
        logger.info(f"Player {player_id} left tournament {self.id}")

        if self.status == "waiting":
            # Nur Broadcast wenn wir noch in der Wartephase sind
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
        """Verarbeitet das Ergebnis eines Matches und aktualisiert den Turnierbaum"""
        match = self.matches.get(match_id)
        if not match:
            return

        # Setze den Gewinner
        winner = match.player1 if match.player1['id'] == winner_id else match.player2
        match.winner = winner
        match.status = "completed"

        # Wenn es ein next_match gibt, füge den Gewinner dort ein
        if match.next_match_id:
            next_match = self.matches[match.next_match_id]
            if not next_match.player1:
                next_match.player1 = winner
            else:
                next_match.player2 = winner

        # Prüfe, ob das Turnier beendet ist
        final_match = self.get_final_match()
        if final_match and final_match.winner:
            # Turnier ist beendet
            await self.broadcast_message({
                'action': 'tournament_end',
                'winner': final_match.winner
            })
        else:
            # Aktualisiere den Turnierbaum für alle
            await self.broadcast_status()

    def get_final_match(self):
        """Findet das Finale-Match"""
        for match in self.matches.values():
            if match.round == self.num_rounds:  # Finale ist in der letzten Runde
                return match
        return None

    def get_matches_data(self):
        """Gibt die Match-Daten in einem Frontend-freundlichen Format zurück"""
        return [{
            'id': match_id,
            'round': match.round,
            'player1': match.player1,
            'player2': match.player2,
            'winner': match.winner,
            'status': match.status,
            'ready_players': list(match.ready_players) if hasattr(match, 'ready_players') else []
        } for match_id, match in self.matches.items()]

    async def handle_websocket_message(self, data: dict, websocket: WebSocket):
        """Verarbeitet eingehende WebSocket-Nachrichten"""
        print(f"--- Tournament {self.id}: handle_websocket_message received: {data} ---") # Print T1
        action = data.get('action')
        player_data = data.get('userProfile') # Für Join
        player_id = data.get('player_id') # Für Start Match

        try: # Füge einen try-except Block hinzu, um Fehler hier abzufangen
            if action == 'join_tournament':
                # ... (Logik für join_tournament mit Prints) ...
                pass # Platzhalter
            elif action == 'start_match':
                match_id = data.get('match_id')
                if player_id and match_id:
                    print(f"--- Tournament {self.id}: Handling 'start_match' for player {player_id} and match {match_id} ---") # Print T8
                    await self.handle_start_match(match_id, player_id)
                else:
                    print(f"!!! Tournament {self.id}: 'start_match' received without player_id or match_id. !!!") # Print T9
            # ... (andere Aktionen wie leave_tournament) ...
            else:
                print(f"!!! Tournament {self.id}: Received unknown action: {action} !!!") # Print T13
        except Exception as e:
             print(f"!!! Tournament {self.id}: Error in handle_websocket_message for action '{action}': {e} !!!")
             # Da traceback weg ist, geben wir nur die Exception aus

    async def handle_start_match(self, match_id: str, player_id: str):
        """Behandelt die Anfrage zum Starten eines Matches"""
        print(f"--- [Debug] Tournament {self.id}: handle_start_match called for match {match_id}, player {player_id} ---")
        try:
            match = self.matches.get(match_id)
            if not match:
                print(f"!!! [Debug] Tournament {self.id}: Match {match_id} not found! !!!")
                return
            if match.status != "pending":
                print(f"!!! [Debug] Tournament {self.id}: Match {match_id} is not 'pending' (status: {match.status}) !!!")
                return

            # Finde den Spielernamen für bessere Logs
            player_name = next((p['username'] for p in self.players if p['id'] == player_id), f'Unknown_ID_{player_id}')
            print(f"--- [Debug] Tournament {self.id}: Player {player_name} (ID: {player_id}) is ready for match {match_id} ---")

            # Initialisiere ready_players wenn noch nicht vorhanden
            if not hasattr(match, 'ready_players'):
                print(f"--- [Debug] Match {match_id}: Initializing 'ready_players' set. ---")
                match.ready_players = set()

            # Markiere den Spieler als bereit
            match.ready_players.add(player_id)
            ready_players_count = len(match.ready_players)
            # Prüfe, ob player1 und player2 existieren, bevor die Anzahl verglichen wird
            expected_players = 0
            if match.player1: expected_players += 1
            if match.player2: expected_players += 1
            print(f"--- [Debug] Match {match_id}: Player {player_id} added to ready set. {ready_players_count}/{expected_players} players now ready. ---")

            # Wenn beide Spieler bereit sind UND es zwei Spieler im Match gibt
            if expected_players == 2 and ready_players_count == 2:
                print(f"--- [Debug] Match {match_id}: Both players ready, proceeding to start game... ---")
                match.status = "in_progress" # Status sofort ändern, um doppeltes Starten zu verhindern

                # Hole die Settings
                if not self.game_settings:
                    print(f"!!! [Debug] Match {match_id}: self.game_settings not found! Using default settings. !!!")
                    settings = {
                        'mode': 'tournament',  # Verwende 'tournament' als Modus
                        'winning_score': 5,
                        'ball_speed': 5,
                        'paddle_speed': 5,
                        'paddle_size': 'middle'
                    }
                else:
                    # Kopiere die Einstellungen, um das Original nicht zu verändern
                    settings = dict(self.game_settings)
                    # Setze den Modus auf 'tournament'
                    settings['mode'] = 'tournament'
                    print(f"--- [Debug] Match {match_id}: Using game settings: {settings} ---")

                # Prüfe, ob game_server existiert
                if not self.game_server:
                    print(f"!!! [Debug] Match {match_id}: self.game_server not found! Cannot create game. !!!")
                    match.status = "pending"
                    match.ready_players.clear()
                    await self.broadcast_status()
                    return

                # Erstelle ein neues Spiel
                game_id = str(uuid.uuid4())
                print(f"--- [Debug] Match {match_id}: Creating game with ID {game_id} ---")

                # Stelle sicher, dass die Websockets für beide Spieler vorhanden sind
                ws1 = self.websockets.get(match.player1['id'])
                ws2 = self.websockets.get(match.player2['id'])
                if not ws1 or not ws2:
                    print(f"!!! [Debug] Match {match_id}: WebSocket missing for player1 ({bool(ws1)}) or player2 ({bool(ws2)})! Aborting game start. !!!")
                    match.status = "pending"
                    match.ready_players.clear()
                    await self.broadcast_status()
                    return

                # Erstelle game_data für die 'match_ready' Nachricht
                game_data = {
                    'action': 'match_ready',
                    'match_id': match_id,
                    'game_id': game_id,
                    'player1': match.player1['username'],
                    'player2': match.player2['username'],
                    'settings': settings,
                    'type': 'tournament'
                }
                print(f"--- [Debug] Match {match_id}: Preparing 'match_ready' message: {game_data} ---")

                # Sende jedem Spieler seine spezifische Rolle und die Game-Daten
                for i, p_info in enumerate([match.player1, match.player2], 1):
                    pid = p_info['id']
                    if pid in self.websockets:
                        player_specific_data = {
                            **game_data,
                            'playerRole': f'player{i}'
                        }
                        try:
                            await self.websockets[pid].send_json(player_specific_data)
                            print(f"--- [Debug] Match {match_id}: Sent 'match_ready' to player {pid} ({p_info['username']}) ---")
                        except Exception as e:
                            print(f"!!! [Debug] Match {match_id}: Error sending 'match_ready' to player {pid}: {e} !!!")
                    else:
                        print(f"!!! [Debug] Match {match_id}: WebSocket for player {pid} not found when sending 'match_ready'. !!!")

            # Aktualisiere den Status für alle
            print(f"--- [Debug] Match {match_id}: Broadcasting status after handling ready signal. ---")
            await self.broadcast_status()

        except Exception as e:
            print(f"!!! [Debug] Tournament {self.id}: Unhandled error in handle_start_match for match {match_id}: {e} !!!")
