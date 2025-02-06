#adapt this to create 15 testusers:

from django.contrib.auth.hashers import make_password
from django.contrib.auth import get_user_model

User = get_user_model()  # Falls du ein CustomUser hast, ansonsten django.contrib.auth.models.User

for i in range(1, 16):
    # Neuen User anlegen
    user = User(
        username=f'testuser{i}',
        email=f'testuser{i}@example.com',
        # Passwort verschlüsseln; manche Helper-Funktionen machen das auch automatisch
        password=make_password('testuser'),
    )
    user.save()

    # Falls dein Modell ein Feld für die 2FA-Verifizierung hat, z. B. "is_verified" oder "two_factor_verified"
    # oder "is_2fa_enabled/active/whatever", dann einfach hier auf True setzen
    user.is_verified = True  # <--- Oder das entsprechende Attribut
    user.save()

    print(f"✅ Testuser{i} angelegt und als verifiziert markiert: username -> testuser{i} und passwort -> testuser")