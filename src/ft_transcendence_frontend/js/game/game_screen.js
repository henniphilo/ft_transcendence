import { ThreeJSManager } from "./3dmanager.js";
import { getGlobalAudioManager } from './audioManger.js';

export class GameScreen {
    constructor(gameData, onBackToMenu) {
        console.log("GameScreen loaded!", { gameData });

        this.userProfile = gameData.userProfile;
        this.gameState = {
            player1: { name: gameData.player1, score: 0 },
            player2: { name: gameData.player2, score: 0 },
            ball: [0, 0]
        };
        this.playerRole = gameData.playerRole;
        this.onBackToMenu = onBackToMenu;
        this.gameId = gameData.game_id;

        this.ws = null;
        this.scoreBoard = null;
        this.gameMode = this.playerRole === 'both' ? 'local' :
                        gameData.player2 === 'AI Player' ? 'ai' : 'online';

        // Use a flat keyState for all modes, server maps keys to players
        this.keyState = {
            'a': false,
            'd': false,
            'ArrowLeft': false,
            'ArrowRight': false
        };

        this.threeJSManager = new ThreeJSManager();

        this.setupControls();
        this.setupWebSocket();
        this.setupThreeJS();
    }

    async setupThreeJS() {
        try {
            await this.threeJSManager.loadModels();
            this.display();
            this.startGameLoop();
        } catch (error) {
            console.error('Failed to load 3D models:', error);
        }
    }

    startGameLoop() {
        const gameLoop = () => {
            this.threeJSManager.render();
            requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }

    setupWebSocket() {
        console.log("Connecting to game with ID:", this.gameId);
        const wsProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
        const wsHost = window.location.hostname;
        const wsPort = wsProtocol === "ws://" ? ":8001" : "";
        const wsUrl = `${wsProtocol}${wsHost}${wsPort}/ws/game/${this.gameId}`;
        console.log("WebSocket URL:", wsUrl);

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log("WebSocket connected for game:", this.gameId);
            if (this.userProfile) {
                this.ws.send(JSON.stringify({
                    action: 'player_info',
                    player_role: this.playerRole,
                    user_profile: this.userProfile
                }));
            }
        };

        this.ws.onmessage = (event) => {
            this.gameState = JSON.parse(event.data);
            this.updateScoreBoard();
            this.threeJSManager.updatePositions(this.gameState);
            this.threeJSManager.render();
            if (this.gameState.winner) {
                this.displayWinnerScreen();
            }
        };

        this.ws.onerror = (error) => console.error("WebSocket error:", error);
    }

    setupControls() {
        this.controlInterval = setInterval(() => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

            if (Object.values(this.keyState).some(key => key)) {
                console.log(`Sending key update (${this.gameMode}):`, this.keyState);
                this.ws.send(JSON.stringify({
                    action: 'key_update',
                    keys: this.keyState
                }));
            }
        }, 16);  // ~60 FPS

        this.keydownHandler = (e) => {
            const key = e.key;
            console.log(`Key down: ${key}`);
            if (this.keyState.hasOwnProperty(key)) {
                e.preventDefault();
                this.keyState[key] = true;
                console.log(`${this.gameMode} key state:`, this.keyState);
            }
        };

