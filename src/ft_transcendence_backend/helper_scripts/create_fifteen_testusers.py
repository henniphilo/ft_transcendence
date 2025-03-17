#adapt this to create 15 testusers:

from django.contrib.auth.hashers import make_password
from django.contrib.auth import get_user_model
from users.models import CustomUser
import random

User = get_user_model()  # Falls du ein CustomUser hast, ansonsten django.contrib.auth.models.User

# Bestehende User löschen
CustomUser.objects.all().delete()

# 15 Testuser mit verschiedenen Scores erstellen
for i in range(1, 16):
    username = f'testuser{i}'
    email = f'testuser{i}@example.com'
    password = 'testuser'  # Gleiche Passwort wie im create_testuser.py
    avatar = f'avatars/avatar_{i}.png'  # Path relative to MEDIA_ROOT
    
    # Zufälligen Score zwischen 0 und 1000 generieren
    random_score = random.randint(0, 1000)
    
    user = CustomUser.objects.create_user(
        username=username,
        email=email,
        password=password,  # create_user verschlüsselt das Passwort automatisch
        is_active=True,
        score=random_score,
        avatar=avatar
    )
    
    # 2FA Verifizierung setzen
    user.is_verified = True
    user.save()

    print(f'Created test user: {username} with score: {random_score}')
    print(f"✅ Testuser{i} angelegt und als verifiziert markiert: username -> {username} und passwort -> {password}")