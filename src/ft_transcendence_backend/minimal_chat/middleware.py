import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()
from channels.db import database_sync_to_async

import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import close_old_connections
from channels.middleware import BaseMiddleware
from urllib.parse import parse_qs
from jwt import InvalidTokenError
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.authentication import JWTAuthentication


@database_sync_to_async
def get_user(validated_token):
    try:
        user = JWTAuthentication().get_user(validated_token)
        return user
    except Exception:
        return None


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Token aus Query-String holen
        query_string = parse_qs(scope["query_string"].decode())
        token_list = query_string.get("token")

        if token_list:
            token = token_list[0]
            try:
                validated_token = JWTAuthentication().get_validated_token(token)
                scope["user"] = await get_user(validated_token)
            except InvalidTokenError:
                scope["user"] = None
        else:
            scope["user"] = None

        close_old_connections()
        return await super().__call__(scope, receive, send)
