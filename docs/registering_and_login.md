# ft_transcendence – Registrierung & Login mit 2FA

Dieses Projekt demonstriert eine Django-REST-API mit JWT-Authentifizierung (via django-rest-framework-simplejwt), inklusive 2-Faktor-Verifizierung. Das Frontend ist eine einfache Single Page Application (SPA) mit JavaScript (Fetch API).

## Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Ablaufdiagramme (Mermaid)](#ablaufdiagramme)
    - [Registrierung & 2FA](#registrierung--2fa)
    - [Login-Prozess](#login-prozess)
3. [Backend-Setup](#backend-setup)
4. [Frontend-Setup](#frontend-setup)
5. [Endpoints & Code-Struktur](#endpoints--code-struktur)
    - [Registrierung](#registrierung)
    - [2FA-Code senden & verifizieren](#2fa-code-senden--verifizieren)
    - [Login](#login)
    - [Profil](#profil)
6. [Wichtige Hinweise](#wichtige-hinweise)

## Übersicht

1. Benutzer registriert sich (Angabe von Username, E-Mail, Passwort).
2. Backend legt den User an (is_verified = False) und sendet einen 2FA-Code per E-Mail.
3. Benutzer gibt den Verification Code ein.
4. Backend setzt is_verified = True.
5. Jetzt kann sich der Benutzer einloggen und erhält ein JWT (Access + Refresh).

## Ablaufdiagramme

### Registrierung & 2FA

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant Frontend (SPA)
    participant Django (Backend)
    participant DB

    User->>Frontend (SPA): Öffnet Signup-Formular (Username/Email/Passwort)
    Frontend (SPA)->>Django (Backend): POST /api/users/register/ mit {username, email, password}
    Django (Backend)->>DB: Speichert neuen User (is_verified = False)
    Django (Backend)->>User: Antwort (User-ID)
    Frontend (SPA)->>Django (Backend): POST /api/users/verify/send/ mit { email }
    Django (Backend)->>DB: Generiert verification_code, speichert
    Django (Backend)->>User: Sendet E-Mail mit verification_code
    User->>Frontend (SPA): Klickt "Verify Code" und gibt code ein
    Frontend (SPA)->>Django (Backend): POST /api/users/verify/ mit { email, code }
    Django (Backend)->>DB: Setze is_verified = True, lösche code
    Django (Backend)->>User: "User verified!"
    style User fill:#f9f,stroke:#333,stroke-width:2px
    style Frontend (SPA) fill:#bbf,stroke:#333,stroke-width:2px
    style Django (Backend) fill:#bfb,stroke:#333,stroke-width:2px
    style DB fill:#ff9,stroke:#333,stroke-width:2px
```

### Login-Prozess

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant Frontend (SPA)
    participant Django (Backend)
    participant DB

    User->>Frontend (SPA): Öffnet Login-Form (Username/Passwort)
    Frontend (SPA)->>Django (Backend): POST /api/users/login/ (username + password)
    Django (Backend)->>DB: Prüft Userdaten und is_verified
    alt is_verified == True
        Django (Backend)->>Frontend (SPA): {access: <token>, refresh: <token>}
        Frontend (SPA)->>LocalStorage: Speichert Tokens
        Frontend (SPA)->>User: "Login erfolgreich"
    else is_verified == False
        Django (Backend)->>Frontend (SPA): Fehler (HTTP 400/401)
        Frontend (SPA)->>User: "Login fehlgeschlagen. User nicht verifiziert."
    end
    style User fill:#f9f,stroke:#333,stroke-width:2px
    style Frontend (SPA) fill:#bbf,stroke:#333,stroke-width:2px
    style Django (Backend) fill:#bfb,stroke:#333,stroke-width:2px
    style DB fill:#ff9,stroke:#333,stroke-width:2px
```

## Backend-Setup

- Python-Version: z. B. 3.9+
- Virtuelle Umgebung (optional, aber empfohlen)
- Abhängigkeiten installieren:

```sh
pip install -r requirements.txt
```

- Django-Migrationen anwenden:

```sh
python manage.py migrate
```

- Starten:

```sh
python manage.py runserver
```

## Frontend-Setup

Das Frontend ist eine SPA mit reinem JavaScript (Fetch). Um es zu testen, kannst du:

- Einfach eine `index.html` öffnen (lokal oder per `python -m http.server`)
- Sicherstellen, dass deine URLs (z. B. `http://127.0.0.1:8000/api/users/...`) richtig sind.

Wenn du Cross-Origin-Probleme hast, kannst du CORS erlauben (z. B. via `django-cors-headers`).

## Endpoints & Code-Struktur

### Registrierung

- URL: `POST /api/users/register/`
- Body: `{ "username": "...", "email": "...", "password": "..." }`
- Response: User-Daten (JSON) oder Fehler

### 2FA-Code senden & verifizieren

- URL: `POST /api/users/verify/send/`
    - Body: `{ "email": "..." }`
    - Generiert einen verification_code, speichert ihn in der DB und verschickt ihn per Mail.
- URL: `POST /api/users/verify/`
    - Body: `{ "email": "...", "code": "..." }`
    - Wenn der Code korrekt ist: Setzt is_verified = True.

### Login

- URL: `POST /api/users/login/`
- Body: `{ "username": "...", "password": "..." }`
- Response: `{ "access": "...", "refresh": "..." }` oder Error, falls is_verified = False.

### Profil

- URL: `GET /api/users/profile/`
    - Header: `Authorization: Bearer <access-token>`
    - Gibt die User-Daten zurück (z. B. username, email, bio, avatar).
- URL: `PUT /api/users/profile/`
    - Body: Felder, die du updaten möchtest (z. B. `{ "bio": "...", "avatar": "..." }`).
    - Header: `Authorization: Bearer <access-token>`
    - Aktualisiert das Profil nur, wenn is_verified = True.

## Wichtige Hinweise

- **JWT-Refresh**: Access-Token läuft nach kurzer Zeit ab; mittels refresh-Token kannst du einen neuen Access-Token anfordern (`POST /api/users/token/refresh/`).
- **Logout**: Bei JWT meist nur clientseitig durch Löschen der Tokens (`localStorage.removeItem(...)`). Optional kannst du SimpleJWT Blacklisting einrichten.
- **Security**:
    - Stelle sicher, dass du SSL/HTTPS verwendest, wenn du im Produktivbetrieb Passwörter oder Tokens übertragen willst.
    - Prüfe, ob du bei Django-Settings das CSRF- und CORS-Handling korrekt konfiguriert hast, falls das Frontend getrennt vom Backend läuft.
