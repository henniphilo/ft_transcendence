export class TournamentScreen {
    constructor(data, onBackToMenu) {
        this.userProfile = data.userProfile;
        this.numPlayers = data.numPlayers; // 4 oder 8
        this.onBackToMenu = onBackToMenu;
        this.ws = null;
        
        this.tournamentId = data.tournament_id;
        
        this.setupWebSocket();
        this.setupEventListeners();
        this.updateDisplay();
    }

    setupWebSocket() {
        const wsProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
        const wsHost = window.location.hostname;
        const wsPort = wsProtocol === "ws://" ? ":8001" : "";
        
        this.ws = new WebSocket(`${wsProtocol}${wsHost}${wsPort}/ws/tournament`);
        
        this.ws.onopen = () => {
            console.log("Connected to tournament server");
            // Sende Initial-Daten
            this.ws.send(JSON.stringify({
                action: 'join_tournament',
                numPlayers: this.numPlayers,
                userProfile: this.userProfile
            }));
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
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
        switch(data.action) {
            case 'players_update':
                this.updatePlayersCount(data.joined, data.needed);
                break;
            case 'tournament_start':
                this.renderBracket(data.matches);
                break;
            case 'start_game':
                this.startGame(data);
                break;
            case 'match_update':
                this.updateMatch(data.matchId, data.result);
                break;
            case 'tournament_end':
                this.handleTournamentEnd(data);
                break;
        }
    }

    updatePlayersCount(joined, needed) {
        const joinedSpan = document.getElementById('players-joined');
        const neededSpan = document.getElementById('players-needed');
        if (joinedSpan && neededSpan) {
            joinedSpan.textContent = joined;
            neededSpan.textContent = needed;
        }
    }

    renderBracket(matches) {
        const bracketElement = document.getElementById('tournament-bracket');
        if (!bracketElement) return;

        // Hier implementieren wir die visuelle Darstellung des Turnierbaums
        // Dies ist ein einfaches Beispiel - Sie können es nach Ihren Bedürfnissen anpassen
        bracketElement.innerHTML = this.generateBracketHTML(matches);
    }

    generateBracketHTML(matches) {
        // Gruppiere Matches nach Runden
        const roundMatches = {};
        matches.forEach(match => {
            if (!roundMatches[match.round]) {
                roundMatches[match.round] = [];
            }
            roundMatches[match.round].push(match);
        });

        // Generiere HTML für jede Runde
        return Object.entries(roundMatches)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([round, matches]) => `
                <div class="tournament-round">
                    <div class="round-title">Round ${round}</div>
                    ${matches.map(match => `
                        <div class="tournament-match" data-match-id="${match.id}">
                            <div class="player ${this.getPlayerClasses(match, match.player1, match.winner)}">
                                ${match.player1?.username || 'TBD'}
                            </div>
                            <div class="player ${this.getPlayerClasses(match, match.player2, match.winner)}">
                                ${match.player2?.username || 'TBD'}
                            </div>
                            ${match.status === 'in_progress' ? `
                                <div class="match-status">In Progress</div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `).join('');
    }

    getPlayerClasses(match, player, winner) {
        if (!player) return '';
        
        const classes = ['active'];
        
        if (match.status === 'completed') {
            if (winner && winner.id === player.id) {
                classes.push('winner');
            } else {
                classes.push('loser');
            }
        }
        
        return classes.join(' ');
    }

    updateMatch(matchId, result) {
        const matchElement = document.querySelector(`[data-match-id="${matchId}"]`);
        if (matchElement) {
            // Update match display with results
            // Implementierung nach Ihren Anforderungen
        }
    }

    cleanup() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
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

    returnFromGame() {
        showTemplate('tournament', {
            tournament_id: this.tournamentId,
            userProfile: this.userProfile,
            numPlayers: this.numPlayers
        });
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
}