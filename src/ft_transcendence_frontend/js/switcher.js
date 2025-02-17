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
        document.getElementById("login-form").addEventListener("submit", (event) => {
            event.preventDefault();
            console.log("Login successful");
            showTemplate("menu");
        });
    }

    function setupMenu() {
        const startGameButton = document.getElementById("start-game-button");
        startGameButton.addEventListener("click", () => {
            console.log("Starting game...");
            showTemplate("game");
        });
    }

    // Initially show the signup template
    showTemplate("signup");
});