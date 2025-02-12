import redis
import json
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.authentication import JWTAuthentication

# Redis-Client
redis_client = redis.StrictRedis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0, decode_responses=True)

class JWTUserMiddleware(MiddlewareMixin):
    """
    Middleware, um eingeloggte User nach dem JWT-Login in Redis zu speichern.
    """

    def process_request(self, request):
        # JWT-Authentifizierung versuchen
        auth = JWTAuthentication()
        try:
            user, _ = auth.authenticate(request)
            if user:
                redis_key = f"user:{user.id}"
                
                # Überprüfen, ob der User bereits in Redis ist
                if not redis_client.exists(redis_key):
                    user_data = json.dumps({
                        "id": user.id,
                        "username": user.username,
                        "status": "online"
                    })
                    redis_client.setex(redis_key, 1800, user_data)  # 30 Min TTL

        except Exception:
            pass  # Falls JWT fehlt oder ungültig ist, einfach weitermachen
