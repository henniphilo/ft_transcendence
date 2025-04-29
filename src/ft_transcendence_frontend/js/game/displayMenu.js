import { GameScreen } from "./game_screen.js";
import { ProfileHandler } from '../profileHandler.js';
import { OnlineUsersHandler } from '../onlineUsers.js';
import { LeaderboardDisplay } from './displayLeaderboard.js';
import { updateProfile, logoutUser, getProfile } from '../authLib.js';
import { fillProfileFields } from '../profileHandler.js';
import { FriendsHandler } from '../friendsHandler.js';

export class MenuDisplay {
    constructor(userProfile) {
        console.log("MenuDisplay loaded!");

        this.container = document.getElementById('menu-container');
        const wsProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
        const wsHost = window.location.hostname;
        const wsPort = window.location.protocol === "https:" ? "" : ":8001";

        const wsUrl = `${wsProtocol}${wsHost}${wsPort}/ws/menu`;
        console.log("Versuche WebSocket-Verbindung zu:", wsUrl);

        this.ws = new WebSocket(wsUrl);

        this.gameMode = null;
        this.playMode = null;
        this.currentSettings = null;
        this.leaderboardDisplay = null;
        this.userProfile = userProfile;
        this.elements = {};
        this.friendsHandler = new FriendsHandler();
        this.menuHistory = [];
        this.currentMenuState = null;

        // Browser-History-Event-Listener nur hinzufügen, wenn wir im Menü-Template sind
        if (window.location.hash === '#menu') {
            window.addEventListener('popstate', (event) => {
                if (event.state && event.state.menuState) {
                    this.handleHistoryNavigation(event.state.menuState);
                }
            });

            // Initialen State nur setzen, wenn wir tatsächlich im Menü sind
            setTimeout(() => {
                // Prüfe ob wir direkt ins Menü navigiert sind (nicht via Back-Button)
                if (
                  window.location.hash === "#menu" &&
                  !window.history.state?.template
                ) {
                  console.log("Initialisiere Menü-History");
                  window.history.pushState({ menuState: "main" }, "", "#menu");
                }
              }, 0);
            }

        this.initWebSocket();
    }

