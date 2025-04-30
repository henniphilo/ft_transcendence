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
    #print("health check received")
    return {"status": "Game Server running"}

@app.websocket("/ws/menu")
async def websocket_menu(websocket: WebSocket):
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_json()
            #print(f"WebSocket received data: {data}")  # Debug
            
            if data["action"] == "get_menu_items":
                menu_items = await menu.get_menu_items()
                await websocket.send_json({"menu_items": menu_items})
            
            elif data["action"] == "update_settings":
                #print(f"Updating settings with: {data}")
                response = await menu.update_settings(data["settings"])
                await websocket.send_json(response)

            elif data["action"] == "menu_selection":
                user_profile = data.get("userProfile")
                response = await menu.handle_menu_selection(websocket, data["selection"], userProfile=user_profile)
                if response:
                    await websocket.send_json(response)

            elif data["action"] == "start_tournament_now":
                #print("🎯 Received start_tournament_now")
                await menu.start_tournament_matches()

            elif data["action"] == "tournament_result":
                winner_name = data.get("winner") # Nennen wir es winner_name zur Klarheit
                #print(f"✅ Received tournament result for match winner: {winner_name}")
                
                # Ergebnis im Manager speichern (kann intern prüfen, ob es doppelt ist)
                menu.tournament_manager.record_result(winner_name) 

                # --- NEU: Direkt nach dem Speichern prüfen, ob das Turnier jetzt beendet ist ---
                is_finished_now = menu.tournament_manager.is_finished()
                final_tournament_winner = None
                if is_finished_now:
                    winner_return_value = menu.tournament_manager.get_winner() 
                    #print(f"DEBUG: menu.tournament_manager.get_winner() was called.")
                    #print(f"DEBUG: Return value of get_winner() = '{winner_return_value}' (Type: {type(winner_return_value)})")

                    # Weise das Ergebnis der Variable zu
                    final_tournament_winner = winner_return_value 
                    #print(f"DEBUG: Value assigned to final_tournament_winner = '{final_tournament_winner}' (Type: {type(final_tournament_winner)})")
                # --- Ende Prüfung ---

                # Aktuelle Daten für das Update holen
                current_results = menu.tournament_manager.results
                current_round = menu.tournament_manager.current_round
                total_rounds = menu.tournament_manager.total_rounds
                
                # Aktuelle/Nächste Matchups bestimmen (oder leer, wenn fertig)
                # (Diese Logik ggf. anpassen, je nachdem wie active_matches/nächste Runde bestimmt wird)
                current_matchups = []
                if not is_finished_now:
                     # Z.B. die Matches, die jetzt aktiv sind/als nächstes kommen
                     current_matchups = [{ 
                         "player1": p1["player"].name, 
                         "player2": p2["player"].name 
                     } for p1, p2 in menu.tournament_manager.active_matches] # Oder eine andere Logik hier
                
                players_data = [
                    {
                        "username": e["player"].user_profile.get("username", e["player"].name),
                        "tournament_name": e["player"].name
                    } for e in menu.tournament_manager.players
                ]

                # --- Nachricht VOR der Schleife zusammenbauen ---
                message_payload = {
                    "action": "update_tournament_results",
                    "results": current_results,
                    "round": current_round,
                    "total_rounds": total_rounds,
                    "matchups": current_matchups, # Nächste Matches oder leere Liste
                    "players": players_data
                    # tournament_winner wird unten hinzugefügt, falls nötig
                }

                # --- NEU: Turniersieger zum Payload hinzufügen, wenn fertig ---
                if is_finished_now:
                    message_payload["tournament_winner"] = final_tournament_winner
                # --- Ende Hinzufügen ---
                
                # Debug Log vor dem Senden
                #print(f"DEBUG: Broadcasting update_tournament_results Payload: {message_payload}")

                # Broadcast an alle Spieler im Turnier
                for entry in menu.tournament_manager.players:
                    try:
                        # Sende den vorbereiteten Payload
                        await entry["websocket"].send_json(message_payload) 
                    except Exception as e:
                        print(f"❌ Fehler beim Senden an {entry['player'].name}: {e}")

            # Der Block elif data["action"] == "start_next_round": bleibt wie er ist,
            # ABER der 'else'-Teil (Turnier beendet) wird jetzt seltener/nie direkt nach einem Ergebnis erreicht,
            # da der Gewinner schon im 'tournament_result' verkündet wurde. Man könnte ihn ggf. anpassen oder als Fallback lassen.


            elif data["action"] == "start_next_round":
                #print("🎯 Nächste Turnierrunde wird gestartet")
                
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
                                    "tournament_winner": winner,
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
    #print("\n=== Websocket Game Settings ===")
    #print(f"Settings being passed to game: {settings}")
    
    await game_server.handle_game(websocket, game_id, settings)
