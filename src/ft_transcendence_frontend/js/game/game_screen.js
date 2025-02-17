import { ThreeJSManager } from "./3dmanager.js";

export class GameScreen {
    constructor(gameState, onBackToMenu) {
        console.log("GameScreen loaded!");
        this.gameId = gameState.game_id;  // Verwende die game_id vom Matchmaking!

        // Initialisiere mit vollständiger Struktur
        this.gameState = {
            player1: {
                name: gameState.player1.name,
                score: gameState.player1.score,
                paddle: {
                    top: 0,
                    bottom: 0,
                    center: 0
                }
            },
            player2: {
                name: gameState.player2.name,
                score: gameState.player2.score,
                paddle: {
                    top: 0,
                    bottom: 0,
                    center: 0
                }
            },
            ball: [0, 0],
            playerRole: gameState.playerRole
        };

        this.onBackToMenu = onBackToMenu;
        this.playerRole = gameState.playerRole;
        //this.canvas = null;
        //this.ctx = null;
        this.ws = null;
        this.keyState = {};
        this.scoreBoard = null;
        this.gameMode = new URLSearchParams(window.location.search).get('mode') || 'pvp';

        this.threeJSManager = new ThreeJSManager();

        this.setupWebSocket();
        this.setupControls();
        this.setupThreeJS();
    }

    async setupThreeJS() {
        try {
            await this.threeJSManager.loadModels();
            this.display(); // Add this line
            this.startGameLoop();
        } catch (error) {
            console.error('Failed to load 3D models:', error);
        }
    }


    startGameLoop() {
        const gameLoop = () => {
            this.threeJSManager.updatePositions(this.gameState);
            this.threeJSManager.render();
            requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }

    setupWebSocket() {
        // Verwende die game_id vom Matchmaking
        this.ws = new WebSocket(`ws://${window.location.hostname}:8001/ws/game/${this.gameId}`);

        this.ws.onmessage = (event) => {
            const newState = JSON.parse(event.data);
            this.gameState = {
                ...this.gameState,
                ...newState
            };
            this.updateScoreBoard();
        };

        this.ws.onopen = () => {
            console.log("WebSocket connection established");
            // Sende initiale Spieldaten
            this.ws.send(JSON.stringify({
                action: 'init_game',
                settings: this.gameState
            }));
        };

        this.ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        };
    }

    setupControls() {
        if (this.playerRole === 'player1') {
            this.keyState = {
                'w': false,
                's': false
            };
        } else if (this.playerRole === 'player2') {
            this.keyState = {
                'ArrowRight': false,
                'ArrowLeft': false
            };
        }

        this.controlInterval = setInterval(() => {
            if (Object.values(this.keyState).some(key => key)) {
                this.ws.send(JSON.stringify({
                    action: 'key_update',
                    keys: this.keyState,
                    playerRole: this.playerRole
                }));
            }
        }, 16);

        document.addEventListener('keydown', (e) => {
            if (this.keyState.hasOwnProperty(e.key)) {
                e.preventDefault();
                this.keyState[e.key] = true;
            }
        });

        document.addEventListener('keyup', (e) => {
            if (this.keyState.hasOwnProperty(e.key)) {
                e.preventDefault();
                this.keyState[e.key] = false;
            }
        });
    }

    display() {
        console.log("Game wird angezeigt...");

        const container = document.getElementById('game-container');

        if (this.gameState.winner) {
            this.displayWinnerScreen();
        } else {
            container.innerHTML = `
                <div class="game-screen">
                    <div id="score-board" class="score-board">
                        <div id="player1-score" class="player-score">
                            ${this.gameState.player1.name}: ${this.gameState.player1.score}
                        </div>
                        <div id="player2-score" class="player-score">
                            ${this.gameState.player2.name}: ${this.gameState.player2.score}
                        </div>
                    </div>
                    <div id="three-js-container"></div>
                </div>
            `;
            this.scoreBoard = document.getElementById('score-board');
            this.threeJSManager.setupRenderer(document.getElementById('three-js-container'));
        }
    }


    updateScoreBoard() {
        if (!this.scoreBoard) return;

        const player1Score = this.scoreBoard.querySelector('#player1-score');
        const player2Score = this.scoreBoard.querySelector('#player2-score');

        if (player1Score && player2Score) {
            player1Score.textContent = `${this.gameState.player1.name}: ${this.gameState.player1.score}`;
            player2Score.textContent = `${this.gameState.player2.name}: ${this.gameState.player2.score}`;
        }
    }

    displayWinnerScreen() {
        const container = document.getElementById('game-container');
        container.innerHTML = `
            <div class="winner-screen">
                <h1>Game Over!</h1>
                <h2>${this.gameState.winner.name} wins!</h2>
                <p>Final Score: ${this.gameState.winner.score}</p>
                <button class="menu-item" onclick="gameScreen.backToMenu()">Back to Menu</button>
            </div>
        `;
    }

    backToMenu() {
        if (this.ws) {
            this.ws.close();
        }
        this.onBackToMenu();
    }

    cleanup() {
        if (this.ws) {
            this.ws.close();
        }
        // Wichtig: Interval stoppen wenn das Spiel beendet wird
        if (this.controlInterval) {
            clearInterval(this.controlInterval);
        }
        this.threeJSManager.cleanup();
    }
}