        this.keyupHandler = (e) => {
            const key = e.key;
            console.log(`Key up: ${key}`);
            if (this.keyState.hasOwnProperty(key)) {
                e.preventDefault();
                this.keyState[key] = false;
                console.log(`${this.gameMode} key state:`, this.keyState);
            }
        };

        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('keyup', this.keyupHandler);
        console.log("Controls set up for game mode:", this.gameMode);
    }

    display() {
        console.log("Displaying game...");
        const container = document.getElementById('game-container');



        // Hintergrundmusik stoppen, wenn das Spiel startet
        const globalAudioManager = getGlobalAudioManager();
        if (globalAudioManager?.isPlaying && globalAudioManager.isPlaying('background')) {
            globalAudioManager.stopSound('background');
        }


        // Bestimme die Spielernamen basierend auf dem Spielmodus
        let player1Name = this.gameState.player1.name;
        let player2Name = this.gameState.player2.name;

        if (this.userProfile) {
            if (this.gameMode === 'ai') {
                if (this.playerRole === 'player1') {
                    player1Name = this.userProfile.username;
                    player2Name = "AI Player";
                }
            } else if (this.gameMode === 'local') {
                if (this.playerRole === 'player1') {
                    player1Name = this.userProfile.username;
                    player2Name = "Local Player";
                } else {
                    player1Name = "Local Player";
                    player2Name = this.userProfile.username;
                }
            }
        }


        container.innerHTML = `
            <div class="game-screen">
                <div class="game-header">
                    <div id="score-board" class="score-board">
                        <div id="player1-score" class="player-score">
                            <strong>${player1Name}:</strong> ${this.gameState.player1.score}
                        </div>
                        <div id="player2-score" class="player-score">
                            <strong>${player2Name}:</strong> ${this.gameState.player2.score}
                        </div>
                    </div>
                    <div id="controls-info" class="controls-info">
                        <h2>Controls</h2>
                        <div class="control-section">
                            <strong>Player 1:</strong>
                            <span class="key">A</span> Left | <span class="key">D</span> Right
                        </div>
                        <div class="control-section">
                            <strong>Player 2:</strong>
                            <span class="key">←</span> Left | <span class="key">→</span> Right
                        </div>
                        <h3>Change Perspective</h3>
                        <div class="control-section">
                            <span class="key">1</span> Player 1 View |
                            <span class="key">2</span> Player 2 View |
                            <span class="key">3</span> Top View
                        </div>
                    </div>
                </div>
                <div id="three-js-container"></div>
                <div id="ready-container">
                    <button id="ready-button">Ready!</button>
                </div>
            </div>
        `;
        this.scoreBoard = document.getElementById('score-board');
        this.threeJSManager.setupRenderer(document.getElementById('three-js-container'));
        this.setupReadyButton();
    }

    setupReadyButton() {
        const readyButton = document.getElementById("ready-button");
        if (readyButton) {
            readyButton.addEventListener("click", () => {
                if (this.ws?.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        action: "player_ready",
                        player_role: this.playerRole
                    }));
                    console.log("Ready state sent for role:", this.playerRole);
                    readyButton.disabled = true;
                    readyButton.innerText = "Waiting for opponent...";
                    setTimeout(() => {
                        const readyContainer = document.getElementById("ready-container");
                        readyContainer.classList.add("hidden");
                        setTimeout(() => readyContainer.style.display = "none", 500);
                    }, 1000);
                } else {
                    console.error("WebSocket not open. Cannot send ready state.");
                }
            });
        }
    }

    getPlayerNames() {
        let player1Name = this.gameState.player1.name;
        let player2Name = this.gameState.player2.name;
        if (this.userProfile) {
            if (this.gameMode === 'ai' && this.playerRole === 'player1') {
                player1Name = this.userProfile.username;
                player2Name = "AI Player";
            } else if (this.gameMode === 'local') {
                player1Name = this.userProfile ? this.userProfile.username : "Local Player 1";
                player2Name = "Local Player 2";
            }
        }
        return { player1Name, player2Name };
    }

    updateScoreBoard() {
        if (!this.scoreBoard) return console.log("Scoreboard nicht gefunden!");
        const { player1Name, player2Name } = this.getPlayerNames();
        const player1Score = this.scoreBoard.querySelector('#player1-score');
        const player2Score = this.scoreBoard.querySelector('#player2-score');
        if (player1Score && player2Score) {
            player1Score.innerHTML = `<strong>${player1Name}:</strong> ${this.gameState.player1.score}`;
            player2Score.innerHTML = `<strong>${player2Name}:</strong> ${this.gameState.player2.score}`;
        } else {
            console.log("Scoreboard-Elemente nicht gefunden!");
        }
    }

    displayWinnerScreen() {

        const globalAudioManager = getGlobalAudioManager();

        // Musik stoppen, wenn Spiel vorbei ist
        if (globalAudioManager?.isPlaying('game')) {
            globalAudioManager.stopSound('game');
            globalAudioManager.playSound('background');
        }

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
        console.log("Cleaning up game...");
        this.cleanup();
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            console.log("Hiding game container...");
            gameContainer.style.display = 'none';
        }
        showTemplate('menu', { userProfile: this.userProfile });
        if (this.onBackToMenu) this.onBackToMenu();
    }

    cleanupControls() {
        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
            console.log("Removed keydown listener");
            this.keydownHandler = null;
        }
        if (this.keyupHandler) {
            document.removeEventListener('keyup', this.keyupHandler);
            console.log("Removed keyup listener");
            this.keyupHandler = null;
        }

        if (this.controlInterval) {
            clearInterval(this.controlInterval);
            console.log("Cleared control interval");
            this.controlInterval = null;
        }
    }

    cleanup() {
        console.log("Starting game cleanup...");
        this.cleanupControls();
        if (this.ws) {
            console.log("Closing WebSocket...");
            this.ws.close();
            this.ws = null;
        }
        if (this.threeJSManager) {
            this.threeJSManager.cleanup();
            console.log("Cleaned up ThreeJS");
        }
        console.log("Game cleanup complete");
    }
}