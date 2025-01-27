from fastapi import FastAPI, WebSocket
import json
from settings import GameSettings

class Menu:
    def __init__(self):
        self.game_settings = GameSettings()
        self.current_menu_stack = []
        self.current_game_settings = None  # Neue Variable für aktuelle Spiel-Settings
        self.menu_items = [
            {"id": "start_game", "text": "Start Game"},
            {"id": "settings", "text": "Settings"},
            {"id": "leaderboard", "text": "Leaderboard"}
        ]
        
        self.game_mode_items = [
            {"id": "tournament", "text": "Tournament"},
            {"id": "single_game", "text": "Single Game"},
            {"id": "back", "text": "Back"}
        ]
        
        self.play_mode_items = [
            {"id": "local", "text": "Local Multiplayer"},
            {"id": "ai", "text": "Play vs AI"},
            {"id": "online", "text": "Online Multiplayer"},
            {"id": "back", "text": "Back"}
        ]
        
        self.ai_difficulty_items = [
            {"id": "easy", "text": "Easy"},
            {"id": "medium", "text": "Medium"},
            {"id": "impossible", "text": "Impossible"},
            {"id": "back", "text": "Back"}
        ]

    async def handle_menu_selection(self, websocket: WebSocket, selection: str):
        print(f"\n=== Menu Selection ===")
        print(f"Selection: {selection}")
        print(f"Current Menu Stack: {self.current_menu_stack}")
        
        if selection == "start_game":
            self.current_menu_stack.append("main")
            return {"action": "show_submenu", "menu_items": self.game_mode_items}
        
        elif selection == "settings":
            return {
                "action": "show_settings",
                "settings": self.game_settings.get_settings()
            }
            
        elif selection == "leaderboard":
            return {"action": "show_leaderboard"}
            
        elif selection in ["tournament", "single_game"]:
            self.current_menu_stack.append("game_mode")
            return {"action": "show_submenu", "menu_items": self.play_mode_items, "selected_mode": selection}
            
        elif selection == "local":
            return {"action": "start_game", "mode": "local"}
            
        elif selection == "ai":
            self.current_menu_stack.append("play_mode")
            return {"action": "show_submenu", "menu_items": self.ai_difficulty_items}
            
        elif selection in ["easy", "medium", "impossible"]:
            print("\n=== Starting AI Game ===")
            game_settings = self.game_settings.get_settings()
            game_settings.update({
                "mode": "ai",
                "difficulty": selection
            })
            print(f"Final Game Settings: {game_settings}")
            self.current_game_settings = game_settings  # Speichere die aktuellen Settings
            
            return {
                "action": "start_game",
                "settings": game_settings
            }
            
        elif selection == "back":
            if self.current_menu_stack:
                last_menu = self.current_menu_stack.pop()
                if last_menu == "main":
                    return {"action": "show_main_menu", "menu_items": self.menu_items}
                elif last_menu == "game_mode":
                    return {"action": "show_submenu", "menu_items": self.game_mode_items}
                elif last_menu == "play_mode":
                    return {"action": "show_submenu", "menu_items": self.play_mode_items}
            return {"action": "show_main_menu", "menu_items": self.menu_items}
            
        elif selection == "help":
            return {"action": "show_help"}
            
        elif selection == "exit":
            return {"action": "exit_game"}

    async def update_settings(self, settings_data):
        print(f"Menu update_settings called with: {settings_data}")  # Debug
        return await self.game_settings.update_settings(settings_data)

    async def get_menu_items(self):
        return self.menu_items 

    def display_settings(self, settings):
        # This method is not provided in the original file or the code block
        # It's assumed to exist as it's called in the code block
        # Implementation of display_settings method
        pass 

    def get_current_settings(self):
        # Verwende die gespeicherten Spiel-Settings, falls vorhanden
        if self.current_game_settings is not None:
            print(f"Using current game settings: {self.current_game_settings}")
            return self.current_game_settings
        # Ansonsten Standard-Settings
        return self.game_settings.get_settings() 