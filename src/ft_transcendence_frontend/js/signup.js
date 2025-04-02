import { MenuDisplay } from './game/displayMenu.js';

// AuthLib Definition
const AuthLib = (function () {
    'use strict';
    const BASE_URL = '/api/users';

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

    // ... Behalte alle AuthLib Funktionen ...
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
        return fetch(`${BASE_URL}/profile/`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        })
            .then(response => {
                if (response.status === 401) {
                    return refreshAccessToken().then(() => getProfile());
                }
                if (!response.ok) {
                    return Promise.reject(`Fehler: ${response.status} ${response.statusText}`);
                }
                return response.json();
            });
    }

    async function logoutUser() {
        const accessToken = localStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken");

        if (!accessToken) {
            console.log("🚫 Kein Token gefunden, bereits ausgeloggt.");
            return;
        }

        try {
            const response = await fetch("http://localhost:8000/api/users/logout/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                },
                body: JSON.stringify({ refresh_token: refreshToken })
            });

            const result = await response.json();
            console.log("✅ Server-Antwort:", result.message);

        } catch (error) {
            console.error("⚠️ Fehler beim Logout:", error);
        }

        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        
        window.location.href = "/";
    }

    return {
        getCookie,
        sendVerificationCode,
        registerUser,
        verifyCode,
        loginUser,
        refreshAccessToken,
        getProfile,
        logoutUser
    };
})();

// Gemeinsame Daten für die Handler
const SharedData = {
    formData: null
};

// Handler-Klassen für die Template-Logik
export const SignupHandler = {
    init() {
        console.log("SignupHandler wird initialisiert");
        const signupForm = document.getElementById('signup-form');
        const switchToLoginBtn = document.getElementById('switch-to-login');
        const usernameInput = document.getElementById('username');
        const errorDiv = document.createElement('div');
        
        // Füge Error-Div unter dem Username-Input hinzu
        errorDiv.style.color = 'red';
        errorDiv.style.display = 'none';
        usernameInput.parentNode.insertBefore(errorDiv, usernameInput.nextSibling);
        
        if (signupForm) {
            signupForm.addEventListener('submit', this.handleSignup.bind(this));
        }
        
        if (switchToLoginBtn) {
            switchToLoginBtn.addEventListener('click', () => {
                document.dispatchEvent(new CustomEvent('templateChange', {
                    detail: { template: 'login' }
                }));
            });
        }

        // Validiere Username-Eingabe
        usernameInput.addEventListener('input', (e) => {
            const invalidChars = e.target.value.match(/[^a-zA-Z0-9]/g);
            if (invalidChars) {
                errorDiv.textContent = 'Username darf nur Buchstaben und Zahlen enthalten';
                errorDiv.style.display = 'block';
                signupForm.querySelector('button[type="submit"]').disabled = true;
            } else {
                errorDiv.style.display = 'none';
                signupForm.querySelector('button[type="submit"]').disabled = false;
            }
        });

        // Setze das pattern-Attribut für HTML5-Validierung
        usernameInput.pattern = "[a-zA-Z0-9]+";
        usernameInput.title = "Username can only contain letters and numbers";
    },

    async handleSignup(event) {
        event.preventDefault();
        
        const username = document.getElementById('username').value;
        // Zusätzliche Validierung vor dem Submit
        if (username.match(/[^a-zA-Z0-9]/g)) {
            alert('Username darf nur Buchstaben und Zahlen enthalten');
            return;
        }
        
        SharedData.formData = {
            username: username,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };

        try {
            await AuthLib.registerUser(SharedData.formData);
            console.log("User erfolgreich registriert");
            
            await AuthLib.sendVerificationCode(SharedData.formData.email);
            console.log("Verifizierungscode gesendet");
            
            document.dispatchEvent(new CustomEvent('templateChange', {
                detail: { template: 'verify' }
            }));
        } catch (error) {
            console.error('Fehler bei der Registrierung:', error);
            alert(error);
        }
    }
};

export class VerifyHandler {
    static init() {
        const verifyButton = document.getElementById('verify-code');
        if (!verifyButton) return;
        
        verifyButton.addEventListener('click', this.handleVerification);
        
        const resendButton = document.getElementById('resend-code');
        if (resendButton) {
            resendButton.addEventListener('click', this.handleResendCode);
        }
    }

    static async handleVerification() {
        if (!SharedData.formData) {
            console.error('Keine Formulardaten gefunden');
            return;
        }

        const code = document.getElementById('verification-code').value;

        try {
            // Nur Code verifizieren, nicht nochmal registrieren
            await AuthLib.verifyCode(SharedData.formData.email, code);
            console.log("Code erfolgreich verifiziert");
            
            SharedData.formData = null;
            
            alert('Registrierung erfolgreich!');
            document.dispatchEvent(new CustomEvent('templateChange', {
                detail: { template: 'login' }
            }));
        } catch (error) {
            console.error('Fehler bei der Verifizierung:', error);
            alert(error);
        }
    }

    static async handleResendCode() {
        if (!SharedData.formData) {
            console.error('Keine E-Mail-Adresse gefunden');
            return;
        }

        try {
            await AuthLib.sendVerificationCode(SharedData.formData.email);
            alert('Neuer Code wurde gesendet!');
        } catch (error) {
            console.error('Fehler beim erneuten Senden des Codes:', error);
            alert(error);
        }
    }
}

export class LoginHandler {
    static init() {
        console.log("LoginHandler wird initialisiert");
        const loginForm = document.getElementById('login-form');
        const switchToSignupBtn = document.getElementById('switch-to-signup');
        
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }
        
        if (switchToSignupBtn) {
            switchToSignupBtn.addEventListener('click', () => {
                document.dispatchEvent(new CustomEvent('templateChange', {
                    detail: { template: 'signup' }
                }));
            });
        }
    }

    static async handleLogin(event) {
        event.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            await AuthLib.loginUser(username, password);
            const userProfile = await AuthLib.getProfile();
            
            alert('Login erfolgreich!');
            
            document.dispatchEvent(new CustomEvent('templateChange', {
                detail: { 
                    template: 'menu',
                    userProfile: userProfile
                }
            }));
        } catch (error) {
            console.error('Login fehlgeschlagen:', error);
            alert('Login fehlgeschlagen. Bitte Username/Passwort prüfen.');
        }
    }
}