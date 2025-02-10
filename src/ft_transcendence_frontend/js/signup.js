/**
 * AuthLib – Eine kompakte Library zur Benutzer-Authentifizierung und Profilverwaltung.
 *
 * Diese Library stellt Funktionen zur Verfügung für:
 * - Registrierung und 2FA (E-Mail-Verifizierung)
 * - Login und Token-Refresh
 * - Profilabruf und -aktualisierung
 * - CSRF-Token-Verwaltung
 *
 * Verwende diese Funktionen z. B. in Deinen Event-Handlern.
 */
const AuthLib = (function () {
    'use strict';

    // Basis-URL für API-Endpunkte
    const BASE_URL = '/api/users';
  
    /**
     * Liest einen Cookie-Wert anhand des Namens.
     *
     * @param {string} name - Name des Cookies.
     * @returns {string|null} Der Cookie-Wert oder null, wenn nicht gefunden.
     */
    function getCookie(name) {
      let cookieValue = null;
      if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
          cookie = cookie.trim();
          if (cookie.startsWith(name + '=')) {
            cookieValue = decodeURIComponent(cookie.slice(name.length + 1));
            break;
          }
        }
      }
      return cookieValue;
    }

    /**
     * Sendet einen Verifizierungscode an die angegebene E-Mail.
     *
     * @param {string} email - Die E-Mail-Adresse des Benutzers.
     * @returns {Promise<object|string>} Promise mit der Serverantwort (als JSON oder Text).
     */
    function sendVerificationCode(email) {
      return fetch(`${BASE_URL}/verify/send/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify({ email }),
      })
        .then(response => {
          console.log('sendVerificationCode - Status:', response.status);
          return response.text();
        })
        .then(text => {
          try {
            const data = JSON.parse(text);
            if (data.message) {
              return data;
            }
            return Promise.reject(data.error || 'Unbekannter Fehler beim Senden des Codes.');
          } catch (error) {
            console.error('sendVerificationCode - JSON Parse Error:', error);
            return Promise.reject('Fehler beim Parsen der Serverantwort.');
          }
        });
    }

    /**
     * Registriert einen neuen Benutzer.
     *
     * @param {Object} data - Benutzer-Daten (z. B. { username, email, password }).
     * @returns {Promise<object>} Promise mit der Serverantwort.
     */
    function registerUser(data) {
      return fetch(`${BASE_URL}/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify(data),
      })
        .then(response => {
          console.log('registerUser - Antwort:', response);
          if (!response.ok) {
            return Promise.reject('Fehler bei der Registrierung (Status ' + response.status + ')');
          }
          return response.json();
        });
    }

    /**
     * Überprüft den 2FA-Verifizierungscode.
     *
     * @param {string} email - Die E-Mail-Adresse des Benutzers.
     * @param {string} code - Der eingegebene Verifizierungscode.
     * @returns {Promise<object>} Promise mit der Serverantwort.
     */
    function verifyCode(email, code) {
      return fetch(`${BASE_URL}/verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify({ email, code }),
      }).then(response => response.json());
    }

    /**
     * Meldet einen Benutzer an und speichert Access- und Refresh-Token.
     *
     * @param {string} username - Der Benutzername.
     * @param {string} password - Das Passwort.
     * @returns {Promise<object>} Promise mit den Token-Daten.
     */
    function loginUser(username, password) {
      return fetch(`${BASE_URL}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
        .then(response => {
          if (!response.ok) {
            return response.json().then(err => Promise.reject(err));
          }
          return response.json();
        })
        .then(data => {
          localStorage.setItem('accessToken', data.access);
          localStorage.setItem('refreshToken', data.refresh);
          return data;
        });
    }

    /**
     * Versucht, den Access-Token mit dem gespeicherten Refresh-Token zu erneuern.
     *
     * @returns {Promise<void>}
     */
    function refreshAccessToken() {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return Promise.reject('Kein Refresh-Token vorhanden. Bitte einloggen.');
      }

      return fetch(`${BASE_URL}/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      })
        .then(response => {
          if (!response.ok) {
            return Promise.reject('Refresh fehlgeschlagen: ' + response.status);
          }
          return response.json();
        })
        .then(data => {
          localStorage.setItem('accessToken', data.access);
          console.log('Access-Token erneuert:', data.access);
        });
      }


  function getProfile() {
    const accessToken = localStorage.getItem('accessToken');

    fetch('http://0.0.0.0:8000/api/users/profile/', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    })
    .then(response => {
      if (response.status === 401) {
        // Access Token evtl. abgelaufen -> Refresh versuchen
        console.log('Access Token abgelaufen, versuche Refresh...');
        return refreshAccessToken().then(() => getProfile());
        // <--- Achtung, ggf. Endlosschleifen abfangen,
        // falls das Refresh auch 401 gibt (z. B. Refresh-Token ungültig).
      } else if (!response.ok) {
        return Promise.reject(`Fehler: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Profil-Daten:', data);
      // Zeige die Daten z. B. auf der Seite an
    })
    .catch(error => {
      console.error('Fehler beim Profil-Abruf:', error);
      alert('Fehler beim Profil-Abruf: ' + error);
    });
  }



  document.getElementById('logout-button').addEventListener('click', function() {
    // Tokens aus localStorage löschen
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // UI anpassen
    document.getElementById('logout-button').style.display = 'none';
    document.getElementById('login-container').style.display = 'block';
    document.getElementById('game-container').style.display = 'none';

    alert('Logout erfolgreich!');
  });

  document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    fetch('http://0.0.0.0:8000/api/users/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    .then(response => {
      if (!response.ok) return response.json().then(err => Promise.reject(err));
      return response.json();
    })
    .then(data => {
      // -> { access: "...", refresh: "..." }
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);

      // Login-Form ausblenden
      document.getElementById('login-form').style.display = 'none';
      alert('Login erfolgreich!');

      // Neu: Profil laden und Container zeigen
      showUserProfile();
    })
    .catch(err => {
      console.error('Login fehlgeschlagen:', err);
      alert('Login fehlgeschlagen. Bitte Username/Passwort prüfen.');
    });
  });


  /* 3) Profil-Endpoint abrufen (Beispiel) */
  function getProfile() {
    const accessToken = localStorage.getItem('accessToken');
    return fetch('http://0.0.0.0:8000/api/users/profile/', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + accessToken }
    })
    .then(res => {
      if (res.status === 401) {
        // Access Token evtl. abgelaufen -> Refresh
        return refreshAccessToken().then(() => getProfile());
      }
      if (!res.ok) {
        throw new Error('Fehler ' + res.status);
      }
      return res.json();
    });
  }

  /* 2) Profil-Container + Daten anzeigen */
  function showUserProfile() {
    getProfile() // oder loadUserProfile(), je nach Code
      .then(data => {
        // p#profile-data mit JSON oder spezifischen Daten füllen
        document.getElementById('profile-data').textContent = JSON.stringify(data);

        // Profil-Container einblenden
        document.getElementById('profile-container').style.display = 'block';
      })
      .catch(error => {
        // Falls Profil-Abruf scheitert, ggf. wieder Login anzeigen
        console.error('Fehler beim Profil-Abruf:', error);
        alert('Konnte Profil nicht laden. Bitte erneut einloggen.');
        // Optional: localStorage.clear(), etc.
      });
  }


  /* 4) Logout im Profil-Container */
  document.getElementById('logout-button').addEventListener('click', () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // Profil-Container ausblenden
        alert('Login fehlgeschlagen: ' + (error.detail || error));
      });
  });


  // Logout
  document.getElementById('logout-button').addEventListener('click', function () {
    AuthLib.logoutUser();
    document.getElementById('logout-button').style.display = 'none';
    document.getElementById('login-container').style.display = 'block';
    document.getElementById('profile-container').style.display = 'none';

    // Login-Form wieder anzeigen (oder Signup etc.)
    document.getElementById('login-form').style.display = 'block';

    alert('Logout erfolgreich!');
  });


  // Event-Listener für den "Profil bearbeiten"-Button
