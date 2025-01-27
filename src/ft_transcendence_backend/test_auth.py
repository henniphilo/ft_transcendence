import requests
import time

# === Konfiguration ===
API_BASE_URL = "http://127.0.0.1:8000/api/users/"
USERNAME = "testuser123"
EMAIL = "testuser123@example.com"
PASSWORD = "SecurePassword123"

# === 1️⃣ User registrieren ===
def register_user():
    data = {"username": USERNAME, "email": EMAIL, "password": PASSWORD}
    response = requests.post(f"{API_BASE_URL}register/", json=data)
    print("📨 Register Response:", response.json())
    return response.json()

# === 2️⃣ 2FA-Code aus DB abrufen ===
import os
import django

# Django Umgebung laden
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")  # <-- Falls dein Django-Projekt `backend` heißt
django.setup()

from users.models import CustomUser

def get_verification_code():
    user = CustomUser.objects.get(email=EMAIL)
    return user.verification_code


# === 3️⃣ 2FA-Code verifizieren ===
def verify_2fa(code):
    data = {"email": EMAIL, "code": code}
    response = requests.post(f"{API_BASE_URL}verify/", json=data)
    print("✅ 2FA Verify Response:", response.json())
    return response.json()

# === 4️⃣ Login & JWT-Token abrufen ===
def login_user():
    data = {"username": USERNAME, "password": PASSWORD}
    response = requests.post(f"{API_BASE_URL}login/", json=data)
    print("🔑 Login Response:", response.json())
    return response.json()

# === Ablauf des Tests ===
if __name__ == "__main__":
    print("🚀 Starting Test Script...")

    # Schritt 1: Registrierung
    register_response = register_user()
    if "id" not in register_response:
        print("❌ Registrierung fehlgeschlagen!")
        exit(1)

    # Schritt 2: 5 Sekunden warten, um sicherzugehen, dass der Code generiert wurde
    time.sleep(5)

    # Schritt 3: 2FA-Code holen
    try:
        verification_code = get_verification_code()
        print(f"📩 2FA Code erhalten: {verification_code}")
    except Exception as e:
        print("❌ Konnte 2FA Code nicht abrufen!", e)
        exit(1)

    # Schritt 4: 2FA verifizieren
    verify_response = verify_2fa(verification_code)
    if "message" not in verify_response:
        print("❌ 2FA Verifikation fehlgeschlagen!")
        exit(1)

    # Schritt 5: Login durchführen
    login_response = login_user()
    if "access" in login_response:
        print("🎉 Erfolgreich eingeloggt! Access Token:", login_response["access"])
    else:
        print("❌ Login fehlgeschlagen!")

    print("✅ Test abgeschlossen!")
