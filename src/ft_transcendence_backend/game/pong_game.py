from fastapi import FastAPI, WebSocket
from menu import Menu
from game_server import GameServer
from tournament import Tournament
import uuid
from fastapi import WebSocketDisconnect
import logging
from settings import LOGGING
from typing import Dict
# Configure logging
logging.config.dictConfig(LOGGING)
# test logging
logger = logging.getLogger('game')



# Example log messages at different levels
logger.debug("GAME! This is a test debug message")
logger.info("GAME! test Game application starting up...")
logger.warning("GAME! test This is a warning message")
# logger.error("GAME! test This is an error message")



app = FastAPI()
menu = Menu()
game_server = GameServer()

# Dictionary für aktive Turniere
active_tournaments: Dict[str, Tournament] = {}

# Füge eine Basic-Route hinzu
@app.get("/")
async def root():
    print("health check received")
    return {"status": "Game Server running"}

@app.websocket("/ws/menu")
async def websocket_menu(websocket: WebSocket):
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_json()
            print(f"WebSocket received data: {data}")  # Debug
            
            if data["action"] == "get_menu_items":
                menu_items = await menu.get_menu_items()
                await websocket.send_json({"menu_items": menu_items})
            
            elif data["action"] == "update_settings":  # Hier könnte der Fehler sein
                print(f"Updating settings with: {data}")  # Debug
                response = await menu.update_settings(data["settings"])
                await websocket.send_json(response)
            
            elif data["action"] == "menu_selection":
                response = await menu.handle_menu_selection(websocket, data["selection"])
                await websocket.send_json(response)
                
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket Error: {e}")  # Debug
        try:
            await websocket.close()
        except RuntimeError:
            pass

@app.websocket("/ws/game/{game_id}")
async def websocket_game(websocket: WebSocket, game_id: str):
    # Die Settings vom Menü direkt verwenden, nicht neu holen
    settings = menu.get_current_settings()
    
    # Debug print
    print("\n=== Websocket Game Settings ===")
    print(f"Settings being passed to game: {settings}")
    
    await game_server.handle_game(websocket, game_id, settings) 

@app.websocket("/ws/tournament/{tournament_id}")
async def websocket_tournament(websocket: WebSocket, tournament_id: str):
    await websocket.accept()
    
    try:
        data = await websocket.receive_json()
        print(f"\n=== Tournament WebSocket Data ===")
        print(f"Tournament ID: {tournament_id}")
        print(f"Received data: {data}")

        # Hole oder erstelle Tournament
        tournament = active_tournaments.get(tournament_id)
        if not tournament and data['action'] == 'join_tournament':
            tournament = Tournament(data['numPlayers'])
            active_tournaments[tournament_id] = tournament
            print(f"Created new tournament: {tournament_id}")

        if not tournament:
            await websocket.close()
            return

        # Handle verschiedene Tournament-Aktionen
        while True:
            if data['action'] == 'join_tournament':
                success = await tournament.add_player(data['userProfile'], websocket)
                if not success:
                    await websocket.send_json({
                        'action': 'error',
                        'message': 'Tournament is full'
                    })
                    break

            elif data['action'] == 'leave_tournament':
                await tournament.remove_player(data['userProfile']['id'])
                break

            elif data['action'] == 'game_completed':
                await tournament.handle_match_result(
                    data['matchId'],
                    data['winnerId']
                )

            # Warte auf weitere Nachrichten
            data = await websocket.receive_json()

    except WebSocketDisconnect:
        # Wenn ein Spieler die Verbindung verliert
        if tournament:
            player_id = next((p['id'] for p in tournament.players 
                            if tournament.websockets.get(p['id']) == websocket), None)
            if player_id:
                await tournament.remove_player(player_id)
                
        print(f"Client disconnected from tournament {tournament_id}")

    except Exception as e:
        logger.error(f"Tournament WebSocket Error: {e}")
        try:
            await websocket.close()
        except RuntimeError:
            pass

    finally:
        # Cleanup wenn das Tournament leer ist
        if tournament and not tournament.players:
            del active_tournaments[tournament_id]