    initWebSocket() {
        this.ws.onopen = () => {
            console.log('Connected to server');
            this.requestMenuItems();
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.menu_items) {
                this.displayMenuItems(data.menu_items);
                if (data.selected_mode) {
                    this.gameMode = data.selected_mode;
                }
            } else if (data.action) {
                this.handleMenuAction(data);
            }
        };
    }

    requestMenuItems() {
        this.ws.send(JSON.stringify({ action: 'get_menu_items' }));
    }

    editProfile() {
        const modalContent = `
            <div class="modal fade" id="editProfileModal" tabindex="-1" aria-labelledby="editProfileModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header" style="background-color: #8c9900; color: white;">
                            <h5 class="modal-title" id="editProfileModalLabel">Edit Profile</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body" style="background-color: #b9a84cc0;">
                            <form id="edit-profile-form">
                                <div class="mb-3">
                                    <label for="edit-bio" class="form-label">Bio:</label>
                                    <textarea id="edit-bio" class="form-control">${this.userProfile.bio || ''}</textarea>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-tournament-name" class="form-label">Tournament Name:</label>
                                    <input type="text" id="edit-tournament-name" class="form-control" value="${this.userProfile.tournament_name || ''}">
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn" style="background-color: #8c9900; color: white;" id="save-profile">Save</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Füge das Modal zum DOM hinzu
        const modalElement = document.createElement('div');
        modalElement.innerHTML = modalContent;
        document.body.appendChild(modalElement);

        // Zeige das Modal an
        const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
        modal.show();

        // Event-Listener für den Save-Button
        document.getElementById('save-profile').addEventListener('click', async () => {
            const bio = document.getElementById('edit-bio').value;
            const tournamentName = document.getElementById('edit-tournament-name').value;

            try {
                const formData = new FormData();
                formData.append('bio', bio);
                formData.append('tournament_name', tournamentName);

                const result = await ProfileHandler.updateProfile(formData);

                // Aktualisiere die lokalen Daten
                this.userProfile.bio = bio;
                this.userProfile.tournament_name = tournamentName;

                // Aktualisiere die Anzeige
                if (this.elements.bio) this.elements.bio.textContent = bio;
                if (this.elements.tournamentName) this.elements.tournamentName.textContent = tournamentName;

                modal.hide();

                // Entferne das Modal aus dem DOM nach dem Schließen
                document.getElementById('editProfileModal').addEventListener('hidden.bs.modal', function () {
                    document.body.removeChild(modalElement);
                });

            } catch (error) {
                console.error('Error updating profile:', error);
                alert('Failed to update profile. Please try again.');
            }
        });
    }

    updateProfileDisplay(profileData) {
        if (this.elements.bio) this.elements.bio.textContent = profileData.bio || '';
        if (this.elements.email) this.elements.email.textContent = profileData.email || '';
        if (this.elements.tournamentName) this.elements.tournamentName.textContent = profileData.tournament_name || '';
        if (this.elements.avatar) {
            this.elements.avatar.src = profileData.avatar
                ? profileData.avatar + '?t=' + new Date().getTime()
                : '/assets/default-avatar.png';
        }
    }

    displayMenuItems(menuItems) {
        this.container.innerHTML = `
            <div class="container py-4">
                <div class="row">
                    <div class="col-md-4">
                        <div class="card mb-4">
                            <div class="card-header profile-header">
                                <h3 class="mb-0">Menu</h3>
                            </div>
                            <div class="card-body profile-card">
                                <div id="menu-options" class="d-grid gap-3"></div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card mb-4">
                            <div class="card-header profile-header">
                                <h3 class="mb-0">Profile</h3>
                            </div>
                            <div class="card-body profile-card">
                                <div class="row">
                                    <div class="col-md-4 col-sm-12 text-center">
                                        <img class="profile-avatar rounded-circle mb-3"
                                             src="${this.userProfile.avatar || '/media/avatars/default.png'}"
                                             alt="Avatar" style="width: 100px; height: 100px; object-fit: cover;" />
                                        <div class="mb-3">
                                            <label for="avatar-input" class="form-label">Change Avatar:</label>
                                            <input class="avatar-input form-control form-control-sm" type="file" accept="image/*" />
                                        </div>
                                    </div>
                                    <div class="col-md-8 col-sm-12">
                                        <h4 class="profile-username mb-3">Welcome ${this.userProfile.username}!</h4>
                                        <div class="profile-details mb-3">
                                            <p class="mb-2"><strong>Email:</strong> <span class="profile-email">${this.userProfile.email}</span></p>
                                            <p class="mb-2"><strong>Bio:</strong> <span class="profile-bio">${this.userProfile.bio || ''}</span></p>
                                            <p class="mb-2"><strong>Tournament Name:</strong> <span class="profile-tournament-name">${this.userProfile.tournament_name || ''}</span></p>
                                        </div>
                                        <div class="d-grid gap-2">
                                            <button class="edit-profile-button btn btn-primary-custom">Edit Profile</button>
                                            <button class="logout-button btn btn-danger">Logout</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-2 col-md-3 col-sm-6">
                        <div class="card mb-4">
                            <div class="card-header online-players-header">
                                <h3 class="mb-0">Online Players</h3>
                            </div>
                            <div class="card-body profile-card online-players-list">
                                <ul id="online-users-list" class="list-group"></ul>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-2 col-md-3 col-sm-6">
                        <div class="card">
                            <div class="card-header friends-header">
                                <h3 class="mb-0">Friends</h3>
                            </div>
                            <div class="card-body profile-card friends-list">
                                <ul id="friends-list" class="list-group">
                                    <li class="list-group-item text-center" id="no-friends-message">
                                        No friends found
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // DOM-Elemente nach dem Rendern speichern
        this.elements = {
            bio: this.container.querySelector('.profile-bio'),
            email: this.container.querySelector('.profile-email'),
            tournamentName: this.container.querySelector('.profile-tournament-name'),
            avatar: this.container.querySelector('.profile-avatar'),
            avatarInput: this.container.querySelector('.avatar-input'),
            editButton: this.container.querySelector('.edit-profile-button'),
            logoutButton: this.container.querySelector('.logout-button')
        };

        // Event-Listener hinzufügen
        if (this.elements.editButton) {
            this.elements.editButton.addEventListener('click', () => this.editProfile());
        }
        if (this.elements.logoutButton) {
            this.elements.logoutButton.addEventListener('click', () => this.logout());
        }
        if (this.elements.avatarInput) {
            this.elements.avatarInput.addEventListener('change', (e) => this.handleAvatarChange(e));
        }

        menuItems.forEach(item => {
            const button = document.createElement('button');
            button.className = 'btn w-100';
            button.style.backgroundColor = '#8c9900';
            button.style.color = 'white';
            button.style.marginBottom = '10px';
            button.textContent = item.text;
            button.style.border = '2px solid transparent';
            button.onclick = () => this.handleMenuClick(item.id);

            button.onmouseover = () => {
                button.style.backgroundColor = '#d7eb25'; // Hellere Farbe beim Hover
                button.style.border = '2px solid rgb(234, 255, 41)';
            };
            button.onmouseout = () => {
                button.style.backgroundColor = '#8c9900'; // Zurück zur ursprünglichen Farbe
                button.style.border = '2px solid transparent';
            };

            this.container.querySelector('#menu-options').appendChild(button);
        });

        // Starte das Polling für Online-User
        OnlineUsersHandler.startPolling(this.friendsHandler);

        // Lade die Freundesliste
        this.loadFriendsList();
    }

    async handleAvatarChange(e) {
        const avatarFile = e.target.files[0];
        if (!avatarFile) return;

        const formData = new FormData();
        formData.append('avatar', avatarFile);

        try {
            const updatedData = await updateProfile(formData);
            this.userProfile = updatedData;
            this.updateProfileDisplay(updatedData);
            e.target.value = "";
            console.log('Avatar erfolgreich aktualisiert!');
        } catch (err) {
            console.error('Fehler beim Avatar-Update:', err);
            alert('Avatar-Update fehlgeschlagen: ' + err);
        }
    }

    async logout() {
        try {
            // Erst den User aus der Online-Liste entfernen
            await OnlineUsersHandler.removeUserFromOnline();

            // Dann die Token entfernen
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');

            console.log('Logout erfolgreich');

            // Statt zu /login weiterzuleiten, zeigen wir das Signup-Template an
            showTemplate('signup');
        } catch (error) {
            console.error('Fehler beim Logout:', error);
            // Trotzdem die Token entfernen und zum Signup-Template weiterleiten
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            showTemplate('signup');
        }
    }

    displaySettings(settings) {
        const currentSettings = this.currentSettings || settings;

        this.container.innerHTML = `
            <div class="container py-4">
                <div class="card">
                    <div class="card-header profile-header">
                        <h2 class="mb-0">Settings</h2>
                    </div>
                    <div class="card-body profile-card">
                        <div class="mb-3">
                            <label for="ball-speed" class="form-label">Ball Speed (1-10):</label>
                            <input type="number" id="ball-speed" class="form-control" min="1" max="10" value="${currentSettings.ball_speed}">
                        </div>
                        <div class="mb-3">
                            <label for="paddle-speed" class="form-label">Paddle Speed (1-10):</label>
                            <input type="number" id="paddle-speed" class="form-control" min="1" max="10" value="${currentSettings.paddle_speed}">
                        </div>
                        <div class="mb-3">
                            <label for="winning-score" class="form-label">Winning Score:</label>
                            <input type="number" id="winning-score" class="form-control" min="1" max="20" value="${currentSettings.winning_score}">
                        </div>
                        <div class="mb-3">
                            <label for="paddle-size" class="form-label">Paddle Size:</label>
                            <select id="paddle-size" class="form-select">
                                <option value="small" ${currentSettings.paddle_size === "small" ? "selected" : ""}>Small</option>
                                <option value="middle" ${currentSettings.paddle_size === "middle" ? "selected" : ""}>Middle</option>
                                <option value="big" ${currentSettings.paddle_size === "big" ? "selected" : ""}>Big</option>
                            </select>
                        </div>
                        <div class="d-grid gap-2">
                            <button class="btn btn-primary-custom" onclick="menuDisplay.saveSettings()">Save</button>
                            <button class="btn btn-secondary" onclick="menuDisplay.handleMenuClick('back')">Back</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async saveSettings() {
        try {
            const settings = {
                ball_speed: parseInt(document.getElementById('ball-speed').value),
                paddle_speed: parseInt(document.getElementById('paddle-speed').value),
                winning_score: parseInt(document.getElementById('winning-score').value),
                paddle_size: document.getElementById('paddle-size').value
            };

            console.log('Sending settings:', settings);

            await this.ws.send(JSON.stringify({
                action: "update_settings",
                settings: settings
            }));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    handleMenuClick(itemId) {
        console.log("Menu click:", itemId);

        // Speichere den aktuellen Zustand in der Historie
        if (this.currentMenuState) {
            this.menuHistory.push(this.currentMenuState);
        }

        // Aktualisiere den aktuellen Zustand
        this.currentMenuState = itemId;

        // Füge den neuen Zustand zur Browser-Historie hinzu
        window.history.pushState({ menuState: itemId }, "", `#${itemId}`);

        // Ursprüngliche Menü-Logik
        if (itemId === "online") {
            this.ws.send(
            JSON.stringify({
                action: "menu_selection",
                selection: "online",
            })
            );
            return;
        }
        if (itemId === "back") {
            // Pop letzten Zustand von der Historie
            const previousState = this.menuHistory.pop();
            if (previousState) {
            this.currentMenuState = previousState;
            }

            if (this.container.querySelector(".searching-container")) {
            this.ws.send(
                JSON.stringify({
                action: "menu_selection",
                selection: "play_game",
                })
            );
            return;
            }
        }
        if (itemId === "play_tournament") {
            this.ws.send(
            JSON.stringify({
                action: "menu_selection",
                selection: "play_tournament",
                userProfile: this.userProfile,
            })
            );
            this.updateSearchStatus("ACHTUNG!!! 2 von 4 Spielern gefunden...");
            console.log("ACHTUNG!!! Tournament started");
            // Log all player details
            console.log("Tournament started with players:", this.userProfile);
            console.log("works! ", this.userProfile.tournament_name);
            return;
        }
        this.ws.send(
            JSON.stringify({
            action: "menu_selection",
            selection: itemId,
            })
        );
    }

    handleHistoryNavigation(menuState) {
        console.log("=== History Navigation Debug ===");
        console.log("Navigating to state:", menuState);
        console.log("Current menu history:", this.menuHistory);
        console.log("Current menu state:", this.currentMenuState);

        // Spezielles Handling für null state
        if (menuState === null) {
            this.requestMenuItems();
            return;
        }

        if (menuState === 'back') {
            // Pop letzten Zustand von der Historie
            const previousState = this.menuHistory.pop();
            console.log("Found previous state:", previousState);
            if (previousState) {
                menuState = previousState;
            }
        }

        // Setze den aktuellen Zustand
        this.currentMenuState = menuState;

        // Sende die entsprechende Menüauswahl an den Server
        this.ws.send(JSON.stringify({
            action: 'menu_selection',
            selection: menuState
        }));

        // Wenn wir in einem Suchbildschirm sind, behandle dies speziell
        if (this.container.querySelector('.searching-container')) {
            this.ws.send(JSON.stringify({
                action: 'menu_selection',
                selection: 'play_game'
            }));
        }
    }

    handleMenuAction(data) {
        console.log("\n=== Menu Action Received ===");
        console.log("Action:", data.action);
        console.log("Full data:", data);

        switch (data.action) {
          case "searching_opponent":
            console.log("Started searching for opponent...");
            // Hier sollte der Suchbildschirm angezeigt werden
            this.displaySearchingScreen(
              data.message || "Searching for opponent..."
            );
            break;

          case "game_found":
            console.log("Match found! Game ID:", data.game_id);
            console.log("Player1:", data.player1);
            console.log("Player2:", data.player2);
            console.log("Your role:", data.playerRole);
            console.log("WE ARE IN HANDLEMENUACTION");

            const gameData = {
              player1: data.player1,
              player2: data.player2,
              playerRole: data.playerRole,
              game_id: data.game_id,
              settings: {
                ...data.settings,
                mode: "online",
              },
              userProfile: this.userProfile,
            };

            console.log("this is all the Game data:", gameData);

            // Wechsel zum GameScreen-Template und übergebe die gameData
            showTemplate("game", gameData);

            // Container ausblenden
            this.container.style.display = "none";
            break;

          case "show_submenu":
            if (data.menu_items === this.online_mode_items) {
              this.displaySearchingScreen();
            } else {
              this.displayMenuItems(data.menu_items);
            }
            break;

          case "show_player_names":
            this.displayPlayerNamesInput(
              data.num_players,
              this.currentSettings?.tournament
            );
            break;

          case "show_main_menu":
            this.displayMenuItems(data.menu_items);
            break;
          case "start_game":
            // Wechsel zum GameScreen-Template
            showTemplate("game", {
              player1: data.player1,
              player2: data.player2,
              playerRole: data.playerRole,
              game_id: data.game_id,
              settings: data.settings,
              userProfile: this.userProfile,
            });
            this.startGame(data);
            break;
          case "show_settings":
            this.currentSettings = data.settings; // Speichere die Einstellungen
            this.displaySettings(data.settings);
            break;
          case "settings_updated":
            this.currentSettings = data.settings; // Update gespeicherte Einstellungen
            alert("Settings saved successfully!");
            this.handleMenuClick("back");
            break;
          case "settings_error":
            alert(data.message);
            break;
          case "show_leaderboard":
            if (this.leaderboardDisplay) {
              this.leaderboardDisplay.cleanup();
            }
            this.leaderboardDisplay = new LeaderboardDisplay(this);
            this.leaderboardDisplay.display();
            break;
          case "exit_game":
            console.log("Exiting game...");
            break;
          case "tournament_ready":
            console.log("YES!!!Tournament is ready to start!");
            showTemplate("tournament", {
              userProfile: this.userProfile,
              players: data.players,
              round: data.round,
              total_rounds: data.total_rounds,
            });
            break;
          case "update_tournament_results":
            // Wenn TournamentView existiert, leite die Daten weiter
            if (window.tournamentView) {
              console.log("Leite Turnierergebnisse an TournamentView weiter");
               // Hole den tournament_winner aus den Daten
                const tournament_winner = data.tournament_winner; // Kann undefined sein, wenn nicht vorhanden
                console.log("Extrahierter tournament_winner zum Weiterleiten:", tournament_winner); // Debug-Log

              window.tournamentView.updateResults(
                data.results,
                data.round,
                data.total_rounds,
                data.matchups,
                data.players,
                tournament_winner
              );
            }
            break;
        }
    }

    displayPlayerNamesInput(numPlayers, isTournament) {
        this.container.innerHTML = `
                <div class="container py-4">
                    <div class="card">
                        <div class="card-header profile-header">
                            <h2 class="mb-0">${
                              isTournament ? "Tournament" : "Game"
                            } Players</h2>
                        </div>
                        <div class="card-body profile-card">
                            <form id="player-names-form">
                                ${Array.from(
                                  { length: numPlayers },
                                  (_, i) => `
                                    <div class="mb-3">
                                        <label for="player-${
                                          i + 1
                                        }" class="form-label">Player ${
                                    i + 1
                                  } Name:</label>
                                        <input type="text" id="player-${
                                          i + 1
                                        }" class="form-control"
                                               value="${
                                                 this.isAIPlayer(i)
                                                   ? `Bot ${i + 1}`
                                                   : `Player ${i + 1}`
                                               }"
                                               ${
                                                 this.isAIPlayer(i)
                                                   ? "readonly"
                                                   : ""
                                               }>
                                    </div>
                                `
                                ).join("")}
                                <div class="d-grid gap-2">
                                    <button type="submit" class="btn btn-primary-custom">${
                                      isTournament
                                        ? "Start Tournament"
                                        : "Start Game"
                                    }</button>
                                    <button type="button" class="btn btn-secondary" onclick="menuDisplay.handleMenuClick('back')">Back</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;

        document.getElementById('player-names-form').onsubmit = (e) => {
            e.preventDefault();
            const playerNames = Array.from({length: numPlayers}, (_, i) =>
                document.getElementById(`player-${i+1}`).value
            );
            this.startGameWithPlayers(playerNames, isTournament);
        };
    }

    isAIPlayer(index) {
        // Prüft ob der aktuelle Spieler ein Bot sein soll
        return this.currentSettings?.mode === 'ai' && index > 0;
    }

    startGameWithPlayers(playerNames, isTournament) {
        const gameSettings = this.currentSettings || {};
        gameSettings.playerNames = playerNames;
        gameSettings.isTournament = isTournament;

        this.ws.send(JSON.stringify({
            action: 'start_game',
            settings: gameSettings
        }));
    }

    startGame(data) {
        console.log("startGame wurde aufgerufen:", data);

        // Verstecke das Menü
        this.container.style.display = 'none';

        const gameContainer = document.getElementById('game-container');
        gameContainer.style.display = 'block';

        const onBackToMenu = () => {
            gameContainer.style.display = 'none';
            this.container.style.display = 'block';
            this.requestMenuItems();
        };

        window.gameScreen = new GameScreen(onBackToMenu);
        window.gameScreen.display();
    }

    displaySearchingScreen(message) {
        console.log("Displaying search screen with message:", message);

        this.container.innerHTML = `
            <div class="container py-5">
                <div class="card text-center">
                    <div class="card-header profile-header">
                        <h3 class="mb-0">Searching for Opponent</h3>
                    </div>
                    <div class="card-body profile-card py-5">
                        <h3 class="mb-4">${message || 'Searching for opponent...'}</h3>
                        <div class="spinner-border mx-auto mb-4" style="width: 3rem; height: 3rem; color: var(--primary-color);" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <div class="d-grid gap-2 col-6 mx-auto">
                            <button class="btn btn-danger cancel-button">Cancel Search</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Event-Listener für den Cancel-Button
        const cancelButton = this.container.querySelector('.cancel-button');
        cancelButton.addEventListener('click', () => {
            console.log("Cancel search clicked");
            this.cancelSearch();
        });
    }

    updateSearchStatus(newMessage) {
        const statusElement = this.container.querySelector(
          "#search-status-message"
        );
        if (statusElement) {
          statusElement.textContent = newMessage;
        }
      }

      cancelSearch() {
        console.log("Canceling search...");
        this.ws.send(JSON.stringify({
            action: "menu_selection",
            selection: "cancel_search"
        }));
    }

    display() {
        this.container.innerHTML = `
            <div class="container text-center py-5">
                <h1 class="display-4 mb-4 menu-title">Pong Game</h1>
                <div class="d-grid gap-3 col-md-6 mx-auto">
                    <button class="btn-primary-custom" onclick="menuDisplay.handleMenuClick('play')">Play</button>
                    <button class="btn-primary-custom" onclick="menuDisplay.handleMenuClick('leaderboard')">Leaderboard</button>
                    <button class="btn-danger" onclick="menuDisplay.handleMenuClick('logout')">Logout</button>
                </div>
            </div>
        `;

        // Starte das Polling für die Freundesliste
        this.startFriendsListPolling();
    }

    async loadFriendsList() {
        try {
            console.log("Lade Freundesliste...");

            // Erstelle eine Instanz des FriendsHandler, falls noch nicht vorhanden
            if (!this.friendsHandler) {
                this.friendsHandler = new FriendsHandler();
            }

            // Hole die Freundesliste
            const friends = await this.friendsHandler.getFriends();
            console.log("Freunde geladen:", friends);

            // Aktualisiere die Anzeige der Freundesliste
            const friendsList = document.getElementById('friends-list');
            if (friendsList) {
                // Wenn die Liste leer ist, zeige eine Nachricht an
                if (!friends || friends.length === 0) {
                    friendsList.innerHTML = '<li class="list-group-item text-center">No friends yet</li>';
                    return;
                }

                // Leere die Liste und füge die Freunde hinzu
                friendsList.innerHTML = '';

                friends.forEach(friend => {
                    const listItem = document.createElement('li');
                    listItem.className = 'list-group-item d-flex flex-column align-items-center text-center';

                    listItem.innerHTML = `
                        <span class="friend-name" data-username="${friend.username}" style="cursor: pointer;">${friend.username}</span>
                        <div class="btn-group mt-2">
                            <button class="btn btn-sm btn-outline-success chat-btn" data-username="${friend.username}">
                                <i class="bi bi-chat"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger remove-friend-btn" data-username="${friend.username}">
                                <i class="bi bi-person-dash"></i>
                            </button>
                        </div>
                    `;

                    friendsList.appendChild(listItem);
                });

                // Event-Listener für die Namen
                if (window.menuDisplay) {
                    friendsList.querySelectorAll('.friend-name').forEach(nameSpan => {
                        nameSpan.addEventListener('click', (e) => {
                            const username = e.currentTarget.dataset.username;
                            window.menuDisplay.viewFriendProfile(username);
                        });
                    });

                    friendsList.querySelectorAll('.chat-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const username = e.currentTarget.dataset.username;
                            window.menuDisplay.openChatWithFriend(username);
                        });
                    });

                    friendsList.querySelectorAll('.remove-friend-btn').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            const username = e.currentTarget.dataset.username;
                            if (confirm(`Are you sure you want to remove ${username} from your friends?`)) {
                                try {
                                    await this.friendsHandler.removeFriend(username);
                                    // Aktualisiere die Freundesliste und die Online-Benutzer-Liste
                                    this.getFriends();
                                    OnlineUsersHandler.fetchOnlineUsers();
                                } catch (error) {
                                    console.error('Error removing friend:', error);
                                    alert('Error removing friend. Please try again later.');
                                }
                            }
                        });
                    });
                }
            }
        } catch (error) {
            console.error('Error loading friends list:', error);
        }
    }

    viewFriendProfile(username) {
        // Wechsle zum Benutzerprofil-Template und übergebe den Benutzernamen und das aktuelle Benutzerprofil
        window.showTemplate('userProfile', {
            username: username,
            currentUserProfile: this.userProfile
        });
    }

    async openChatWithFriend(username) {
        // Prüfe zuerst, ob der Benutzer blockiert ist
        const isBlocked = await this.isUserBlocked(username);

        // Erstelle ein Chat-Modal
        const modalContent = `
            <div class="modal fade" id="chatModal" tabindex="-1" aria-labelledby="chatModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header" style="background-color: #8c9900; color: white;">
                            <h5 class="modal-title" id="chatModalLabel">Chat with ${username}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body" style="background-color: #b9a84cc0; height: 300px;">
                            <div id="chat-messages" class="chat-messages mb-3" style="height: 200px; overflow-y: auto; background-color: #f8f9fa; padding: 10px; border-radius: 5px;"></div>
                            <div class="input-group">
                                <input type="text" id="chat-input" class="form-control" placeholder="Enter message..." style="background-color:rgb(116, 113, 113); color:rgb(0, 218, 171);">
                                <button class="btn btn-primary-custom d-flex align-items-center" id="send-message-btn">Send</button>
                            </div>
                        </div>
                        <div class="modal-footer">
                            ${isBlocked ?
                                `<button type="button" class="btn btn-success" id="unblock-user-btn">Unblock User</button>` :
                                `<button type="button" class="btn btn-danger" id="block-user-btn">Block User</button>`
                            }
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Füge das Modal zum DOM hinzu
        const modalElement = document.createElement('div');
        modalElement.innerHTML = modalContent;
        document.body.appendChild(modalElement);

        // Zeige das Modal an
        const modal = new bootstrap.Modal(document.getElementById('chatModal'));
        modal.show();

        // Verbinde mit dem WebSocket
        this.initChatWebSocket(username);

        // Event-Listener für den Senden-Button
        document.getElementById('send-message-btn').addEventListener('click', () => {
            this.sendChatMessage(username);
        });

        // Event-Listener für die Enter-Taste
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage(username);
            }
        });

        // Event-Listener für den Blockieren-Button (nur wenn nicht blockiert)
        if (!isBlocked) {
            document.getElementById('block-user-btn').addEventListener('click', () => {
                this.blockUser(username);
            });
        } else {
            // Event-Listener für den Entsperren-Button (nur wenn blockiert)
            document.getElementById('unblock-user-btn').addEventListener('click', () => {
                this.unblockUser(username);
            });
        }

        // Entferne das Modal aus dem DOM nach dem Schließen
        document.getElementById('chatModal').addEventListener('hidden.bs.modal', () => {
            if (this.chatWs) {
                this.chatWs.close();
                this.chatWs = null;
            }
            document.body.removeChild(modalElement);
        });
    }

    initChatWebSocket(username) {
        // Hole den Token aus dem localStorage
        const token = localStorage.getItem('accessToken');

        if (!token) {
            this.addChatMessage('System', 'You are not logged in. Please log in.');
            return;
        }

        // Erstelle die WebSocket-URL mit Token
        const wsProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
        const wsHost = window.location.hostname;
        const wsPort = window.location.protocol === "https:" ? "" : ":8000";
        const wsUrl = `${wsProtocol}${wsHost}${wsPort}/ws_django/chat/?token=${token}`;

        console.log("Connecting to chat WebSocket:", wsUrl);

        this.chatWs = new WebSocket(wsUrl);
        this.chatReceiver = username;

        this.chatWs.onopen = () => {
            console.log('Chat WebSocket connected');
            this.addChatMessage('System', 'Connection established. You can now chat.');
        };

        this.chatWs.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Chat message received:', data);

            if (data.message) {
                // Wenn die Nachricht von einem anderen Benutzer kommt
                if (data.from) {
                    // Hole den Benutzernamen des Absenders
                    this.getUsernameById(data.from).then(senderUsername => {
                        this.addChatMessage(senderUsername, data.message);
                    });
                } else {
                    // System-Nachricht
                    this.addChatMessage('System', data.message);
                }
            }
        };

        this.chatWs.onerror = (error) => {
            console.error('Chat WebSocket error:', error);
            this.addChatMessage('System', 'Connection error. Please try again later.');
        };

        this.chatWs.onclose = () => {
            console.log('Chat WebSocket closed');
            this.addChatMessage('System', 'Connection closed.');
        };
    }

    async getUsernameById(userId) {
        try {
            // API-Aufruf, um den Benutzernamen anhand der ID zu erhalten
            const response = await fetch(`/api/users/${userId}/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            if (response.ok) {
                const userData = await response.json();
                return userData.username;
            } else {
                return 'Unbekannter Benutzer';
            }
        } catch (error) {
            console.error('Fehler beim Abrufen des Benutzernamens:', error);
            return 'Unbekannter Benutzer';
        }
    }

    sendChatMessage(receiverUsername) {
        const inputElement = document.getElementById('chat-input');
        const message = inputElement.value.trim();

        if (!message) return;

        if (this.chatWs && this.chatWs.readyState === WebSocket.OPEN) {
            // Finde die Benutzer-ID des Empfängers
            this.getUserIdByUsername(receiverUsername).then(receiverId => {
                if (receiverId) {
                    const messageData = {
                        message: message,
                        receiver_id: receiverId
                    };

                    this.chatWs.send(JSON.stringify(messageData));
                    this.addChatMessage(this.userProfile.username, message, true);
                    inputElement.value = '';
                } else {
                    this.addChatMessage('System', 'Empfänger nicht gefunden.');
                }
            });
        } else {
            this.addChatMessage('System', 'Keine Verbindung zum Server. Bitte versuche es später erneut.');
        }
    }

    async getUserIdByUsername(username) {
        try {
            // API-Aufruf, um die Benutzer-ID anhand des Benutzernamens zu erhalten
            const response = await fetch(`/api/users/by-username/${username}/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            if (response.ok) {
                const userData = await response.json();
                return userData.id;
            } else {
                console.error('Benutzer nicht gefunden');
                return null;
            }
        } catch (error) {
            console.error('Fehler beim Abrufen der Benutzer-ID:', error);
            return null;
        }
    }

    addChatMessage(sender, message, isOwnMessage = false) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${isOwnMessage ? 'own-message' : 'other-message'} mb-2`;

        // Styling basierend auf dem Absender
        if (sender === 'System') {
            messageElement.style.color = '#6c757d';
            messageElement.style.fontStyle = 'italic';
            messageElement.style.textAlign = 'center';
        } else if (isOwnMessage) {
            messageElement.style.textAlign = 'right';
            messageElement.style.backgroundColor = '#d1e7dd';
            messageElement.style.padding = '5px 10px';
            messageElement.style.borderRadius = '10px';
            messageElement.style.maxWidth = '80%';
            messageElement.style.marginLeft = 'auto';
        } else {
            messageElement.style.textAlign = 'left';
            messageElement.style.backgroundColor = '#c3e6cb'; // Hellgrüner Hintergrund für empfangene Nachrichten
            messageElement.style.color = '#155724'; // Dunkelgrüner Text für besseren Kontrast
            messageElement.style.padding = '5px 10px';
            messageElement.style.borderRadius = '10px';
            messageElement.style.maxWidth = '80%';
            messageElement.style.border = '1px solid #b1dfbb'; // Leichter Rahmen für mehr Struktur
        }

        messageElement.innerHTML = `
            ${sender !== 'System' ? `<strong>${sender}:</strong> ` : ''}${message}
        `;

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async blockUser(username) {
        if (confirm(`Are you sure you want to block ${username}? You will no longer be able to exchange messages.`)) {
            try {
                const response = await fetch('/api/users/block/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    },
                    body: JSON.stringify({ username: username })
                });

                if (response.ok) {
                    alert(`${username} has been blocked successfully.`);
                    // Schließe das Chat-Modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('chatModal'));
                    modal.hide();
                } else {
                    const errorData = await response.json();
                    alert(`Error blocking user: ${errorData.detail || 'Unknown error'}`);
                }
            } catch (error) {
                console.error('Error blocking user:', error);
                alert('Error blocking user. Please try again later.');
            }
        }
    }

    // Neue Methode zum Prüfen, ob ein Benutzer blockiert ist
    async isUserBlocked(username) {
        try {
            // Hole die Liste der blockierten Benutzer
            const response = await fetch('/api/users/blocked/', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            if (response.ok) {
                const blockedUsers = await response.json();
                // Prüfe, ob der Benutzer in der Liste der blockierten Benutzer ist
                return blockedUsers.some(user => user.username === username);
            } else {
                console.error('Fehler beim Abrufen der blockierten Benutzer');
                return false;
            }
        } catch (error) {
            console.error('Fehler beim Prüfen, ob der Benutzer blockiert ist:', error);
            return false;
        }
    }

    // Neue Methode zum Entsperren eines Benutzers
    async unblockUser(username) {
        if (confirm(`Are you sure you want to unblock ${username}? You will be able to exchange messages again.`)) {
            try {
                const response = await fetch('/api/users/unblock/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    },
                    body: JSON.stringify({ username: username })
                });

                if (response.ok) {
                    alert(`${username} has been unblocked successfully.`);
                    // Schließe das Chat-Modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('chatModal'));
                    modal.hide();

                    // Öffne den Chat erneut, um die Änderungen zu übernehmen
                    setTimeout(() => this.openChatWithFriend(username), 500);
                } else {
                    const errorData = await response.json();
                    alert(`Error unblocking user: ${errorData.detail || 'Unknown error'}`);
                }
            } catch (error) {
                console.error('Error unblocking user:', error);
                alert('Error unblocking user. Please try again later.');
            }
        }
    }

    startFriendsListPolling() {
        console.log("Starte Polling für Freundesliste...");

        // Erstelle eine Instanz des FriendsHandler, falls noch nicht vorhanden
        if (!this.friendsHandler) {
            this.friendsHandler = new FriendsHandler();
        }

        // Sofort beim Start laden
        this.friendsHandler.getFriends();

        // Dann alle 5 Sekunden aktualisieren
        if (this.friendsListInterval) {
            clearInterval(this.friendsListInterval);
        }

        this.friendsListInterval = setInterval(() => {
            console.log("Polling-Intervall: Aktualisiere Freundesliste...");
            this.friendsHandler.getFriends();
        }, 5000);

        console.log("Polling für Freundesliste gestartet!");
    }

    cleanup() {
        if (this.friendsListInterval) {
            clearInterval(this.friendsListInterval);
            this.friendsListInterval = null;
        }
    }
}

let menuDisplay;
document.addEventListener('DOMContentLoaded', () => {
    const userProfile = {
        username: "Benutzername",
        avatar: "path/to/avatar.jpg",
        email: "benutzer@example.com",
        bio: "Kurze Bio",
    };
    menuDisplay = new MenuDisplay(userProfile);

    // Füge einen Event-Listener für das Beenden der Seite hinzu
    window.addEventListener('beforeunload', () => {
        if (menuDisplay) {
            menuDisplay.cleanup();
        }
    });
});

OnlineUsersHandler.updateOnlineUsersList = function(onlineUsers, friendsHandler) {
    const usersList = document.getElementById('online-users-list');
    if (!usersList) return;

    // Speichere den aktuellen Scroll-Zustand
    const scrollTop = usersList.scrollTop;

    // Wenn die Liste leer ist, zeige eine Nachricht an
    if (onlineUsers.length === 0) {
        if (usersList.children.length === 0 ||
            (usersList.children.length === 1 && !usersList.children[0].classList.contains('no-players'))) {
            usersList.innerHTML = '<li class="list-group-item text-center no-players">No players online</li>';
        }
        return;
    }

    // Hole die aktuelle Freundesliste, um zu prüfen, ob ein Benutzer bereits ein Freund ist
    friendsHandler.getFriends().then(friends => {
        const friendUsernames = friends.map(friend => friend.username);

        // Hole den aktuellen Benutzernamen aus dem menuDisplay-Objekt
        const currentUsername = window.menuDisplay ? window.menuDisplay.userProfile.username : '';

        // Erstelle ein DocumentFragment für bessere Performance
        const fragment = document.createDocumentFragment();
        const existingItems = {};

        // Behalte bestehende Elemente bei, wenn möglich
        Array.from(usersList.children).forEach(item => {
            const username = item.querySelector('span')?.textContent.replace(' (You)', '');
            if (username) {
                existingItems[username] = item;
            }
        });

        // Aktualisiere oder erstelle Elemente für jeden Online-Benutzer
        onlineUsers.forEach(user => {
            // Prüfe, ob der Benutzer der aktuelle Benutzer ist
            const isCurrentUser = user.username === currentUsername;
            // Prüfe, ob der Benutzer bereits ein Freund ist
            const isAlreadyFriend = friendUsernames.includes(user.username);

            let listItem;

            // Verwende das bestehende Element, wenn vorhanden
            if (existingItems[user.username]) {
                listItem = existingItems[user.username];
                delete existingItems[user.username]; // Entferne aus der Liste der bestehenden Elemente
            } else {
                // Erstelle ein neues Element
                listItem = document.createElement('li');
                listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
            }

            // Aktualisiere den Inhalt
            listItem.innerHTML = `
                 <span class="user-name" data-username="${user.username}" style="cursor: pointer; margin-bottom: 5px;">${user.username} ${isCurrentUser ? '(You)' : ''}</span>
                 ${!isCurrentUser && !isAlreadyFriend ? `
                     <button class="btn btn-sm btn-outline-success add-friend-btn"
                             data-username="${user.username}">
                         <i class="bi bi-person-plus"></i> Add Friend
                     </button>
                 ` : isAlreadyFriend && !isCurrentUser ? `
                     <span class="badge bg-success">Friend</span>
                 ` : ''}
            `;

            fragment.appendChild(listItem);
        });

        // Entferne alle bestehenden Elemente
        usersList.innerHTML = '';

        // Füge das Fragment zum DOM hinzu
        usersList.appendChild(fragment);

        // Stelle den Scroll-Zustand wieder her
        usersList.scrollTop = scrollTop;

        // Event-Listener für die Namen
        usersList.querySelectorAll('.user-name').forEach(nameSpan => {
            nameSpan.addEventListener('click', (e) => {
                const username = e.currentTarget.dataset.username;
                // Zeige das Profil nur an, wenn es nicht der aktuelle Benutzer ist
                //if (username !== currentUsername) {
                    if (window.menuDisplay) {
                        window.menuDisplay.viewFriendProfile(username);
                    }
                //}
            });
        });

        // Event-Listener für "Add Friend" Buttons
        usersList.querySelectorAll('.add-friend-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const username = e.currentTarget.dataset.username;
                try {
                    await friendsHandler.addFriend(username);
                    alert(`${username} has been added as a friend!`);

                    // Aktualisiere sowohl die Freundesliste als auch die Online-Benutzer-Liste
                    friendsHandler.getFriends();
                    OnlineUsersHandler.fetchOnlineUsers();
                } catch (error) {
                    console.error('Error adding friend:', error);
                    alert('Error adding friend. You might already be friends.');
                }
            });
        });
    }).catch(error => {
        console.error('Error fetching friends list:', error);
    });
};