document.getElementById('edit-profile-button').addEventListener('click', () => {
  const newBio = prompt('Neue Bio eingeben:');
  // Avatar-Datei aus dem Input-Feld holen (falls vorhanden)
  const avatarFile = document.getElementById('avatar-input').files[0];

  // Falls weder Bio noch Avatar geändert werden, abbrechen
  if (!newBio && !avatarFile) {
    alert('Es wurden keine Änderungen vorgenommen.');
    return;
  }

  // FormData erstellen und nur die Felder anhängen, die aktualisiert werden sollen
  const formData = new FormData();
  if (newBio) {
    formData.append('bio', newBio);
  }
  if (avatarFile) {
    formData.append('avatar', avatarFile);
  }

  // Profil-Update via AuthLib aufrufen
  AuthLib.updateProfile(formData)
    .then(updatedData => {
      console.log('Aktualisierte Profil-Daten:', updatedData);
      fillProfileFields(updatedData);
      alert('Profil erfolgreich aktualisiert!');
      // Optional: Datei-Input zurücksetzen
      document.getElementById('avatar-input').value = "";
    })
    .catch(err => {
      console.error('Fehler beim Aktualisieren:', err);
      alert('Profil-Update fehlgeschlagen: ' + err);
    });
});

// Event-Listener für den Datei-Input: Avatar sofort hochladen, wenn ein neues Bild ausgewählt wurde
document.getElementById('avatar-input').addEventListener('change', (e) => {
  const avatarFile = e.target.files[0];
  if (!avatarFile) return; // Falls keine Datei ausgewählt wurde

  const formData = new FormData();
  formData.append('avatar', avatarFile);

  // Profil-Update nur für den Avatar aufrufen
  AuthLib.updateProfile(formData)
    .then(updatedData => {
      console.log('Profil-Update (Avatar) erfolgreich:', updatedData);
      fillProfileFields(updatedData);
      alert('Avatar erfolgreich aktualisiert!');
      // Datei-Input zurücksetzen
      e.target.value = "";
    })
    .catch(err => {
      console.error('Fehler beim Avatar-Update:', err);
      alert('Avatar-Update fehlgeschlagen: ' + err);
    });
});
