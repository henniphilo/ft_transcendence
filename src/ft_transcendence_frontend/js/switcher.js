import { MenuDisplay } from './game/displayMenu.js'; // Importiere die MenuDisplay-Klasse
import { GameScreen } from './game/game_screen.js'; // Korrigierter Import-Pfad
import { SignupHandler, VerifyHandler, LoginHandler } from './signup.js';
import { UserProfileView } from './userProfileView.js'; // Neuer Import

document.addEventListener("DOMContentLoaded", () => {
    const templates = {
        signup: document.getElementById("template-signup"),
        verify: document.getElementById("template-verify"),
        login: document.getElementById("template-login"),
        menu: document.getElementById("template-menu"),
        game: document.getElementById("template-game"),
        userProfile: document.getElementById("template-user-profile") // Neues Template
    };
    const contentDiv = document.getElementById("content");
    const backgroundCanvas = document.getElementById("background-canvas");

    function showTemplate(templateName, data = {}, preventPush = false) {
        console.log("=== Template Switch ===");
        console.log("Switching to:", templateName);
        console.log("With data:", data);
        
        contentDiv.innerHTML = "";
        const template = templates[templateName];
        if (!template) {
            console.error("Template nicht gefunden:", templateName);
            return;
        }
        
        const clone = template.content.cloneNode(true);
        contentDiv.appendChild(clone);

        if (templateName === "signup" || templateName === "verify" || templateName === "login" || templateName === "menu" || templateName === "userProfile") {
            backgroundCanvas.style.display = "block";
        } else {
            backgroundCanvas.style.display = "none";
        }

        // Füge den neuen Zustand zur Browser-Historie hinzu
        if (!preventPush) {
            console.log("=== Saving to History ===");
            
            // Erstelle ein neues Objekt nur mit den benötigten Daten
            let historyData = {};
            
            // Kopiere nur die notwendigen Daten für das jeweilige Template
            if (templateName === 'userProfile') {
                historyData = {
                    username: data.username,  // Username des anzuzeigenden Profils
                    userProfile: data.currentUserProfile  // Profil des eingeloggten Users
                };
            } else if (templateName === 'game') {
                historyData = {
                    ...data,
                    userProfile: data.currentUserProfile || data.userProfile
                };
            } else if (templateName === 'menu') {
                // Für das Menü brauchen wir nur das userProfile
                historyData = {
                    userProfile: data.currentUserProfile || data.userProfile
                };
            }

            // Fallback zum localStorage
            if (!historyData.userProfile) {
                const storedProfile = localStorage.getItem('userProfile');
                if (storedProfile) {
                    historyData.userProfile = JSON.parse(storedProfile);
                }
            }

            console.log("Final history data:", historyData);

            window.history.pushState(
                { template: templateName, data: historyData },
                '',
                `#${templateName}`
            );
        }

        // Initialisiere die entsprechenden Handler
        switch(templateName) {
            case 'signup':
                SignupHandler.init();
                break;
            case 'verify':
                VerifyHandler.init();
                break;
            case 'login':
                LoginHandler.init();
                break;
            case 'menu':
                setupMenu(data.userProfile);
                break;
            case 'game':
                setupGameScreen(data);
                break;
            case 'userProfile':
                setupUserProfile(data);
                break;
        }
    }

    function setupMenu(userProfile) {
        console.log("Menu wird eingerichtet mit Profil:", userProfile);
        
        // Stelle sicher, dass ein gültiges Benutzerprofil vorhanden ist
        if (!userProfile || typeof userProfile !== 'object' || Object.keys(userProfile).length === 0) {
            console.log("Kein gültiges Profil übergeben, versuche aus localStorage zu laden");
            // Versuche, das Profil aus dem localStorage zu laden
            const storedProfile = localStorage.getItem('userProfile');
            if (storedProfile) {
                try {
                    userProfile = JSON.parse(storedProfile);
                    console.log("Profil aus localStorage geladen:", userProfile);
                } catch (e) {
                    console.error("Fehler beim Parsen des gespeicherten Profils:", e);
                }
            }
        }
        
        // Initialisiere die MenuDisplay-Klasse mit dem Benutzerprofil
        window.menuDisplay = new MenuDisplay(userProfile);
    }

    function setupGameScreen(data) {
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            // Cleanup falls ein Spiel läuft
            if (window.gameScreen) {
                window.gameScreen.cleanup();
                window.gameScreen = null;
            }
            
            gameContainer.style.display = 'block';
            window.gameScreen = new GameScreen(data, () => {
                gameContainer.style.display = 'none';
                showTemplate('menu', { userProfile: data.userProfile });
            });
        }
    }
    
    function setupUserProfile(data) {
        // Initialisiere die UserProfileView mit dem Benutzernamen und dem aktuellen Benutzerprofil
        new UserProfileView(data.username, data.currentUserProfile);
    }

    // Event Listener für Template-Wechsel
    document.addEventListener('templateChange', (event) => {
        if (event.detail && event.detail.template) {
            showTemplate(event.detail.template, event.detail);
        }
    });

    // Popstate Handler
    window.addEventListener('popstate', (event) => {
        console.log("=== Browser Navigation ===");
        console.log("Navigation event state:", event.state);
        console.log("Current hash:", window.location.hash);
        
        if (event.state && event.state.template) {
            console.log("Template from state:", event.state.template);
            console.log("Data from state:", event.state.data);
            
            let templateData = { ...event.state.data };
            
            // Stelle sicher, dass das userProfile verfügbar ist
            if (event.state.template === 'menu') {
                console.log("Checking userProfile for menu:");
                console.log("- From state data:", templateData.userProfile);
                console.log("- From localStorage:", localStorage.getItem('userProfile'));
                
                if (!templateData.userProfile) {
                    const storedProfile = localStorage.getItem('userProfile');
                    if (storedProfile) {
                        templateData.userProfile = JSON.parse(storedProfile);
                    }
                }
                console.log("Final templateData:", templateData);
            }
            
            showTemplate(event.state.template, templateData, true);
        } else {
            console.log("No template state found");
            if (window.location.hash === '#menu') {
                const storedProfile = localStorage.getItem('userProfile');
                const data = storedProfile ? { userProfile: JSON.parse(storedProfile) } : {};
                showTemplate('menu', data);
            } else {
                showTemplate('signup');
            }
        }
    });

    // Initially show the signup template
    showTemplate("signup");

    // Füge die Funktion dem globalen Fensterobjekt hinzu
    window.showTemplate = showTemplate;
});