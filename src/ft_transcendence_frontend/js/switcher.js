import { MenuDisplay } from './game/displayMenu.js'; // Importiere die MenuDisplay-Klasse
import { GameScreen } from './game/game_screen.js'; // Korrigierter Import-Pfad

document.addEventListener("DOMContentLoaded", () => {
    const templates = {
        signup: document.getElementById("template-signup"),
        login: document.getElementById("template-login"),
        menu: document.getElementById("template-menu"),
        game: document.getElementById("template-game")
    };
    const contentDiv = document.getElementById("content");
    const backgroundCanvas = document.getElementById("background-canvas");

    function showTemplate(templateName) {
        contentDiv.innerHTML = ""; // Clear current content
        const clone = templates[templateName].content.cloneNode(true);
        contentDiv.appendChild(clone);

        // Hintergrund nur für Signup, Login und Menü anzeigen
        if (templateName === "signup" || templateName === "login" || templateName === "menu") {
            backgroundCanvas.style.display = "block";
        } else {
            backgroundCanvas.style.display = "none";
        }

        if (templateName === "signup") {
            setupSignup();
        } else if (templateName === "login") {
            setupLogin();
        } else if (templateName === "menu") {
            setupMenu();
        } else if (templateName === "game") {
            setupGameScreen();
        }
    }

    function setupSignup() {
        document.getElementById("signup-form").addEventListener("submit", (event) => {
            event.preventDefault();
            console.log("Signup successful");
            showTemplate("login");
        });

        document.getElementById("switch-to-login").addEventListener("click", () => {
            showTemplate("login");
        });
    }

    function setupLogin() {
        document.getElementById("login-form").addEventListener("submit", async (event) => {
            event.preventDefault();
            // Führe den Login-Prozess durch und erhalte das Token
            // Speichere das Token im localStorage oder einer anderen sicheren Stelle

            try {
                const userProfile = await AuthLib.getProfile();
                console.log("Login successful");
                showTemplate("menu");
                const menuDisplay = new MenuDisplay(userProfile);
                menuDisplay.display();
            } catch (error) {
                console.error('Error fetching user profile:', error);
            }
        });
    }

    function setupMenu() {
        // Initialisiere die MenuDisplay-Klasse
        const menuDisplay = new MenuDisplay();
        menuDisplay.display(); // Zeige das Menü an
    }

    function setupGameScreen() {
        // Hier wird der GameScreen initialisiert
        const gameContainer = document.getElementById('game-container');
        gameContainer.style.display = 'block';
        const gameScreen = new GameScreen({
            player1: { name: "Player 1", score: 0, paddle: 0 },
            player2: { name: "Player 2", score: 0, paddle: 0 },
            ball: [0, 0]
        }, () => {
            // Back to menu callback
            gameContainer.style.display = 'none';
            showTemplate('menu');
        });
        gameScreen.display();
    }

    // Initially show the signup template
    showTemplate("signup");

    // Füge die Funktion dem globalen Fensterobjekt hinzu
    window.showTemplate = showTemplate;
});