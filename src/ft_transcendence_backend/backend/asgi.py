"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

# import os

# from django.core.asgi import get_asgi_application
# from channels.routing import ProtocolTypeRouter, URLRouter
# from chat.routing import websocket_urlpatterns

# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# application = ProtocolTypeRouter({
#     "http": get_asgi_application(),
#     "websocket": URLRouter(websocket_urlpatterns)
# })

import os
import django
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from minimal_chat.middleware import JWTAuthMiddleware  # ✅ Dein JWT Middleware
import minimal_chat.routing  # enthält websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()  # ✅ wichtig, damit Django geladen ist, bevor du User-Model oder Middleware brauchst

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JWTAuthMiddleware(  # ✅ Hier direkt dein JWT-Middleware verwenden
        URLRouter(
            minimal_chat.routing.websocket_urlpatterns
        )
    ),
})
