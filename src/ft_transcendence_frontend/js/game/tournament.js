export class TournamentScreen {
    constructor(data, onBackToMenu) {
        this.userProfile = data.userProfile;
        this.numPlayers = data.numPlayers;
        this.onBackToMenu = onBackToMenu;
        this.tournamentId = data.tournament_id;
        this.ws = null;
        
        console.log("Tournament Screen initialized with data:", {
            tournamentId: this.tournamentId,
            numPlayers: this.numPlayers,
            userProfile: this.userProfile
        });
        
        this.setupWebSocket();
        this.setupEventListeners();
    }

    setupWebSocket() {
        const wsProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
        const wsHost = window.location.hostname;
        const wsPort = wsProtocol === "ws://" ? ":8001" : "";
        
        const wsUrl = `${wsProtocol}${wsHost}${wsPort}/ws/tournament/${this.tournamentId}`;
        console.log("Tournament: Connecting to WebSocket URL:", wsUrl); // Debug log
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log("Tournament: WebSocket connected successfully"); // Debug log
            // Sende initial join message
            this.ws.send(JSON.stringify({
                action: 'join_tournament',
                numPlayers: this.numPlayers,
                userProfile: this.userProfile
            }));
        };

        this.ws.onerror = (error) => {
            console.error("Tournament: WebSocket error:", error); // Debug log
        };

        this.ws.onclose = (event) => {
            console.log("Tournament: WebSocket closed:", event.code, event.reason); // Debug log
        };

        this.ws.onmessage = (event) => {
            console.log("Tournament: Received message:", event.data); // Debug log
            const data = JSON.parse(event.data);
            this.handleServerMessage(data);
        };
    }

    setupEventListeners() {
        const leaveBtn = document.getElementById('leave-tournament');
        if (leaveBtn) {
            leaveBtn.addEventListener('click', () => {
                this.leaveTournament();
            });
        }
    }

    handleServerMessage(data) {
        console.log("Received tournament data:", data);
        if (data.action === 'tournament_status') {
            this.updateTournamentStatus(data);
            if (data.matches) {
                this.showTournamentBracket(data.matches);
            }
        } else if (data.action === 'tournament_cancelled') {
            alert(data.message);
            window.showTemplate('menu', { userProfile: this.userProfile });
        } else if (data.action === 'match_ready') {
            console.log("Match ready received:", data);
            
            // Erstelle ein gameData-Objekt im gleichen Format wie bei normalen Spielen
            const gameData = {
                game_id: data.game_id,
                player1: data.player1,
                player2: data.player2,
                playerRole: data.playerRole,
                userProfile: this.userProfile, // Verwende das vorhandene Benutzerprofil
                settings: data.settings,
                tournament: {
                    isActive: true,
                    tournamentId: this.tournamentId,
                    matchId: data.match_id
                }
            };
            
            console.log("Switching to game with data:", gameData);
            window.showTemplate('game', gameData);  // Verwende window.showTemplate direkt
        } else if (data.action === 'tournament_end') {
            this.handleTournamentEnd(data);
        }
    }

    updateTournamentStatus(data) {
        const statusDiv = document.getElementById('tournament-status');
        const leaveBtn = document.getElementById('leave-tournament');
        const playersJoined = data.players.joined;
        const playersNeeded = data.players.needed;
        
        // Verstecke Leave-Button wenn Turnier gestartet ist
        if (leaveBtn) {
            leaveBtn.style.display = data.status === "waiting" ? "block" : "none";
        }
        
        statusDiv.innerHTML = `
            <h2>Tournament</h2>
            <p>Waiting for players... (${playersJoined}/${playersNeeded})</p>
            <div class="player-list">
                ${data.players.list.map(player => 
                    `<div class="player-item">${player.username}</div>`
                ).join('')}
            </div>
        `;
    }

    showTournamentBracket(matches) {
        const bracketDiv = document.getElementById('tournament-bracket');
        bracketDiv.style.display = 'block';
        
        // Organisiere Matches nach Runden
        const matchesByRound = {};
        matches.forEach(match => {
            if (!matchesByRound[match.round]) {
                matchesByRound[match.round] = [];
            }
            matchesByRound[match.round].push(match);
        });

        // Erstelle HTML für den Turnierbaum
        bracketDiv.innerHTML = `
            <div class="tournament-rounds">
                ${Object.entries(matchesByRound).map(([round, roundMatches]) => `
                    <div class="round">
                        <h3>Round ${round}</h3>
                        ${roundMatches.map(match => `
                            <div class="match ${match.status}">
                                <div class="player-row">
                                    <div class="player ${match.winner?.id === match.player1?.id ? 'winner' : ''}">
                                        ${match.player1?.username || 'TBD'}
                                        ${match.status === 'pending' && match.player1?.id === this.userProfile.id && 
                                          !match.ready_players?.includes(this.userProfile.id) ? `
                                            <button class="start-match-btn" onclick="window.tournamentScreen.startMatch('${match.id}')">
                                                Ready
                                            </button>
                                        ` : match.ready_players?.includes(match.player1?.id) ? ' (Ready)' : ''}
                                    </div>
                                </div>
                                <div class="player-row">
                                    <div class="player ${match.winner?.id === match.player2?.id ? 'winner' : ''}">
                                        ${match.player2?.username || 'TBD'}
                                        ${match.status === 'pending' && match.player2?.id === this.userProfile.id && 
                                          !match.ready_players?.includes(this.userProfile.id) ? `
                                            <button class="start-match-btn" onclick="window.tournamentScreen.startMatch('${match.id}')">
                                                Ready
                                            </button>
                                        ` : match.ready_players?.includes(match.player2?.id) ? ' (Ready)' : ''}
                                    </div>
                                </div>
                                <div class="match-status">
                                    Players Ready: ${match.ready_players?.length || 0}/2
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
        `;
    }

    getMatchReadyStatus(match) {
        const readyCount = match.ready_players?.length || 0;
        return `Players Ready: ${readyCount}/2`;
    }

    startMatch(matchId) {
        console.log(`Tournament: Attempting to start match ${matchId}`); // Zusätzliches Log
        console.log("Tournament: Current WebSocket state:", this.ws?.readyState); // Bestehendes Debug log

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message = {
                action: 'start_match',
                tournament_id: this.tournamentId,
                match_id: matchId,
                player_id: this.userProfile.id // Stelle sicher, dass userProfile hier verfügbar und korrekt ist
            };
            console.log("Tournament: Sending ready message:", message); // Bestehendes Debug log

            // NEUES LOG: Gib das WebSocket-Objekt aus, das zum Senden verwendet wird
            console.log("Tournament: Sending message via WebSocket object:", this.ws);

            this.ws.send(JSON.stringify(message));
            console.log("Tournament: Ready message sent."); // Zusätzliches Log zur Bestätigung
        } else {
            console.error("Tournament: WebSocket not connected or not open! Cannot send ready message."); // Angepasste Fehlermeldung
            console.log("Tournament: Current WebSocket state:", this.ws?.readyState); // Logge den Status auch im Fehlerfall
        }
    }

    updateMatch(matchId, result) {
        const matchElement = document.querySelector(`[data-match-id="${matchId}"]`);
        if (matchElement) {
            // Update match display with results
            this.showTournamentBracket(result.matches);
        }
    }

    startGame(gameData) {
        const fullGameData = {
            ...gameData,
            tournament: {
                isActive: true,
                tournamentId: this.tournamentId,
                matchId: gameData.match_id
            },
            userProfile: this.userProfile
        };

        showTemplate('game', fullGameData);
    }

    handleTournamentEnd(data) {
        const container = document.getElementById('tournament-container');
        container.innerHTML = `
            <div class="tournament-end">
                <h2>Tournament Completed!</h2>
                <p>Winner: ${data.winner.username}</p>
                <button class="btn btn-primary" onclick="window.showTemplate('menu', { userProfile: ${JSON.stringify(this.userProfile)} })">
                    Back to Menu
                </button>
            </div>
        `;
    }

    leaveTournament() {
        if (this.ws) {
            this.ws.send(JSON.stringify({
                action: 'leave_tournament',
                userProfile: this.userProfile
            }));
            this.ws.close();
        }
        window.showTemplate('menu', { userProfile: this.userProfile });
    }
}