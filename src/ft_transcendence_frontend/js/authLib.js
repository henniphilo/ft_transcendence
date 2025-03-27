// Basis-URL für API-Endpunkte
const BASE_URL = '/api/users';

/**
 * Liest einen Cookie-Wert anhand des Namens.
 */
export function getCookie(name) {
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
 */
export function sendVerificationCode(email) {
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
 */
export function registerUser(data) {
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
 */
export function verifyCode(email, code) {
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
 */
export function loginUser(username, password) {
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
 * Versucht, den Access-Token zu erneuern.
 */
export function refreshAccessToken() {
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
 */
export function getProfile() {
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
 */
export function updateProfile(formData) {
    const accessToken = localStorage.getItem('accessToken');
    return fetch(`${BASE_URL}/profile/`, {
        method: 'PUT',
        headers: {
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
 * Meldet den Benutzer ab.
 */
export function logoutUser() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    console.log('Logout erfolgreich!');
} 