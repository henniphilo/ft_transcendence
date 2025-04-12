function sendVerificationCode(email) {
    fetch('http://127.0.0.1:8000/api/users/verify/send/', {  // Anpassung der URL für das Senden des Verifizierungscodes
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')  // CSRF-Token zur Sicherheit
        },
        body: JSON.stringify({ email: email })
    })
    .then(response => {
        console.log('Antwort-Status:', response.status);  // Logge den Statuscode
        return response.text();  // Lese die Antwort als Text, um Fehler zu vermeiden
    })
    .then(text => {
        console.log('Antworttext:', text);  // Logge die Antwort
        try {
            const data = JSON.parse(text);  // Versuche, die Antwort als JSON zu parsen
            if (data.message) {
                alert('Verification code sent to your email!');
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Fehler beim Parsen der Antwort:', error);
            alert('Fehler beim Parsen der Serverantwort.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while sending the verification code.');
    });
}


document.getElementById('signup-form').addEventListener('submit', function(event) {
    event.preventDefault();

    // Schritt 1: Eingabewerte auslesen und in der Konsole ausgeben
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    console.log("Eingabewerte:", { username, email, password });

    // Daten vorbereiten, die gesendet werden
    const data = {
        username: username,
        email: email,
        password: password
    };

    console.log("Daten, die gesendet werden:", data);

    // Schritt 2: Anfrage an die Backend-API zur Registrierung senden
    fetch('http://127.0.0.1:8000/api/users/register/', {  // Anpassung der URL für die Registrierung
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')  // CSRF-Token zur Sicherheit
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        console.log("Antwort vom Server erhalten:", response);
        if (!response.ok) {
            console.log("Fehler: Antwort vom Server ist nicht ok.", response.status);
            return Promise.reject('Fehler bei der Antwort');
        }
        return response.json();  // Weiter mit der Antwort, wenn sie ok ist
    })
    .then(data => {
        console.log("Antwort-JSON vom Server:", data);

        // Überprüfe, ob der Benutzer erfolgreich erstellt wurde
        if (data.id) {
            console.log("Erfolgreiche Registrierung");
            // Zeige das 2FA-Eingabefeld nach erfolgreicher Registrierung an
            document.getElementById('signup-form').style.display = 'none';
            document.getElementById('2fa-container').style.display = 'block';

            // Sende den Verifizierungscode an die E-Mail des Benutzers
            sendVerificationCode(email);
        } else {
            console.log("Fehler bei der Registrierung:", data.error);
            alert('Error: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Fehler:', error);
        alert('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
    });
});

// Funktion zum Abrufen des CSRF-Tokens aus den Cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// 2FA-Verifizierung
document.getElementById('verify-code').addEventListener('click', function() {
    const verificationCode = document.getElementById('verification-code').value;
    const email = document.getElementById('email').value;

    fetch('http://127.0.0.1:8000/api/users/verify/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ email: email, code: verificationCode })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert('User verified! Now you can log in.');
            document.getElementById('signup-form').style.display = 'none';
            document.getElementById('2fa-container').style.display = 'none';
            document.getElementById('login-container').style.display = 'block';
        } else {
            alert('Error: ' + data.error);
        }
    })
    .catch(error => {
        alert('Error: ' + error);
    });
});

    // Refresh-Funktion, falls du den Token erneuern willst
    function refreshAccessToken() {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          return Promise.reject('Kein Refresh-Token vorhanden. Bitte einloggen.');
        }
      
        return fetch('http://127.0.0.1:8000/api/users/token/refresh/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken })
        })
        .then(response => {
          if (!response.ok) {
            return Promise.reject('Refresh fehlgeschlagen: ' + response.status);
          }
          return response.json();
        })
        .then(data => {
          // Erneuerten Access-Token speichern
          localStorage.setItem('accessToken', data.access);
          console.log('Access-Token erneuert:', data.access);
        });
      }
      
  
  function getProfile() {
    const accessToken = localStorage.getItem('accessToken');
  
    fetch('http://127.0.0.1:8000/api/users/profile/', {
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
  

    fetch('http://127.0.0.1:8000/api/users/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    .then(response => {
      if (!response.ok) {
        // Falls 401 oder 400:
        return response.json().then(err => Promise.reject(err));
      }
      return response.json();
    })
    .then(data => {
      // -> { access: "...", refresh: "..." }
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
    
      // etc...
      // Login-Form ausblenden
      document.getElementById('login-form').style.display = 'none';
      alert('Login erfolgreich!');
      document.getElementById('logout-button').style.display = 'block';
  
      // Neu: Profil laden und Container zeigen
      showUserProfile();
    })
    .catch(err => {
      alert('Login fehlgeschlagen: ' + (err.detail || 'User not verified.'));
    });
    
      
   
  });



  
  /* 3) Profil-Endpoint abrufen (Beispiel) */
  function getProfile() {
    const accessToken = localStorage.getItem('accessToken');
    
    return fetch('http://127.0.0.1:8000/api/users/profile/', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    })
    .then(response => {
      if (response.status === 401) {
        console.log('Access Token abgelaufen, versuche Refresh...');
        return refreshAccessToken().then(() => getProfile());
      } else if (!response.ok) {
        return Promise.reject('Fehler: ' + response.status + ' ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      console.log('Profil-Daten:', data);
      // Fülle jetzt die Felder in deinem Profil-Container
      fillProfileFields(data);
      // Profil-Container einblenden
      document.getElementById('profile-container').style.display = 'block';
      return data; // falls du es noch weiter verwenden willst
    })
    .catch(error => {
      console.error('Fehler beim Profil-Abruf:', error);
      alert('Fehler beim Profil-Abruf: ' + error);
    });
  }
  
  // Funktion, um HTML-Felder zu füllen
  function fillProfileFields(data) {
    document.getElementById('profile-username').textContent  = data.username  || '';
    document.getElementById('profile-email').textContent     = data.email     || '';
    document.getElementById('profile-bio').textContent       = data.bio       || '';
  
    // Wenn 'avatar' belegt ist, setze das Bild-Element. Sonst ein Standardbild:
    const avatarImg = document.getElementById('profile-avatar');
    avatarImg.src = data.avatar ? data.avatar : 'https://placehold.co/80x80/f0f0f0/989898?text=No+Avatar';
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
    document.getElementById('profile-container').style.display = 'none';
  
    // Login-Form wieder anzeigen (oder Signup etc.)
    document.getElementById('login-form').style.display = 'block';
    
    document.getElementById('logout-button').style.display = 'none';

    alert('Logout erfolgreich!');
  });
  
 document.getElementById('edit-profile-button').addEventListener('click', () => {
  // Beispiel: Neue Bio abfragen
  const newBio = prompt('Neue Bio eingeben:');
  if (!newBio) return;

  // Access-Token holen
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    alert('Du musst eingeloggt sein, um das Profil zu ändern!');
    return;
  }

  // Ausgewählte Bilddatei holen
  const avatarFile = document.getElementById('avatar-input').files[0];

  // FormData erstellen und Felder befüllen
  const formData = new FormData();
  formData.append('bio', newBio);        // Text-Feld
  if (avatarFile) {
    formData.append('avatar', avatarFile); // Datei-Feld
  }

  fetch('http://127.0.0.1:8000/api/users/profile/', {
    method: 'PUT',
    headers: {
      // WICHTIG: Content-Type NICHT manuell setzen, 
      // sonst würde FormData nicht korrekt funktionieren.
      'Authorization': 'Bearer ' + accessToken
    },
    body: formData
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Fehler beim Aktualisieren: ' + response.status);
    }
    return response.json();
  })
  .then(updatedData => {
    console.log('Aktualisierte Profil-Daten:', updatedData);
    fillProfileFields(updatedData); // Deine Funktion zum Aktualisieren der UI
  })
  .catch(err => {
    console.error(err);
    alert('Profil-Update fehlgeschlagen: ' + err);
  });
});

  

  document.addEventListener('DOMContentLoaded', () => {
    const accessToken = localStorage.getItem('accessToken');
    const logoutButton = document.getElementById('logout-button');
    
    if (accessToken) {
      // Token vorhanden → eingeloggt
      logoutButton.style.display = 'block';
    } else {
      // kein Token → ausgeloggt
      logoutButton.style.display = 'none';
    }
  });
  