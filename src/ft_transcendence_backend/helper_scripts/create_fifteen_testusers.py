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
    password = 'testpassword123'
    
    # Zufälligen Score zwischen 0 und 1000 generieren
    random_score = random.randint(0, 1000)
    
    user = CustomUser.objects.create_user(
        username=username,
        email=email,
        password=password,
        is_active=True,
        score=random_score
    )
    
    print(f'Created test user: {username} with score: {random_score}')

    # Falls dein Modell ein Feld für die 2FA-Verifizierung hat, z. B. "is_verified" oder "two_factor_verified"
    # oder "is_2fa_enabled/active/whatever", dann einfach hier auf True setzen
    user.is_verified = True  # <--- Oder das entsprechende Attribut
    user.save()

    print(f"✅ Testuser{i} angelegt und als verifiziert markiert: username -> testuser{i} und passwort -> testuser")