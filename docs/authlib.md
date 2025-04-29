# AuthLib

**AuthLib** ist eine kompakte JavaScript-Library zur Benutzer-Authentifizierung und Profilverwaltung. Sie bietet Funktionen für:

- **Registrierung** und **2FA (E-Mail-Verifizierung)**
- **Login** mit Token-Verwaltung und automatischem Token-Refresh
- **Profilverwaltung** (Abruf und Update)
- **Logout**

Die Library kapselt alle relevanten API-Aufrufe in einem Modul, sodass Du in Deinen Event-Handlern oder Komponenten einfach darauf zugreifen kannst.

---

## Inhaltsverzeichnis

- [Installation](#installation)
- [Verwendung](#verwendung)
    - [Registrierung und 2FA](#registrierung-und-2fa)
    - [Login und Token-Refresh](#login-und-token-refresh)
    - [Profilverwaltung](#profilverwaltung)
    - [Logout](#logout)
- [API-Funktionen](#api-funktionen)
- [Beispiel](#beispiel)
- [Mermaid-Diagramme](#mermaid-diagramme)
- [Mitwirkende](#mitwirkende)
- [Lizenz](#lizenz)

---

## Installation

1. **Datei einbinden**  
     Binde die `authLib.js` in Dein Projekt ein, z. B. direkt im HTML:
     
     ```html
     <script src="path/to/authLib.js"></script>
     ```

Alternativ kannst Du das Modul in einem ES-Module-Setup importieren.

2. **Backend konfigurieren**  
     Stelle sicher, dass Dein Backend die im Code verwendeten API-Endpunkte bereitstellt (z. B. unter http://127.0.0.1:8000/api/users).

Die Library stellt mehrere Funktionen bereit, die Du in Deinen Event-Handlern verwenden kannst. Hier einige typische Anwendungsfälle:

### Registrierung und 2FA

1. Registrierung: Über `registerUser({ username, email, password })` wird ein neuer Benutzer angelegt.
2. Verifizierung: Bei erfolgreicher Registrierung wird automatisch `sendVerificationCode(email)` aufgerufen, um einen Verifizierungscode an die E-Mail zu senden.

#### Beispiel-Code

```javascript
document.getElementById('signup-form').addEventListener('submit', function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    AuthLib.registerUser({ username, email, password })
        .then(data => {
            if (data.id) {
                // Registrierung erfolgreich: 2FA aktivieren
                document.getElementById('signup-form').style.display = 'none';
                document.getElementById('2fa-container').style.display = 'block';
                return AuthLib.sendVerificationCode(email);
            } else {
                return Promise.reject(data.error || 'Registrierung fehlgeschlagen.');
            }
        })
        .then(() => {
            alert('Verification code sent to your email!');
        })
        .catch(error => {
            console.error('Fehler:', error);
            alert('Fehler: ' + error);
        });
});
```

### Login und Token-Refresh

1. Login: Mit `loginUser(username, password)` erfolgt die Anmeldung. Dabei werden `accessToken` und `refreshToken` im `localStorage` gespeichert.
2. Token-Refresh: Wird ein API-Aufruf mit einem abgelaufenen Token getätigt (z. B. `getProfile()`), versucht die Library automatisch, den Token mit `refreshAccessToken()` zu erneuern.

#### Beispiel-Code

```javascript
document.getElementById('login-form').addEventListener('submit', function (event) {
    event.preventDefault();

    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    AuthLib.loginUser(username, password)
        .then(() => {
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('logout-button').style.display = 'block';
            alert('Login erfolgreich!');
            return AuthLib.getProfile();
        })
        .then(profileData => {
            console.log('Profil-Daten:', profileData);
            document.getElementById('profile-data').textContent = JSON.stringify(profileData);
            document.getElementById('profile-container').style.display = 'block';
        })
        .catch(error => {
            alert('Login fehlgeschlagen: ' + (error.detail || error));
        });
});
```

### Profilverwaltung

1. Abruf: Mit `getProfile()` erhältst Du die Profildaten des aktuell eingeloggten Benutzers.
2. Update: Mit `updateProfile(formData)` kannst Du das Profil aktualisieren (z. B. Bio und Avatar).

#### Beispiel-Code

```javascript
document.getElementById('edit-profile-button').addEventListener('click', () => {
    const newBio = prompt('Neue Bio eingeben:');
    if (!newBio) return;

    const avatarFile = document.getElementById('avatar-input').files[0];
    const formData = new FormData();
    formData.append('bio', newBio);
    if (avatarFile) {
        formData.append('avatar', avatarFile);
    }

    AuthLib.updateProfile(formData)
        .then(updatedData => {
            console.log('Aktualisierte Profil-Daten:', updatedData);
            // Aktualisiere die UI mit den neuen Daten
        })
        .catch(err => {
            console.error(err);
            alert('Profil-Update fehlgeschlagen: ' + err);
        });
});
```

### Logout

Mit `logoutUser()` werden die gespeicherten Tokens entfernt und der Benutzer wird ausgeloggt.

#### Beispiel-Code

```javascript
document.getElementById('logout-button').addEventListener('click', function () {
    AuthLib.logoutUser();
    document.getElementById('logout-button').style.display = 'none';
    document.getElementById('login-container').style.display = 'block';
    document.getElementById('profile-container').style.display = 'none';
    alert('Logout erfolgreich!');
});
```

## API-Funktionen

Die Library bietet folgende Funktionen:

- `getCookie(name)`: Liest den Wert eines Cookies anhand seines Namens.
- `sendVerificationCode(email)`: Sendet einen Verifizierungscode an die angegebene E-Mail.
- `registerUser(data)`: Registriert einen neuen Benutzer (Erwartet ein Objekt `{ username, email, password }`).
- `verifyCode(email, code)`: Überprüft den eingegebenen 2FA-Code.
- `loginUser(username, password)`: Meldet den Benutzer an und speichert die Tokens.
- `refreshAccessToken()`: Erneuert den Access-Token mithilfe des gespeicherten Refresh-Tokens.
- `getProfile()`: Ruft das Profil des eingeloggten Benutzers ab. Bei abgelaufenem Token wird automatisch ein Refresh durchgeführt.
- `updateProfile(formData)`: Aktualisiert das Profil des Benutzers (Erwartet ein `FormData`-Objekt, z. B. für das Update von Bio oder Avatar).
- `logoutUser()`: Meldet den Benutzer ab, indem die Tokens entfernt werden.

## Mermaid-Diagramme

### Registrierung & 2FA Flow

```mermaid
sequenceDiagram
        participant U as User
        participant F as Frontend
        participant API as AuthLib/API
        U->>F: Füllt Registrierungsformular aus
        F->>API: registerUser({ username, email, password })
        API-->>F: Gibt Response mit Benutzer-ID zurück
        F->>API: sendVerificationCode(email)
        API-->>F: Bestätigung, dass Code gesendet wurde
        Note over F: Benutzer gibt den Verifizierungscode ein
        F->>API: verifyCode(email, code)
        API-->>F: Verifizierung erfolgreich
```

### Login & Token-Refresh Flow

```mermaid
sequenceDiagram
        participant U as User
        participant F as Frontend
        participant API as AuthLib/API
        U->>F: Füllt Login-Formular aus
        F->>API: loginUser(username, password)
        API-->>F: Gibt Access- und Refresh-Token zurück
        F->>API: getProfile() (mit Access-Token)
        alt Token gültig
                API-->>F: Gibt Profil-Daten zurück
        else Token abgelaufen
                F->>API: refreshAccessToken()
                API-->>F: Neuer Access-Token
                F->>API: getProfile() (erneut)
                API-->>F: Gibt Profil-Daten zurück
        end
```

### Profil Update Flow

```mermaid
sequenceDiagram
        participant U as User
        participant F as Frontend
        participant API as AuthLib/API
        U->>F: Klickt auf "Profil bearbeiten"
        F->>API: updateProfile(formData)
        API-->>F: Gibt aktualisierte Profil-Daten zurück
```

### Logout Flow

```mermaid
flowchart TD
    A[Benutzer eingeloggt] --> B[logoutUser wird aufgerufen]
    B --> C[Tokens werden aus localStorage entfernt]
    C --> D[Benutzer wird ausgeloggt]
```

## Beispiel

Hier ein einfaches HTML-Beispiel, wie Du AuthLib in Deinem Projekt einbindest:

```html
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>AuthLib Beispiel</title>
    <script src="path/to/authLib.js"></script>
</head>
<body>
    <!-- Registrierungsformular -->
    <form id="signup-form">
        <input id="username" type="text" placeholder="Username" required>
        <input id="email" type="email" placeholder="Email" required>
        <input id="password" type="password" placeholder="Password" required>
        <button type="submit">Registrieren</button>
    </form>

    <!-- 2FA-Container -->
    <div id="2fa-container" style="display:none;">
        <input id="verification-code" type="text" placeholder="Verifizierungscode" required>
        <button id="verify-code">Code verifizieren</button>
    </div>

    <!-- Loginformular -->
    <form id="login-form" style="display:none;">
        <input id="login-username" type="text" placeholder="Username" required>
        <input id="login-password" type="password" placeholder="Password" required>
        <button type="submit">Login</button>
    </form>

    <!-- Profil-Container -->
    <div id="profile-container" style="display:none;">
        <div id="profile-data"></div>
        <button id="edit-profile-button">Profil bearbeiten</button>
        <input id="avatar-input" type="file">
        <button id="logout-button">Logout</button>
    </div>

    <script>
        // Hier werden die oben gezeigten Event-Handler eingebunden
        // (siehe die jeweiligen Code-Beispiele in diesem README)
    </script>
</body>
</html>
```

## Mitwirkende

Falls Du Verbesserungen vorschlagen oder Fehler beheben möchtest, öffne bitte ein Issue oder einen Pull Request.

## Lizenz

Dieses Projekt steht unter der MIT Lizenz.

---
