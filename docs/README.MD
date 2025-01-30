# ft\_transcendence\_backend - Dokumentation

## 🚀 Projektübersicht

**ft\_transcendence\_backend** ist das Backend für ein Fullstack-Projekt, das eine 2FA-gesicherte Authentifizierung mit JWT verwendet. Es ist in **Django** mit **Django REST Framework (DRF)** gebaut und nutzt **PostgreSQL** als Datenbank. Die Kommunikation mit dem Frontend erfolgt über eine **REST API**.

### 🔧 Technologien & Frameworks

- **Python 3.10**
- **Django 5.1**
- **Django REST Framework (DRF)**
- **djangorestframework-simplejwt** (JWT Authentication)
- **PostgreSQL**
- **Docker & Docker Compose**
- **NGINX** (für das Frontend)

---

## ⚙️ Setup & Installation

### 1️⃣ **Projekt klonen & Virtual Environment erstellen**

```bash
git clone https://github.com/dein-repo/ft_transcendence_backend.git
cd ft_transcendence_backend
python3 -m venv venv
source venv/bin/activate  # (Windows: venv\Scripts\activate)
```

### 2️⃣ **Abhängigkeiten installieren**

```bash
pip install -r requirements.txt
```

### 3️⃣ **Umgebungsvariablen setzen (**``** Datei)**

Erstelle eine `.env` Datei im `backend/` Verzeichnis und füge die folgenden Werte hinzu:

```ini
POSTGRES_DB=transcendence
POSTGRES_USER=user
POSTGRES_PASSWORD=pass
SECRET_KEY=dein-geheimer-key
DEBUG=True
ALLOWED_HOSTS=*
```

### 4️⃣ **Datenbankmigrationen ausführen**

```bash
python manage.py migrate
python manage.py createsuperuser  # Falls ein Admin-Login benötigt wird
```

### 5️⃣ **Server starten**

```bash
python manage.py runserver 0.0.0.0:8000
```

---

## 🌍 API-Dokumentation

Alle Endpunkte der API befinden sich unter `/api/users/`.

### **🔹 Registrierung eines neuen Benutzers**

**POST** `/api/users/register/`

```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "securepassword"
}
```

**Antwort:**

```json
{
  "id": 1,
  "username": "testuser",
  "email": "test@example.com"
}
```

### **🔹 Login (JWT)**

**POST** `/api/users/login/`

```json
{
  "username": "testuser",
  "password": "securepassword"
}
```

**Antwort:**

```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5c...",
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
```

### **🔹 2FA-Code anfordern**

**POST** `/api/users/verify/send/`

```json
{
  "email": "test@example.com"
}
```

**Antwort:**

```json
{
  "message": "Verification code sent."
}
```

### **🔹 2FA-Code verifizieren**

**POST** `/api/users/verify/`

```json
{
  "email": "test@example.com",
  "code": "123456"
}
```

**Antwort:**

```json
{
  "message": "User verified."
}
```

---

## 🏗️ Architektur & Datenbankmodell

### **🔹 CustomUser Model** (`users.models.CustomUser`)

```python
class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    verification_code = models.CharField(max_length=6, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
```

### **🔹 Datenbank-Migrationen ausführen**

Falls Änderungen an den Modellen vorgenommen wurden:

```bash
python manage.py makemigrations
python manage.py migrate
```

---

## 🐳 Docker & Deployment

### **1️⃣ Backend mit Docker starten**

Falls du Docker nutzen möchtest, kannst du das Backend mit `docker-compose` starten.

```bash
docker-compose up --build
```

Falls du nur das Backend neustarten möchtest:

```bash
docker-compose restart backend
```

### **2️⃣ Wichtige Docker Befehle**

Container stoppen:

```bash
docker-compose down
```

Logs anzeigen:

```bash
docker-compose logs -f
```

---

## 📌 Testen mit cURL

### **🔹 Beispiel: User registrieren**

```bash
curl -X POST http://127.0.0.1:8000/api/users/register/ \
     -H "Content-Type: application/json" \
     -d '{"username": "testuser", "email": "test@example.com", "password": "securepassword"}'
```

### **🔹 Beispiel: Login**

```bash
curl -X POST http://127.0.0.1:8000/api/users/login/ \
     -H "Content-Type: application/json" \
     -d '{"username": "testuser", "password": "securepassword"}'
```

### **🔹 Beispiel: 2FA-Code senden**

```bash
curl -X POST http://127.0.0.1:8000/api/users/verify/send/ \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com"}'
```

### **🔹 Beispiel: 2FA-Code verifizieren**

```bash
curl -X POST http://127.0.0.1:8000/api/users/verify/ \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "code": "123456"}'
```

---

## 📝 Fazit

Diese Dokumentation bietet eine Übersicht über: ✅ Installation & Setup ✅ API-Endpunkte ✅ Authentifizierung mit JWT & 2FA ✅ Datenbankmodelle & Migrationen ✅ Docker & Deployment ✅ Beispiel-Requests mit cURL

Falls du noch Ergänzungen brauchst, sag Bescheid! 🚀


```mermaid
graph TD;
    subgraph "🚀 Transcendence Backend System"
        
        subgraph "🟥 Redis (Cache & Message Broker)"
            R1["✅ Schnelle Speicherung"]
            R2["🔄 Kommunikation mit Django"]
            R3["🗂 Speicherung von Sessions"]
        end

        subgraph "🐘 PostgreSQL (Datenbank)"
            DB1["📦 Speichert User & Spieldaten"]
            DB2["🔍 Abfragen & Transaktionen"]
            DB3["🛠 Nutzt Healthcheck zur Verfügbarkeit"]
        end

        subgraph "🐍 Django Backend (REST API)"
            D1["📡 Stellt API für das Frontend bereit"]
            D2["🔑 Authentifizierung (JWT & 2FA)"]
            D3["📊 Interaktion mit der Datenbank"]
            D4["🔄 Caching & Sessions über Redis"]
        end

        subgraph "🌍 Nginx Reverse Proxy"
            N1["🎭 Vermittelt Anfragen an Django"]
            N2["🖥️ Liefert das statische Frontend"]
            N3["🔒 Kann SSL-Terminierung übernehmen"]
        end

    end

    %% Verbindungen zwischen den Diensten
    R1 -.-> D4;
    R2 -.-> D4;
    DB1 --> D3;
    DB2 --> D3;
    DB3 -->|Healthcheck: ist DB erreichbar?| D3;
    D1 --> N1;
    D2 -->|Authentifizierung über API| N1;
    N1 -->|API-Zugriff & Statische Files| Browser["🖥️ Web-Browser"];

    %% Optische Anpassungen
    classDef service fill:#f9f,stroke:#333,stroke-width:2px;
    classDef database fill:#ffd700,stroke:#333,stroke-width:2px;
    classDef cache fill:#ff6961,stroke:#333,stroke-width:2px;
    classDef proxy fill:#61affe,stroke:#333,stroke-width:2px;
    classDef frontend fill:#85C1E9,stroke:#333,stroke-width:2px;

    class Redis cache;
    class PostgreSQL database;
    class Django service;
    class Nginx proxy;
    class Browser frontend;
