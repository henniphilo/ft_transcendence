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
    const BASE_URL = 'http://127.0.0.1:8000/api/users';
  
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
  
    /**
     * Ruft das Profil des eingeloggten Benutzers ab.
     *
     * @returns {Promise<object>} Promise mit den Profil-Daten.
     */
    function getProfile() {
      const accessToken = localStorage.getItem('accessToken');
      return fetch(`${BASE_URL}/profile/`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + accessToken,
        },
      }).then(response => {
        if (response.status === 401) {
          console.log('Access Token abgelaufen, versuche Refresh...');
          return refreshAccessToken().then(() => getProfile());
        }
        if (!response.ok) {
          return Promise.reject('Fehler beim Abrufen des Profils: ' + response.status);
        }
        return response.json();
      });
    }
  
    /**
     * Aktualisiert das Profil des Benutzers.
     *
     * @param {FormData} formData - FormData mit den zu aktualisierenden Feldern (z. B. bio, avatar).
     * @returns {Promise<object>} Promise mit den aktualisierten Profil-Daten.
     */
    function updateProfile(formData) {
      const accessToken = localStorage.getItem('accessToken');
      return fetch(`${BASE_URL}/profile/`, {
        method: 'PUT',
        headers: {
          // Hinweis: Beim Senden von FormData NICHT den Content-Type manuell setzen!
          'Authorization': 'Bearer ' + accessToken,
        },
        body: formData,
      }).then(response => {
        if (!response.ok) {
          return Promise.reject('Fehler beim Aktualisieren: ' + response.status);
        }
        return response.json();
      });
    }
  
    /**
     * Meldet den Benutzer ab, indem Tokens entfernt werden.
     */
    function logoutUser() {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      console.log('Logout erfolgreich!');
    }
  
    // Exponiere die Funktionen
    return {
      getCookie,
      sendVerificationCode,
      registerUser,
      verifyCode,
      loginUser,
      refreshAccessToken,
      getProfile,
      updateProfile,
      logoutUser,
    };
  })();
  
  /* === Beispiel: Verwendung der Library in Deinen Event-Handlern === */
  
  // Registrierung
  document.getElementById('signup-form').addEventListener('submit', function (event) {
    event.preventDefault();
  
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
  
    console.log("Daten, die gesendet werden:", { username, email, password });
  
    AuthLib.registerUser({ username, email, password })
      .then(data => {
        if (data.id) {
          // Registrierung war erfolgreich → 2FA aktivieren
          document.getElementById('signup-form').style.display = 'none';
          document.getElementById('2fa-container').style.display = 'block';
          // Verifizierungscode senden
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
  
  // 2FA-Verifizierung
  document.getElementById('verify-code').addEventListener('click', function () {
    const verificationCode = document.getElementById('verification-code').value;
    const email = document.getElementById('email').value;
  
    AuthLib.verifyCode(email, verificationCode)
      .then(data => {
        if (data.message) {
          alert('User verified! Now you can log in.');
          document.getElementById('2fa-container').style.display = 'none';
          document.getElementById('login-container').style.display = 'block';
        } else {
          alert('Error: ' + (data.error || 'Verifizierung fehlgeschlagen.'));
        }
      })
      .catch(error => {
        alert('Error: ' + error);
      });
  });

  /**
 * Aktualisiert die UI mit den Profil-Daten.
 * @param {Object} data - Das Profil-Datenobjekt.
 */
  function fillProfileFields(data) {
    document.getElementById('profile-username').textContent   = data.username || '';
    document.getElementById('profile-email').textContent      = data.email || '';
    document.getElementById('profile-bio').textContent        = data.bio || '';
    document.getElementById('profile-birth_date').textContent = data.birth_date || '';
    
    const avatarImg = document.getElementById('profile-avatar');
    if (data.avatar) {
      // Cache-Busting: Hänge einen Zeitstempel an den Avatar-URL an
      avatarImg.src = data.avatar + '?t=' + new Date().getTime();
    } else {
      avatarImg.src = 'https://placehold.co/80x80/f0f0f0/989898?text=No+Avatar';
    }
  }
  
  

  
  document.getElementById('login-form').addEventListener('submit', function (event) {
    event.preventDefault();
  
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
  
    AuthLib.loginUser(username, password)
      .then(() => {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('logout-button').style.display = 'block';
        alert('Login erfolgreich!');
        // Profil laden
        return AuthLib.getProfile();
      })
      .then(profileData => {
        console.log('Profil-Daten:', profileData);
        // Statt die rohen JSON-Daten anzuzeigen, wird die UI über fillProfileFields aktualisiert:
        fillProfileFields(profileData);
        document.getElementById('profile-container').style.display = 'block';
      })
      .catch(error => {
        alert('Login fehlgeschlagen: ' + (error.detail || error));
      });
  });
  
  
  // Logout
  document.getElementById('logout-button').addEventListener('click', function () {
    AuthLib.logoutUser();
    document.getElementById('logout-button').style.display = 'none';
    document.getElementById('login-container').style.display = 'block';
    document.getElementById('profile-container').style.display = 'none';
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
