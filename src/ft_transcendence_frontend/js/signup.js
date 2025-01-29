function sendVerificationCode(email) {
    fetch('http://0.0.0.0:8000/api/users/verify/send/', {  // Anpassung der URL für das Senden des Verifizierungscodes
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
    fetch('http://0.0.0.0:8000/api/users/register/', {  // Anpassung der URL für die Registrierung
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

    fetch('http://0.0.0.0:8000/api/users/verify/', {
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