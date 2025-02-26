import { ThreeJSManager } from "./3dmanager.js";

export class GameScreen {
    constructor(onBackToMenu) {
        console.log("GameScreen loaded!");

        this.gameState = {
            player1: { name: "Player 1", score: 0 },
            player2: { name: "Player 2", score: 0 },
            ball: [0, 0]
        };
        this.onBackToMenu = onBackToMenu;
        this.gameId = crypto.randomUUID();

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
        this.gameId = crypto.randomUUID();
        this.ws = new WebSocket(`ws://${window.location.hostname}:8001/ws/game/${this.gameId}`);

        this.ws.onopen = () => {
            console.log("WebSocket connection established");
        };

        this.ws.onmessage = (event) => {
  //          console.log("Received game state:", event.data); // Debug-Log
            this.gameState = JSON.parse(event.data);
            this.updateScoreBoard();
            this.threeJSManager.updatePositions(this.gameState);

            if (this.gameState.winner) {
                this.displayWinnerScreen();
            }
        };

        this.ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        };
    }

    setupControls() {
        // Definiere die erlaubten Tasten für beide Spieler
        this.keyState = {
            'a': false,
            'd': false,
            'ArrowRight': false,
            'ArrowLeft': false
        };

        // Kontinuierliches Senden, wenn Tasten gedrückt sind
        this.controlInterval = setInterval(() => {
            if (Object.values(this.keyState).some(key => key)) {
                console.log("Sending key state:", this.keyState); // Debug-Log
                this.ws.send(JSON.stringify({
                    action: 'key_update',
                    keys: this.keyState
                }));
            }
        }, 16);

        document.addEventListener('keydown', (e) => {
            // Nur WASD-Steuerung erlauben wenn gegen AI
            if (this.gameMode === 'ai' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
                return; // Ignoriere Pfeiltasten im AI-Modus
            }

            if (this.keyState.hasOwnProperty(e.key)) {
                e.preventDefault();
                this.keyState[e.key] = true;
                console.log("Key down:", e.key, this.keyState); // Debug-Log
            }
        });

        document.addEventListener('keyup', (e) => {
            if (this.keyState.hasOwnProperty(e.key)) {
                e.preventDefault();
                this.keyState[e.key] = false;
                console.log("Key up:", e.key, this.keyState); // Debug-Log
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
