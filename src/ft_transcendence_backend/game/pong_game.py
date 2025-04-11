from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from menu import Menu
from game_server import GameServer
import uuid
import logging
from settings import LOGGING

# Configure logging
logging.config.dictConfig(LOGGING)
logger = logging.getLogger('game')

# Test logging
logger.debug("GAME! This is a test debug message")
logger.info("GAME! test Game application starting up...")
logger.warning("GAME! test This is a warning message")

app = FastAPI()
menu = Menu()
game_server = GameServer()

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
            
            elif data["action"] == "update_settings":
                print(f"Updating settings with: {data}")
                response = await menu.update_settings(data["settings"])
                await websocket.send_json(response)

            elif data["action"] == "menu_selection":
                user_profile = data.get("userProfile")
                response = await menu.handle_menu_selection(websocket, data["selection"], userProfile=user_profile)
                if response:
                    await websocket.send_json(response)

            elif data["action"] == "start_tournament_now":
                print("🎯 Received start_tournament_now")
                await menu.start_tournament_matches()

            elif data["action"] == "tournament_result":
                winner = data.get("winner")
                print(f"✅ Received tournament result: {winner}")
                menu.tournament_manager.record_result(winner)

                results = menu.tournament_manager.results
                round = menu.tournament_manager.current_round
                total_rounds = menu.tournament_manager.total_rounds
                matchups = [{
                    "player1": p1["player"].name,
                    "player2": p2["player"].name
                } for p1, p2 in menu.tournament_manager.active_matches]

                # Broadcast an alle Spieler im Turnier
                for entry in menu.tournament_manager.players:
                    try:
                        await entry["websocket"].send_json({
                            "action": "update_tournament_results",
                            "results": results,
                            "round": round,
                            "total_rounds": total_rounds,
                            "matchups": matchups
                        })
                    except Exception as e:
                        print(f"❌ Fehler beim Senden an {entry['player'].name}: {e}")

            elif data["action"] == "start_next_round":
                print("🎯 Nächste Turnierrunde wird gestartet")
                
                # Prüfen, ob alle Spiele der aktuellen Runde abgeschlossen sind
                if len(menu.tournament_manager.results) == len(menu.tournament_manager.active_matches):
                    # Nächste Runde starten
                    matchups = menu.tournament_manager.next_round()
                    
                    # Wenn das Turnier noch nicht beendet ist
                    if not menu.tournament_manager.is_finished():
                        await menu.start_tournament_matches()
                    else:
                        # Turnier ist beendet, Gewinner verkünden
                        winner = menu.tournament_manager.get_winner()
                        for entry in menu.tournament_manager.players:
                            try:
                                await entry["websocket"].send_json({
                                    "action": "tournament_finished",
                                    "winner": winner,
                                    "match_history": menu.tournament_manager.get_match_history()
                                })
                            except Exception as e:
                                print(f"❌ Fehler beim Senden an {entry['player'].name}: {e}")

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket Error: {e}")
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
