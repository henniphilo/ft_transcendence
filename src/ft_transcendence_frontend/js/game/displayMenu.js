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
        //this.ws = new WebSocket(`ws://${window.location.hostname}:8001/ws/menu`);


        // const wsProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
        // const wsHost = window.location.hostname; // Nur der Hostname (ohne Port)
        // const wsPort = "8001"; // Falls der Port sich ändern soll, könnte dies auch dynamisch gesetzt werden
        // this.ws = new WebSocket(`${wsProtocol}${wsHost}:${wsPort}/ws/menu`);

        
        const wsProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
        const wsHost = window.location.hostname;
        const wsPort = window.location.protocol === "https:" ? "" : ":8001"; // Port nur für ws:// setzen

        const wsUrl = `${wsProtocol}${wsHost}${wsPort}/ws/menu`;
        console.log("Versuche WebSocket-Verbindung zu:", wsUrl);

        this.ws = new WebSocket(wsUrl);

        this.gameMode = null;
        this.playMode = null;
        this.currentSettings = null;  // Speichere aktuelle Einstellungen
        this.leaderboardDisplay = null;
        this.userProfile = userProfile; // Speichere Benutzerprofil
        this.elements = {};  // Für DOM-Element-Referenzen
        this.friendsHandler = new FriendsHandler();
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
                                    <label for="edit-birth-date" class="form-label">Birthday:</label>
                                    <input type="date" id="edit-birth-date" class="form-control" value="${this.userProfile.birth_date || ''}">
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
            const birthDate = document.getElementById('edit-birth-date').value;
            const tournamentName = document.getElementById('edit-tournament-name').value;

            try {
                const formData = new FormData();
                formData.append('bio', bio);
                formData.append('birth_date', birthDate);
                formData.append('tournament_name', tournamentName);

                const result = await ProfileHandler.updateProfile(formData);
                
                // Aktualisiere die lokalen Daten
                this.userProfile.bio = bio;
                this.userProfile.birth_date = birthDate;
                this.userProfile.tournament_name = tournamentName;
                
                // Aktualisiere die Anzeige
                if (this.elements.bio) this.elements.bio.textContent = bio;
                if (this.elements.birthDate) this.elements.birthDate.textContent = birthDate;
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
        if (this.elements.birthDate) this.elements.birthDate.textContent = profileData.birth_date || '';
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
                                <h2 class="mb-0">Menu</h2>
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
                                    <div class="col-md-4 text-center">
                                        <img class="profile-avatar rounded-circle mb-3" src="${this.userProfile.avatar || '/assets/default-avatar.png'}" 
                                             alt="Avatar" style="width: 100px; height: 100px; object-fit: cover;" />
                                        <div class="mb-3">
                                            <label for="avatar-input" class="form-label">Change Avatar:</label>
                                            <input class="avatar-input form-control form-control-sm" type="file" accept="image/*" />
                                        </div>
                                    </div>
                                    <div class="col-md-8">
                                        <h4 class="profile-username mb-3">Welcome ${this.userProfile.username}!</h4>
                                        <div class="profile-details mb-3">
                                            <p class="mb-2"><strong>Email:</strong> <span class="profile-email">${this.userProfile.email}</span></p>
                                            <p class="mb-2"><strong>Bio:</strong> <span class="profile-bio">${this.userProfile.bio || ''}</span></p>
                                            <p class="mb-2"><strong>Birthday:</strong> <span class="profile-birth-date">${this.userProfile.birth_date || ''}</span></p>
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
                    <div class="col-md-2">
                        <div class="card mb-4">
                            <div class="card-header online-players-header">
                                <h3 class="mb-0">Online Players</h3>
                            </div>
                            <div class="card-body profile-card online-players-list">
                                <ul id="online-users-list" class="list-group"></ul>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-2">
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
            birthDate: this.container.querySelector('.profile-birth-date'),
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
            button.onclick = () => this.handleMenuClick(item.id);
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
        console.log("Menu click:", itemId); // Debug log

        if (itemId === 'online') {
            //this.displaySearchingScreen();
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
                // Hier sollte der Suchbildschirm angezeigt werden
                this.displaySearchingScreen(data.message || "Searching for opponent...");
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

                // Wechsel zum GameScreen-Template und übergebe die gameData
                showTemplate('game', gameData);

                // Container ausblenden
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
            <div class="container py-4">
                <div class="card">
                    <div class="card-header profile-header">
                        <h2 class="mb-0">${isTournament ? 'Tournament' : 'Game'} Players</h2>
                    </div>
                    <div class="card-body profile-card">
                        <form id="player-names-form">
                            ${Array.from({length: numPlayers}, (_, i) => `
                                <div class="mb-3">
                                    <label for="player-${i+1}" class="form-label">Player ${i+1} Name:</label>
                                    <input type="text" id="player-${i+1}" class="form-control"
                                           value="${this.isAIPlayer(i) ? `Bot ${i+1}` : `Player ${i+1}`}"
                                           ${this.isAIPlayer(i) ? 'readonly' : ''}>
                                </div>
                            `).join('')}
                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-primary-custom">${isTournament ? 'Start Tournament' : 'Start Game'}</button>
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
                        <h2 class="mb-0">Searching for Opponent</h2>
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
    }

    async loadFriendsList() {
        try {
            const friendsList = document.getElementById('friends-list');
            if (!friendsList) return;

            // Freunde vom Server abrufen
            const friends = await this.friendsHandler.getFriends();
            
            // Liste leeren
            friendsList.innerHTML = '';
            
            if (friends.length === 0) {
                friendsList.innerHTML = '<li class="list-group-item text-center" id="no-friends-message">No friends found</li>';
                return;
            }
            
            // Freunde anzeigen
            friends.forEach(friend => {
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                
                listItem.innerHTML = `
                    <span class="friend-name" data-username="${friend.username}" style="cursor: pointer;">${friend.username}</span>
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-sm btn-outline-primary chat-with-friend-btn" 
                                data-username="${friend.username}">
                            <i class="bi bi-chat-dots"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger remove-friend-btn" 
                                data-username="${friend.username}">
                            <i class="bi bi-person-dash"></i>
                        </button>
                    </div>
                `;
                
                friendsList.appendChild(listItem);
            });
            
            // Event-Listener für die Namen (zum Profil)
            document.querySelectorAll('.friend-name').forEach(nameSpan => {
                nameSpan.addEventListener('click', (e) => {
                    const username = e.currentTarget.dataset.username;
                    this.viewFriendProfile(username);
                });
            });
            
            // Event-Listener für den Chat-Button
            document.querySelectorAll('.chat-with-friend-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const username = e.currentTarget.dataset.username;
                    this.openChatWithFriend(username);
                });
            });
            
            // Event-Listener für den Remove-Button
            document.querySelectorAll('.remove-friend-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const username = e.currentTarget.dataset.username;
                    if (confirm(`Are you sure you want to remove ${username} from your friends?`)) {
                        try {
                            await this.friendsHandler.removeFriend(username);
                            alert(`${username} has been removed from your friends.`);
                            this.loadFriendsList(); // Liste aktualisieren
                        } catch (error) {
                            console.error('Error removing friend:', error);
                            alert('Error removing friend. Please try again.');
                        }
                    }
                });
            });
            
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

    // Neue Methode zum Öffnen eines Chats mit einem Freund
    openChatWithFriend(username) {
        alert(`Chat with ${username} (not implemented yet)`);
        // Hier später die Implementierung für den Chat
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

OnlineUsersHandler.updateOnlineUsersList = function(onlineUsers, friendsHandler) {
    const usersList = document.getElementById('online-users-list');
    if (!usersList) return;

    usersList.innerHTML = '';

    if (onlineUsers.length === 0) {
        usersList.innerHTML = '<li class="list-group-item text-center">No players online</li>';
        return;
    }

    onlineUsers.forEach(user => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
        
        // Prüfe, ob der Benutzer der aktuelle Benutzer ist
        const isCurrentUser = user.username === menuDisplay.userProfile.username;
        
        listItem.innerHTML = `
            <span>${user.username} ${isCurrentUser ? '(You)' : ''}</span>
            ${!isCurrentUser ? `
                <button class="btn btn-sm btn-outline-success add-friend-btn" 
                        data-username="${user.username}">
                    <i class="bi bi-person-plus"></i> Add Friend
                </button>
            ` : ''}
        `;
        
        usersList.appendChild(listItem);
    });
    
    // Event-Listener für "Add Friend" Buttons
    document.querySelectorAll('.add-friend-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const username = e.currentTarget.dataset.username;
            try {
                await friendsHandler.addFriend(username);
                alert(`${username} wurde als Freund hinzugefügt!`);
                menuDisplay.loadFriendsList(); // Freundesliste aktualisieren
            } catch (error) {
                console.error('Fehler beim Hinzufügen des Freundes:', error);
                alert('Fehler beim Hinzufügen des Freundes. Möglicherweise seid ihr bereits befreundet.');
            }
        });
    });
};
