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
        userProfile: document.getElementById("template-user-profile"), // Neues Template
        tournament: document.getElementById("template-tournament") // New Tournament Template
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

        if (templateName === "signup" || templateName === "verify" || templateName === "login" || templateName === "menu" || templateName === "userProfile" || templateName === "tournament") {
            backgroundCanvas.style.display = "block";
        } else {
            backgroundCanvas.style.display = "none";
        }

        // Erstelle historyData vor der Verwendung
        let historyData = { ...data };
        
        // Wenn wir zum Game-Template wechseln, ersetzen wir die History
        // statt einen neuen Eintrag hinzuzufügen
        if (templateName === 'game') {
            window.history.replaceState(
                { template: templateName, data: historyData },
                '',
                `#${templateName}`
            );
            // Deaktiviere den Back-Button
            history.pushState(null, '', window.location.href);
            window.onpopstate = function(event) {
                history.pushState(null, '', window.location.href);
            };
        } else if (!preventPush) {
            // Normale History-Behandlung für andere Templates
            console.log("=== Saving to History ===");
            
            // Für Templates mit userProfile
            if (templateName === 'userProfile' || templateName === 'menu') {
                if (data.currentUserProfile) {
                    historyData.userProfile = data.currentUserProfile;
                } else if (data.userProfile) {
                    historyData.userProfile = data.userProfile;
                } else {
                    const storedProfile = localStorage.getItem('userProfile');
                    if (storedProfile) {
                        historyData.userProfile = JSON.parse(storedProfile);
                    }
                }
            }

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
            case 'tournament':
                setupTournament(data);
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

    function renderTournamentResults(results, round, totalRounds) {
        const container = document.getElementById('tournament-results');
        console.log("🎯 Rendering Results:", results);
        if (!container) return;
    
        const resultList = Object.entries(results).map(
            ([name, wins]) => `<li class="list-group-item">${name} – Wins: ${wins}</li>`
        ).join("");
    
        container.innerHTML = `
            <div class="card mt-4">
                <div class="card-header text-center">
                    <h5>🕹️ Round ${round} of ${totalRounds}</h5>
                </div>
                <div class="card-body">
                    <ul class="list-group">${resultList}</ul>
                </div>
            </div>
        `;
    }
    
    
    
    

    function setupTournament(data) {
        console.log("Setting up tournament with data:", data);
        const tournamentGrid = document.getElementById('tournament-grid');
        if (tournamentGrid) {
            const players = data.players || [];
            const round = data.round || 1;
            const totalRounds = data.total_rounds || 1;
            const matchups = data.matchups || [];
            const results = data.results || {};
    
            const playerList = players.map((p, index) =>
                `<li class="list-group-item">Player ${index + 1}: ${p.tournament_name}</li>`
            ).join("");
    
            let matchupsHTML = "";
            if (matchups.length > 0) {
                matchupsHTML += `<p class="text-center"><strong>Matchups:</strong></p>`;
                matchups.forEach((match) => {
                    const resultIcon = results[match.player1]
                        ? `✅ ${match.player1}`
                        : results[match.player2]
                        ? `✅ ${match.player2}`
                        : `${match.player1} vs ${match.player2}`;
                    matchupsHTML += `<p class="text-center">${resultIcon}</p>`;
                });
            }
    
            tournamentGrid.innerHTML = `
                <div class="card my-4">
                    <div class="card-header text-center">
                        <h4>🏆 Tournament Round ${round} of ${totalRounds}</h4>
                    </div>
                    <div class="card-body">
                        <ul class="list-group mb-4">
                            ${playerList}
                        </ul>
                        ${matchupsHTML}
                    </div>
                </div>
            `;
        }
    
        const backToMenuBtn = document.getElementById('back-to-menu');
        if (backToMenuBtn) {
            backToMenuBtn.addEventListener('click', () => {
                showTemplate('menu', { userProfile: data.userProfile });
            });
        }
    
        const startTournamentBtn = document.getElementById('start-tournament-btn');
        if (startTournamentBtn) {
            startTournamentBtn.addEventListener('click', () => {
                const socket = new WebSocket(`ws://${window.location.host}/ws/menu`);
    
                socket.onopen = () => {
                    console.log("📡 Tournament Start Button WebSocket verbunden");
                    socket.send(JSON.stringify({
                        action: "start_tournament_now"
                    }));
                };
    
                socket.onmessage = (event) => {
                    console.log("Serverantwort:", event.data);
                    socket.close();
                };
    
                socket.onerror = (error) => {
                    console.error("Fehler beim Senden des Startsignals:", error);
                };
            });
        }
    
        // Setze WebSocket für Ergebnisse auf
        const tournamentSocket = new WebSocket("ws://" + window.location.host + "/ws/menu");
    
        tournamentSocket.addEventListener("open", () => {
            console.log("🎯 TournamentSocket connected");
            tournamentSocket.send(JSON.stringify({ action: "request_tournament_results" }));
        });
    
        tournamentSocket.addEventListener("message", (event) => {
            const msg = JSON.parse(event.data);
    
            if (msg.action === "update_tournament_results") {
                console.log("📋 Ergebnisse erhalten:", msg.results);
                renderTournamentResults(msg.results, msg.round, msg.total_rounds, msg.matchups);
            }
        });

        if (data.results) {
            console.log("📋 Initiale Ergebnisse direkt rendern:", data.results);
            renderTournamentResults(data.results, data.round, data.total_rounds);
        }
        
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
        
        // Wenn wir im Game-Template sind, verhindern wir jede Navigation
        if (window.location.hash === '#game') {
            console.log("Preventing navigation while in game");
            history.pushState(null, '', window.location.href);
            return;
        }
        
        if (event.state && event.state.template) {
            // Verhindere Navigation zurück zum Game-Template
            if (event.state.template === 'game') {
                console.log("Preventing navigation back to game template");
                const storedProfile = localStorage.getItem('userProfile');
                const data = storedProfile ? { userProfile: JSON.parse(storedProfile) } : {};
                showTemplate('menu', data);
                return;
            }

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
            if (window.location.hash === '#game') {
                // Auch hier: Verhindere Navigation zum Game-Template
                console.log("Preventing direct navigation to game");
                const storedProfile = localStorage.getItem('userProfile');
                const data = storedProfile ? { userProfile: JSON.parse(storedProfile) } : {};
                showTemplate('menu', data);
            } else if (window.location.hash === '#menu') {
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