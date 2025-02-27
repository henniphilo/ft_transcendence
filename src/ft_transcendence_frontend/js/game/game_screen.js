import { ThreeJSManager } from "./3dmanager.js";

export class GameScreen {
    constructor(gameData, onBackToMenu) {
        console.log("GameScreen loaded!");

        // Nur initiale Werte, werden vom Server überschrieben
        this.gameState = {
            player1: { name: gameData.player1, score: 0 },
            player2: { name: gameData.player2, score: 0 },
            ball: [0, 0]
        };
        this.playerRole = gameData.playerRole;  // "player1" oder "player2"
        this.onBackToMenu = onBackToMenu;
        this.gameId = gameData.game_id;
        
        this.ws = null;
        this.keyState = {};
        this.scoreBoard = null;
        this.gameMode = 'online';  // Änderung hier: immer auf 'online' setzen

        this.threeJSManager = new ThreeJSManager();

        // Sende Inputs zum Server (60 mal pro Sekunde)
        this.setupControls();
        
        // Empfange Game State vom Server
        this.setupWebSocket();
        
        // Rendere nur was wir vom Server bekommen
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
            // Nur Rendering, keine Position-Updates!
            this.threeJSManager.render();
            requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }

    setupWebSocket() {
        console.log("Connecting to game with ID:", this.gameId);
        this.ws = new WebSocket(`ws://${window.location.hostname}:8001/ws/game/${this.gameId}`);

        this.ws.onopen = () => {
            console.log("WebSocket connection established for game:", this.gameId);
        };

        this.ws.onmessage = (event) => {
  //          console.log("Received game state:", event.data); // Debug-Log
            this.gameState = JSON.parse(event.data);
            this.updateScoreBoard();
            this.threeJSManager.updatePositions(this.gameState);
            this.threeJSManager.render();

            if (this.gameState.winner) {
                this.displayWinnerScreen();
            }
        };

        this.ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        };
    }

    setupControls() {
        this.keyState = {
            'a': false,
            'd': false,
            'ArrowLeft': false,
            'ArrowRight': false
        };

        // Sende Inputs zum Server (60 mal pro Sekunde)
        this.controlInterval = setInterval(() => {
            if (Object.values(this.keyState).some(key => key)) {
                this.ws.send(JSON.stringify({
                    action: 'key_update',
                    keys: this.keyState
                }));
            }
        }, 16);  // ~60 FPS

        document.addEventListener('keydown', (e) => {
            if (this.playerRole === 'both') {
                // Lokaler Modus: Erlaube alle Tasten
                if (this.keyState.hasOwnProperty(e.key)) {
                    e.preventDefault();
                    this.keyState[e.key] = true;
                }
            } else if (this.playerRole === 'player1') {
                // Spieler 1: Nur A und D
                if (e.key === 'a' || e.key === 'd') {
                    e.preventDefault();
                    this.keyState[e.key] = true;
                }
            } else if (this.playerRole === 'player2') {
                // Spieler 2: Nur Pfeiltasten
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    this.keyState[e.key] = true;
                }
            }
            // Keine spezielle Behandlung für AI nötig, da die Steuerung vom Server kommt
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
