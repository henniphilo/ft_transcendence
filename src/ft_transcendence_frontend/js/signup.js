/**
 * AuthLib – Eine kompakte Library zur Benutzer-Authentifizierung und Profilverwaltung.
 *
 * Funktionen:
 * - Registrierung und 2FA (E-Mail-Verifizierung)
 * - Login und Token-Refresh
 * - Profilabruf und -aktualisierung
 * - CSRF-Token-Verwaltung
 */
const AuthLib = (function () {
  'use strict';

  // Basis-URL für API-Endpunkte
  const BASE_URL = '/api/users';

  /**
   * Liest einen Cookie-Wert anhand des Namens.
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
   * @param {string} email - Die E-Mail-Adresse des Benutzers.
   * @returns {Promise<object|string>} Promise mit der Serverantwort.
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
   * @param {Object} data - Benutzer-Daten (z.B. { username, email, password }).
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
   * Holt das Benutzerprofil.
   * @returns {Promise<object>} Promise mit den Profil-Daten.
   */
  function getProfile() {
    const accessToken = localStorage.getItem('accessToken');
    return fetch(`${BASE_URL}/profile/`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    })
      .then(response => {
        if (response.status === 401) {
          // Access Token abgelaufen, versuche Refresh
          return refreshAccessToken().then(() => getProfile());
        }
        if (!response.ok) {
          return Promise.reject(`Fehler: ${response.status} ${response.statusText}`);
        }
        return response.json();
      });
  }

  /**
   * Aktualisiert das Benutzerprofil.
   * @param {FormData} formData - Die FormData mit den zu aktualisierenden Feldern.
   * @returns {Promise<object>} Promise mit den aktualisierten Profil-Daten.
   */
  function updateProfile(formData) {
    const accessToken = localStorage.getItem('accessToken');
    return fetch(`${BASE_URL}/profile/`, {
      method: 'PUT', // oder 'PATCH', je nach API
      headers: {
        'Authorization': 'Bearer ' + accessToken
        // Kein Content-Type-Header, da FormData gesendet wird
      },
      body: formData
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => Promise.reject(err));
        }
        return response.json();
      });
  }

  /**
   * Meldet den Benutzer ab.
   */
  // function logoutUser() {
    // localStorage.removeItem('accessToken');
    // localStorage.removeItem('refreshToken');
  // }
  async function logoutUser() {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (!accessToken) {
        console.log("🚫 Kein Token gefunden, bereits ausgeloggt.");
        return;
    }

    try {
        // 📝 API-Request an Django senden, um den User aus Redis zu entfernen
        const response = await fetch("http://localhost:8000/api/users/logout/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
            body: JSON.stringify({ refresh_token: refreshToken })  // Optional
        });

        const result = await response.json();
        console.log("✅ Server-Antwort:", result.message);

    } catch (error) {
        console.error("⚠️ Fehler beim Logout:", error);
    }

    // 🗑️ Tokens aus dem localStorage entfernen
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    // 🔄 Optional: User zur Login-Seite leiten
    window.location.href = "/login";
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
    logoutUser
  };
})();

/* ===================== UI-Interaktionen und Event-Listener ===================== */

/**
 * Füllt die Profilfelder im DOM mit den abgerufenen Daten.
 * Passe die Feldnamen an Deine API-Antwort an!
 */
function fillProfileFields(data) {
  if (data.username) {
    document.getElementById('profile-username').textContent = data.username;
  }
  if (data.email) {
    document.getElementById('profile-email').textContent = data.email;
  }
  if (data.bio) {
    document.getElementById('profile-bio').textContent = data.bio;
  }
  if (data.birth_date) {
    document.getElementById('profile-birth_date').textContent = data.birth_date;
  }
  if (data.avatar_url) {
    document.getElementById('profile-avatar').src = data.avatar_url;
  }
}

/**
 * Lädt das Benutzerprofil und zeigt den Profil-Container an.
 */
function showUserProfile() {
  AuthLib.getProfile()
    .then(data => {
      fillProfileFields(data);
      // Profil-Container anzeigen und Login-Container ausblenden
      document.getElementById('profile-container').style.display = 'block';
      document.getElementById('login-container').style.display = 'none';
    })
    .catch(error => {
      console.error('Fehler beim Profil-Abruf:', error);
      alert('Konnte Profil nicht laden. Bitte erneut einloggen.');
    });
}

/* Login-Formular */
document.getElementById('login-form').addEventListener('submit', function(event) {
  event.preventDefault();
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  AuthLib.loginUser(username, password)
    .then(() => {
      alert('Login erfolgreich!');
      // Login-Container ausblenden und Profil anzeigen
      document.getElementById('login-container').style.display = 'none';
      showUserProfile();
    })
    .catch(err => {
      console.error('Login fehlgeschlagen:', err);
      alert('Login fehlgeschlagen. Bitte Username/Passwort prüfen.');
    });
});

/* Logout-Button */
document.getElementById('logout-button').addEventListener('click', function () {
  AuthLib.logoutUser();
  // UI zurücksetzen: Login-Container einblenden, Profil-Container ausblenden
  document.getElementById('login-container').style.display = 'block';
  document.getElementById('profile-container').style.display = 'none';
  // Falls erforderlich, Login-Formular wieder anzeigen
  document.getElementById('login-form').style.display = 'block';
  alert('Logout erfolgreich!');
});

/* Profil bearbeiten (z.B. Bio ändern, Avatar auswählen) */
document.getElementById('edit-profile-button').addEventListener('click', () => {
  const newBio = prompt('Neue Bio eingeben:');
  const avatarFile = document.getElementById('avatar-input').files[0];

  if (!newBio && !avatarFile) {
    alert('Es wurden keine Änderungen vorgenommen.');
    return;
  }

  const formData = new FormData();
  if (newBio) {
    formData.append('bio', newBio);
  }
  if (avatarFile) {
    formData.append('avatar', avatarFile);
  }

  AuthLib.updateProfile(formData)
    .then(updatedData => {
      console.log('Aktualisierte Profil-Daten:', updatedData);
      fillProfileFields(updatedData);
      alert('Profil erfolgreich aktualisiert!');
      document.getElementById('avatar-input').value = "";
    })
    .catch(err => {
      console.error('Fehler beim Aktualisieren:', err);
      alert('Profil-Update fehlgeschlagen: ' + err);
    });
});

/* Direktes Aktualisieren des Avatars, wenn ein neues Bild ausgewählt wird */
document.getElementById('avatar-input').addEventListener('change', (e) => {
  const avatarFile = e.target.files[0];
  if (!avatarFile) return;
  const formData = new FormData();
  formData.append('avatar', avatarFile);

  AuthLib.updateProfile(formData)
    .then(updatedData => {
      console.log('Profil-Update (Avatar) erfolgreich:', updatedData);
      fillProfileFields(updatedData);
      alert('Avatar erfolgreich aktualisiert!');
      e.target.value = "";
    })
    .catch(err => {
      console.error('Fehler beim Avatar-Update:', err);
      alert('Avatar-Update fehlgeschlagen: ' + err);
    });
});
