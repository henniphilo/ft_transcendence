import { GameScreen } from "./game_screen.js";
import { ProfileHandler } from '../profileHandler.js';
import { OnlineUsersHandler } from '../onlineUsers.js';
import { LeaderboardDisplay } from './displayLeaderboard.js';
import { updateProfile, logoutUser, getProfile } from '../authLib.js';
import { fillProfileFields } from '../profileHandler.js';

export class MenuDisplay {
    constructor(userProfile) {
        console.log("MenuDisplay loaded!");

        this.container = document.getElementById('menu-container');
        this.ws = new WebSocket(`ws://${window.location.hostname}:8001/ws/menu`);
        this.gameMode = null;
        this.playMode = null;
        this.currentSettings = null;  // Speichere aktuelle Einstellungen
        this.leaderboardDisplay = null;
        this.userProfile = userProfile; // Speichere Benutzerprofil
        this.elements = {};  // Für DOM-Element-Referenzen
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

    async editProfile() {
        const newBio = prompt('Neue Bio eingeben:', this.userProfile.bio);
        const avatarFile = this.elements.avatarInput?.files[0];

        if (!newBio && !avatarFile) {
            alert('Es wurden keine Änderungen vorgenommen.');
            return;
        }

        const formData = new FormData();
        if (newBio) formData.append('bio', newBio);
        if (avatarFile) formData.append('avatar', avatarFile);

        try {
            const updatedData = await updateProfile(formData);
            this.userProfile = updatedData;
            this.updateProfileDisplay(updatedData);
            if (this.elements.avatarInput) {
                this.elements.avatarInput.value = "";
            }
            console.log('Profil erfolgreich aktualisiert!');
        } catch (error) {
            console.error('Fehler beim Aktualisieren:', error);
            alert('Profil-Update fehlgeschlagen: ' + error);
        }
    }

    updateProfileDisplay(profileData) {
        if (this.elements.bio) this.elements.bio.textContent = profileData.bio || '';
        if (this.elements.email) this.elements.email.textContent = profileData.email || '';
        if (this.elements.birthDate) this.elements.birthDate.textContent = profileData.birth_date || '';
        if (this.elements.avatar) {
            this.elements.avatar.src = profileData.avatar
                ? profileData.avatar + '?t=' + new Date().getTime()
                : '/assets/default-avatar.png';
        }
    }

    displayMenuItems(menuItems) {
        this.container.innerHTML = `
            <div class="menu-profile-container">
                <div class="menu-section">
                    <div id="menu-options"></div>
                </div>
                <div class="profile-section">
                    <h2 class="profile-username">Willkommen ${this.userProfile.username}!</h2>
                    <div class="profile-info">
                        <img class="profile-avatar" src="${this.userProfile.avatar || '/assets/default-avatar.png'}" alt="Avatar" />
                        <div class="profile-details">
                            <p><strong>Email:</strong> <span class="profile-email">${this.userProfile.email}</span></p>
                            <p><strong>Bio:</strong> <span class="profile-bio">${this.userProfile.bio || ''}</span></p>
                            <p><strong>Geburtstag:</strong> <span class="profile-birth-date">${this.userProfile.birth_date || ''}</span></p>
                        </div>
                    </div>
                    <form class="profile-form">
                        <label for="avatar-input">Avatar ändern:</label>
                        <input class="avatar-input" type="file" accept="image/*" />
                    </form>
                    <button class="edit-profile-button">Profil bearbeiten</button>
                    <button class="logout-button">Logout</button>
                </div>
                <div class="online-users-section">
                    <h3>Online Spieler</h3>
                    <ul id="online-users-list"></ul>
                </div>
            </div>
        `;

        // DOM-Elemente nach dem Rendern speichern
        this.elements = {
            bio: this.container.querySelector('.profile-bio'),
            email: this.container.querySelector('.profile-email'),
            birthDate: this.container.querySelector('.profile-birth-date'),
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
            button.className = 'menu-item';
            button.textContent = item.text;
            button.onclick = () => this.handleMenuClick(item.id);
            this.container.querySelector('#menu-options').appendChild(button);
        });

        // Starte das Polling für Online-User
        OnlineUsersHandler.startPolling();
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
            window.location.href = '/login';
        } catch (error) {
            console.error('Fehler beim Logout:', error);
            // Trotzdem die Token entfernen und zur Login-Seite weiterleiten
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
        }
    }

    displaySettings(settings) {
        const currentSettings = this.currentSettings || settings;

        this.container.innerHTML = `
            <div class="settings-container">
                <h2>Settings</h2>
                <div class="setting-item">
                    <label for="ball-speed">Ball Speed (1-10):</label>
                    <input type="number" id="ball-speed" min="1" max="10" value="${currentSettings.ball_speed}">
                </div>
                <div class="setting-item">
                    <label for="paddle-speed">Paddle Speed (1-10):</label>
                    <input type="number" id="paddle-speed" min="1" max="10" value="${currentSettings.paddle_speed}">
                </div>
                <div class="setting-item">
                    <label for="winning-score">Winning Score:</label>
                    <input type="number" id="winning-score" min="1" max="20" value="${currentSettings.winning_score}">
                </div>
                <div class="setting-item">
                    <label for="paddle-size">Paddle Size:</label>
                    <select id="paddle-size">
                        <option value="small" ${currentSettings.paddle_size === "small" ? "selected" : ""}>Small</option>
                        <option value="middle" ${currentSettings.paddle_size === "middle" ? "selected" : ""}>Middle</option>
                        <option value="big" ${currentSettings.paddle_size === "big" ? "selected" : ""}>Big</option>
                    </select>
                </div>
                <button class="menu-item" onclick="menuDisplay.saveSettings()">Save</button>
                <button class="menu-item" onclick="menuDisplay.handleMenuClick('back')">Back</button>
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
        console.log("Menu click:", itemId); // Debug log

        if (itemId === 'online') {
            this.displaySearchingScreen();
            // Wichtig: Sende dem Server die Information, dass wir suchen
            this.ws.send(JSON.stringify({
                action: 'menu_selection',
                selection: 'online'
            }));
            return;
        }
        if (itemId === 'back' && this.container.querySelector('.searching-container')) {
            this.ws.send(JSON.stringify({
                action: 'menu_selection',
                selection: 'play_game'
            }));
            return;
        }
        this.ws.send(JSON.stringify({
            action: 'menu_selection',
            selection: itemId
        }));
    }

    handleMenuAction(data) {
        console.log("\n=== Menu Action Received ===");
        console.log("Action:", data.action);
        console.log("Full data:", data);

        switch (data.action) {
            case 'searching_opponent':
                console.log("Started searching for opponent...");
                // Zeige Wartebild an
                this.container.innerHTML = `
                    <div class="searching-screen">
                        <h2>Searching for opponent...</h2>
                        <button class="cancel-button">Cancel</button>
                    </div>
                `;

                // Event-Listener hinzufügen
                this.container.querySelector('.cancel-button').addEventListener('click', () => this.cancelSearch());
                break;

            case 'game_found':
                console.log("Match found! Game ID:", data.game_id);
                console.log("Player1:", data.player1);
                console.log("Player2:", data.player2);
                console.log("Your role:", data.playerRole);
                const gameData = {
                    player1: data.player1,
                    player2: data.player2,
                    playerRole: data.playerRole,
                    game_id: data.game_id,
                    settings: {
                        ...data.settings,
                        mode: "online"
                    },
                    userProfile: this.userProfile
                };

                // Erst Template wechseln über den globalen showTemplate
                window.showTemplate('game');

                    this.container.style.display = 'none';

                break;

            case 'show_submenu':
                if (data.menu_items === this.online_mode_items) {
                    this.displaySearchingScreen();
                } else {
                    this.displayMenuItems(data.menu_items);
                }
                break;

            case 'show_player_names':
                this.displayPlayerNamesInput(data.num_players, this.currentSettings?.tournament);
                break;

            case 'show_main_menu':
                this.displayMenuItems(data.menu_items);
                break;
            case 'start_game':
                // Wechsel zum GameScreen-Template
                showTemplate('game', {
                    player1: data.player1,
                    player2: data.player2,
                    playerRole: data.playerRole,
                    game_id: data.game_id,
                    settings: data.settings,
                    userProfile: this.userProfile
                });
                this.startGame(data);
                break;
            case 'show_settings':
                this.currentSettings = data.settings;  // Speichere die Einstellungen
                this.displaySettings(data.settings);
                break;
            case 'settings_updated':
                this.currentSettings = data.settings;  // Update gespeicherte Einstellungen
                alert('Settings saved successfully!');
                this.handleMenuClick('back');
                break;
            case 'settings_error':
                alert(data.message);
                break;
            case 'show_leaderboard':
                if (this.leaderboardDisplay) {
                    this.leaderboardDisplay.cleanup();
                }
                this.leaderboardDisplay = new LeaderboardDisplay(this);
                this.leaderboardDisplay.display();
                break;
            case 'exit_game':
                console.log('Exiting game...');
                break;
        }
    }

    displayPlayerNamesInput(numPlayers, isTournament) {
        this.container.innerHTML = `
            <div class="settings-container">
                <h2>${isTournament ? 'Tournament' : 'Game'} Players</h2>
                <form id="player-names-form">
                    ${Array.from({length: numPlayers}, (_, i) => `
                        <div class="setting-item">
                            <label for="player-${i+1}">Player ${i+1} Name:</label>
                            <input type="text" id="player-${i+1}"
                                   value="${this.isAIPlayer(i) ? `Bot ${i+1}` : `Player ${i+1}`}"
                                   ${this.isAIPlayer(i) ? 'readonly' : ''}>
                        </div>
                    `).join('')}
                    <button type="submit" class="menu-item">Start ${isTournament ? 'Tournament' : 'Game'}</button>
                    <button type="button" class="menu-item" onclick="menuDisplay.handleMenuClick('back')">Back</button>
                </form>
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
        this.container.innerHTML = `
            <div class="searching-box">
                <div class="searching-container">
                    <h2>${message || 'Searching for opponent...'}</h2>
                    <div class="loading-spinner"></div>
                    <button class="menu-item cancel-search">
                        Cancel Search
                    </button>
                </div>
            </div>
        `;

        // Event Listener direkt hinzufügen statt onclick im HTML
        const cancelButton = this.container.querySelector('.cancel-search');
        cancelButton.addEventListener('click', () => {
            this.cancelSearch();
        });
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
            <div class="menu">
                <h1>Pong Game</h1>
                <button class="menu-item" onclick="menuDisplay.handleMenuClick('play')">Spielen</button>
                <button class="menu-item" onclick="menuDisplay.handleMenuClick('leaderboard')">Leaderboard</button>
                <button class="menu-item" onclick="menuDisplay.handleMenuClick('logout')">Logout</button>
            </div>
        `;
    }
}

let menuDisplay;
document.addEventListener('DOMContentLoaded', () => {
    const userProfile = {
        username: "Benutzername",
        avatar: "path/to/avatar.jpg",
        email: "benutzer@example.com",
        bio: "Kurze Bio",
        birth_date: "01.01.1990"
    };
    menuDisplay = new MenuDisplay(userProfile);
});
