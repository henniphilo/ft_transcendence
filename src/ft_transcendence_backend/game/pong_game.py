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
