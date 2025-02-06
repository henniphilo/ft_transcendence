from django.contrib.auth.hashers import make_password
from django.contrib.auth import get_user_model

User = get_user_model()

# Neuen User anlegen
user = User.objects.create_user(
    username='testuser',
    email='testuser@example.com',
    password='testuser',
    is_active=True,
    score=0
)

# 2FA Verifizierung setzen
user.is_verified = True
user.save()

print(f"✅ Testuser angelegt und als verifiziert markiert: username -> testuser und passwort -> testuser")
print(f"Score gesetzt auf: 0")