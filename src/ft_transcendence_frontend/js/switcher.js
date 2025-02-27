import { MenuDisplay } from './game/displayMenu.js'; // Importiere die MenuDisplay-Klasse
import { GameScreen } from './game/game_screen.js'; // Korrigierter Import-Pfad
import { SignupHandler, VerifyHandler, LoginHandler } from './signup.js';

document.addEventListener("DOMContentLoaded", () => {
    const templates = {
        signup: document.getElementById("template-signup"),
        verify: document.getElementById("template-verify"),
        login: document.getElementById("template-login"),
        menu: document.getElementById("template-menu"),
        game: document.getElementById("template-game")
    };
    const contentDiv = document.getElementById("content");
    const backgroundCanvas = document.getElementById("background-canvas");

    function showTemplate(templateName, data = {}) {
        console.log("Template wird gewechselt zu:", templateName);
        contentDiv.innerHTML = "";
        const template = templates[templateName];
        if (!template) {
            console.error("Template nicht gefunden:", templateName);
            return;
        }
        
        const clone = template.content.cloneNode(true);
        contentDiv.appendChild(clone);

        if (templateName === "signup" || templateName === "verify" || templateName === "login" || templateName === "menu") {
            backgroundCanvas.style.display = "block";
        } else {
            backgroundCanvas.style.display = "none";
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
        }
    }

    function setupMenu(userProfile) {
        // Initialisiere die MenuDisplay-Klasse mit dem Benutzerprofil
        const menuDisplay = new MenuDisplay(userProfile);
    }

    function setupGameScreen(data) {
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.style.display = 'block';
            window.gameScreen = new GameScreen(data, () => {
                gameContainer.style.display = 'none';
                showTemplate('menu', { userProfile: data.userProfile });
            });
        }
    }

    // Event Listener für Template-Wechsel
    document.addEventListener('templateChange', (event) => {
        if (event.detail && event.detail.template) {
            showTemplate(event.detail.template, event.detail);
        }
    });

    // Initially show the signup template
    showTemplate("signup");

    // Füge die Funktion dem globalen Fensterobjekt hinzu
    window.showTemplate = showTemplate;
});