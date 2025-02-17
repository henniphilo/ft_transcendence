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
        const loginForm = document.getElementById("login-form");
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            // Hole die Eingaben
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;

            try {
                // Führe den Login durch und speichere die Tokens
                await AuthLib.loginUser(username, password);
                alert('Login erfolgreich!');

                // Optional: Login-Container ausblenden
                document.getElementById('login-container').style.display = 'none';

                // Hole das Benutzerprofil
                const userProfile = await AuthLib.getProfile();

                // Zeige das Menü an und übergebe das Profil
                showTemplate("menu");
                const menuDisplay = new MenuDisplay(userProfile);
                menuDisplay.display();
            } catch (error) {
                console.error('Login fehlgeschlagen:', error);
                alert('Login fehlgeschlagen. Bitte Username/Passwort prüfen.');
            }
        });
    }

    function setupMenu() {
        // Initialisiere die MenuDisplay-Klasse
        const menuDisplay = new MenuDisplay();
        menuDisplay.display(); // Zeige das Menü an
    }

    function setupGameScreen() {
        const gameContainer = document.getElementById('game-container');
        gameContainer.style.display = 'block';

        const gameState = {
            player1: { name: "Player 1", score: 0, paddle: 0 },
            player2: { name: "Player 2", score: 0, paddle: 0 },
            ball: [0, 0],
            playerRole: null,
            gameId: null
        };

        const gameScreen = new GameScreen(gameState, () => {
            gameContainer.style.display = 'none';
            showTemplate('menu');
        });

        console.log(">> GameScreen initialized with gameState:", gameState);

            // Falls ein game_id gesendet wird, setze es im gameState
            if (data.game_id) {
                gameState.gameId = data.game_id;
                gameScreen.gameId = data.game_id; // WICHTIG!
                console.log("Game ID received:", gameState.gameId);
            }

            if (data.playerRole) {
                gameScreen.playerRole = data.playerRole;
                gameScreen.gameState.playerRole = data.playerRole;
                console.log("Player role received:", gameScreen.playerRole);
            }

        gameScreen.display();
    }


    // Initially show the signup template
    showTemplate("signup");

    // Füge die Funktion dem globalen Fensterobjekt hinzu
    window.showTemplate = showTemplate;
});
