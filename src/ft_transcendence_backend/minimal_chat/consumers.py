# minimal_chat/consumers.py

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import BlockedUser

# Entferne das hier:
# User = get_user_model()

@database_sync_to_async
def get_user(user_id):
    User = get_user_model()
    return User.objects.get(id=user_id)

@database_sync_to_async
def is_blocked(user_id, other_user_id):
    """Prüft, ob einer der Benutzer den anderen blockiert hat"""
    return BlockedUser.objects.filter(
        user_id=user_id, blocked_user_id=other_user_id
    ).exists() or BlockedUser.objects.filter(
        user_id=other_user_id, blocked_user_id=user_id
    ).exists()


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        
        if self.user.is_authenticated:
            self.room_name = f"chat_user_{self.user.id}"
            await self.channel_layer.group_add(self.room_name, self.channel_name)

            await self.accept()
            print(f"✅ WebSocket verbunden für {self.room_name}")

            await self.send(text_data=json.dumps({
                "message": f"Willkommen, {self.user.username}!"
            }))
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, "room_name"):
            await self.channel_layer.group_discard(self.room_name, self.channel_name)
            print(f"❌ WebSocket getrennt für {self.room_name}")

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get("message")
        receiver_id = data.get("receiver_id")

        print(f"📩 Nachricht erhalten: {data}")

        if message and receiver_id:
            # Prüfe, ob einer der Benutzer den anderen blockiert hat
            if await is_blocked(self.user.id, receiver_id):
                await self.send(text_data=json.dumps({
                    "message": "Du kannst keine Nachrichten an diesen Benutzer senden, da einer von euch den anderen blockiert hat.",
                    "error": "blocked"
                }))
                return
                
            receiver_group = f"chat_user_{receiver_id}"

            await self.channel_layer.group_send(
                receiver_group,
                {
                    "type": "chat.message",
                    "message": message,
                    "sender_id": self.user.id
                }
            )
            print(f"📤 Nachricht an {receiver_group}: {message}")

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "message": event["message"],
            "from": event["sender_id"]
        }))
# minimal_chat/consumers.py

# import json
# from channels.generic.websocket import AsyncWebsocketConsumer

# class ChatConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         self.room_name = "chat_testroom"
#         await self.channel_layer.group_add(self.room_name, self.channel_name)
#         await self.accept()
#         print("✅ WebSocket verbunden (ohne Auth)")

#         await self.send(text_data=json.dumps({
#             "message": "Willkommen im Test-Chat! 🎉"
#         }))

#     async def disconnect(self, close_code):
#         await self.channel_layer.group_discard(self.room_name, self.channel_name)
#         print("❌ WebSocket getrennt")

#     async def receive(self, text_data):
#         data = json.loads(text_data)
#         message = data.get("message", "Keine Nachricht")

#         print(f"📩 Nachricht erhalten: {message}")

#         # An alle im Raum senden
#         await self.channel_layer.group_send(
#             self.room_name,
#             {
#                 "type": "chat.message",
#                 "message": message,
#             }
#         )

#     async def chat_message(self, event):
#         await self.send(text_data=json.dumps({
#             "message": event["message"]
#         }))
