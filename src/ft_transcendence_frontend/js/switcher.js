import { MenuDisplay } from './game/displayMenu.js';
import { GameScreen } from './game/game_screen.js';

document.addEventListener("DOMContentLoaded", () => {
    const templates = {
        loginSignup: document.getElementById("template-login-signup"),
        menu: document.getElementById("template-menu"),
        game: document.getElementById("template-game")
    };
    const contentDiv = document.getElementById("content");

    function showTemplate(templateName) {
        contentDiv.innerHTML = ""; // Clear current content
        const clone = templates[templateName].content.cloneNode(true);
        contentDiv.appendChild(clone);

        if (templateName === "menu") {
            const menuDisplay = new MenuDisplay();
            menuDisplay.container = document.getElementById('menu-container');
            menuDisplay.onGameStart = (gameState) => {
                showTemplate("game");
                new GameScreen(gameState, () => showTemplate("menu"));
            };
        }
    }

    function handleLoginSignup() {
        document.getElementById("login-form").addEventListener("submit", (event) => {
            event.preventDefault();
            console.log("Login successful");
            showTemplate("menu");
        });

        document.getElementById("signup-form").addEventListener("submit", (event) => {
            event.preventDefault();
            console.log("Signup successful");
            showTemplate("menu");
        });
    }

    // Initially show the login/signup template
    showTemplate("loginSignup");
    handleLoginSignup();
});
