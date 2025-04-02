export class TournamentScreen {
    constructor(data, onBackToMenu) {
        this.userProfile = data.userProfile;
        this.numPlayers = data.numPlayers;
        this.onBackToMenu = onBackToMenu;
        this.ws = null;
        this.tournamentId = data.tournament_id;
        
        console.log("Tournament Screen initialized with data:", data); // Debug log
        
        this.setupWebSocket();
        this.setupEventListeners();
    }

    setupWebSocket() {
        const wsProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
        const wsHost = window.location.hostname;
        const wsPort = wsProtocol === "ws://" ? ":8001" : "";
        
        // Füge tournament_id zur WebSocket-URL hinzu
        const wsUrl = `${wsProtocol}${wsHost}${wsPort}/ws/tournament/${this.tournamentId}`;
        console.log("Connecting to WebSocket URL:", wsUrl); // Debug log
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log("Connected to tournament server");
            // Sende Initial-Daten
            this.ws.send(JSON.stringify({
                action: 'join_tournament',
                numPlayers: this.numPlayers,
                userProfile: this.userProfile
            }));
        };

        this.ws.onerror = (error) => {
            console.error("WebSocket error:", error); // Debug log
        };

        this.ws.onclose = (event) => {
            console.log("WebSocket closed:", event.code, event.reason); // Debug log
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("Received tournament data:", data); // Debug log
            this.handleServerMessage(data);
        };
    }

    setupEventListeners() {
        const leaveBtn = document.getElementById('leave-tournament');
        if (leaveBtn) {
            leaveBtn.addEventListener('click', () => {
                if (this.ws) {
                    this.ws.send(JSON.stringify({ action: 'leave_tournament' }));
                }
                this.cleanup();
                this.onBackToMenu();
            });
        }
    }

    handleServerMessage(data) {
        if (data.action === 'tournament_status') {
            this.updateTournamentStatus(data);
        } else if (data.action === 'tournament_start') {
            this.showTournamentBracket(data.matches);
        } else if (data.action === 'start_game') {
            this.startGame(data);
        } else if (data.action === 'match_update') {
            this.updateMatch(data.matchId, data.result);
        } else if (data.action === 'tournament_end') {
            this.handleTournamentEnd(data);
        }
    }

    updateTournamentStatus(data) {
        const statusDiv = document.getElementById('tournament-status');
        const playersJoined = data.players.joined;
        const playersNeeded = data.players.needed;
        
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
                                <div class="player ${match.winner?.id === match.player1?.id ? 'winner' : ''}">${match.player1?.username || 'TBD'}</div>
                                <div class="player ${match.winner?.id === match.player2?.id ? 'winner' : ''}">${match.player2?.username || 'TBD'}</div>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
        `;
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

    cleanup() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}