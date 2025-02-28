from fastapi import FastAPI, WebSocket
from menu import Menu
from game_server import GameServer
import uuid
from fastapi import WebSocketDisconnect
import logging
from settings import LOGGING
# Configure logging
logging.config.dictConfig(LOGGING)
# test logging
logger = logging.getLogger('game')
# Example log messages at different levels
logger.debug("GAME! This is a test debug message")
logger.info("GAME! test Game application starting up...")
logger.warning("GAME! test This is a warning message")
logger.error("GAME! test This is an error message")

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
    