// Modifiziere die FriendsHandler.getFriends-Methode, um sicherzustellen, dass sie immer die aktuellen Daten vom Server holt
FriendsHandler.prototype.getFriends = async function() {
    try {
  //      console.log("FriendsHandler: Rufe Freundesliste ab...");
        const accessToken = localStorage.getItem('accessToken');
        const response = await fetch('/api/users/friends/list/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            cache: 'no-store' // Verhindere Caching
        });

        if (!response.ok) {
            throw new Error(`Fehler beim Abrufen der Freundesliste: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
     //   console.log("FriendsHandler: Freundesliste erhalten:", data);

        // Aktualisiere die gespeicherte Freundesliste
        this.friends = data;

        // Aktualisiere die Anzeige der Freundesliste
        this.updateFriendsListDisplay(data);

        return data;
    } catch (error) {
        console.error('FriendsHandler: Fehler beim Abrufen der Freundesliste:', error);
        return [];
    }
};

// Modifiziere die updateFriendsListDisplay-Methode, um den Namen klickbar zu machen
FriendsHandler.prototype.updateFriendsListDisplay = function(friends) {
    const friendsList = document.getElementById('friends-list');
    if (!friendsList) return;

 //   console.log("FriendsHandler: Aktualisiere Freundesliste-Anzeige:", friends);

    // Wenn die Liste leer ist, zeige eine Nachricht an
    if (!friends || friends.length === 0) {
        friendsList.innerHTML = '<li class="list-group-item text-center">No friends yet</li>';
        return;
    }

    // Leere die Liste und füge die Freunde hinzu
    friendsList.innerHTML = '';

    friends.forEach(friend => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item d-flex flex-column align-items-center text-center';

        listItem.innerHTML = `
            <span class="friend-name" data-username="${friend.username}" style="cursor: pointer;">${friend.username}</span>
            <div class="btn-group mt-2">
                <button class="btn btn-sm btn-outline-success chat-btn" data-username="${friend.username}">
                    <i class="bi bi-chat"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger remove-friend-btn" data-username="${friend.username}">
                    <i class="bi bi-person-dash"></i>
                </button>
            </div>
        `;

        friendsList.appendChild(listItem);
    });

    // Event-Listener für die Namen
    if (window.menuDisplay) {
        friendsList.querySelectorAll('.friend-name').forEach(nameSpan => {
            nameSpan.addEventListener('click', (e) => {
                const username = e.currentTarget.dataset.username;
                window.menuDisplay.viewFriendProfile(username);
            });
        });

        friendsList.querySelectorAll('.chat-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const username = e.currentTarget.dataset.username;
                window.menuDisplay.openChatWithFriend(username);
            });
        });

        friendsList.querySelectorAll('.remove-friend-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const username = e.currentTarget.dataset.username;
                if (confirm(`Are you sure you want to remove ${username} from your friends?`)) {
                    try {
                        await this.removeFriend(username);
                        // Aktualisiere die Freundesliste und die Online-Benutzer-Liste
                        this.getFriends();
                        OnlineUsersHandler.fetchOnlineUsers();
                    } catch (error) {
                        console.error('Error removing friend:', error);
                        alert('Error removing friend. Please try again later.');
                    }
                }
            });
        });
    }
};

