// class GameScreen {
//     constructor(gameState, onBackToMenu) {
//         this.gameState = gameState;
//         this.onBackToMenu = onBackToMenu;
//         this.canvas = null;
//         this.ctx = null;
//         this.gameId = null;
//         this.ws = null;
//         this.keyState = {};
//         this.scoreBoard = null;

//         this.setupWebSocket();
//         this.setupControls();
//     }

//     setupWebSocket() {
//         this.gameId = crypto.randomUUID();
//         this.ws = new WebSocket(`ws://${window.location.hostname}:8000/ws/game/${this.gameId}`);

//         this.ws.onmessage = (event) => {
//             this.gameState = JSON.parse(event.data);
//             this.updateScoreBoard();  // Update Score bei jedem neuen Spielzustand
//             this.draw();

//             if (this.gameState.winner) {
//                 this.displayWinnerScreen();
//             }
//         };
//     }

//     setupControls() {
//         // Neues Update-Intervall für kontinuierliche Tastenabfrage
//         this.controlInterval = setInterval(() => {
//             if (Object.values(this.keyState).some(key => key)) {
//                 this.sendKeyState();
//             }
//         }, 16); // Ca. 60 mal pro Sekunde

//         document.addEventListener('keydown', (e) => {
//             this.keyState[e.key] = true;
//         });

//         document.addEventListener('keyup', (e) => {
//             this.keyState[e.key] = false;
//         });
//     }

//     sendKeyState() {
//         if (this.ws && this.ws.readyState === WebSocket.OPEN) {
//             this.ws.send(JSON.stringify({
//                 action: 'key_update',
//                 keys: this.keyState
//             }));
//         }
//     }

//     display() {
//         const container = document.getElementById('game-container');

//         if (this.gameState.winner) {
//             this.displayWinnerScreen();
//         } else {
//             container.innerHTML = `
//                 <div class="game-screen">
//                     <div id="score-board" class="score-board">
//                         <div id="player1-score" class="player-score">
//                             ${this.gameState.player1.name}: ${this.gameState.player1.score}
//                         </div>
//                         <div id="player2-score" class="player-score">
//                             ${this.gameState.player2.name}: ${this.gameState.player2.score}
//                         </div>
//                     </div>
//                     <canvas id="game-canvas"></canvas>
//                 </div>
//             `;
//             this.initCanvas();
//             this.scoreBoard = document.getElementById('score-board');
//             this.draw();
//         }
//     }

//     updateScoreBoard() {
//         if (!this.scoreBoard) return;

//         const player1Score = this.scoreBoard.querySelector('#player1-score');
//         const player2Score = this.scoreBoard.querySelector('#player2-score');

//         if (player1Score && player2Score) {
//             player1Score.textContent = `${this.gameState.player1.name}: ${this.gameState.player1.score}`;
//             player2Score.textContent = `${this.gameState.player2.name}: ${this.gameState.player2.score}`;
//         }
//     }

//     draw() {
//         if (!this.ctx) return;

//         // Hintergrund
//         this.ctx.fillStyle = '#000';
//         this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

//         // Mittellinie
//         this.ctx.strokeStyle = '#fff';
//         this.ctx.setLineDash([5, 15]);
//         this.ctx.beginPath();
//         this.ctx.moveTo(this.canvas.width / 2, 0);
//         this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
//         this.ctx.stroke();
//         this.ctx.setLineDash([]);

//         // Ball
//         const ballX = (this.gameState.ball[0] + 1) * this.canvas.width / 2;
//         const ballY = (this.gameState.ball[1] + 1) * this.canvas.height / 2;
//         this.ctx.fillStyle = '#fff';
//         this.ctx.beginPath();
//         this.ctx.arc(ballX, ballY, 10, 0, Math.PI * 2);
//         this.ctx.fill();

//         // Paddle Dimensionen
//         const paddleWidth = 10;

//         // Player 1 Paddle - Verwende die exakten Koordinaten vom Backend
//         const p1Top = (this.gameState.player1.paddle.top + 1) * this.canvas.height / 2;
//         const p1Bottom = (this.gameState.player1.paddle.bottom + 1) * this.canvas.height / 2;
//         const p1Height = p1Bottom - p1Top;
//         this.ctx.fillRect(0, p1Top, paddleWidth, p1Height);

//         // Player 2 Paddle - Verwende die exakten Koordinaten vom Backend
//         const p2Top = (this.gameState.player2.paddle.top + 1) * this.canvas.height / 2;
//         const p2Bottom = (this.gameState.player2.paddle.bottom + 1) * this.canvas.height / 2;
//         const p2Height = p2Bottom - p2Top;
//         this.ctx.fillRect(this.canvas.width - paddleWidth, p2Top, paddleWidth, p2Height);
//     }

//     displayWinnerScreen() {
//         const container = document.getElementById('game-container');
//         container.innerHTML = `
//             <div class="winner-screen">
//                 <h1>Game Over!</h1>
//                 <h2>${this.gameState.winner.name} wins!</h2>
//                 <p>Final Score: ${this.gameState.winner.score}</p>
//                 <button class="menu-item" onclick="gameScreen.backToMenu()">Back to Menu</button>
//             </div>
//         `;
//     }

//     backToMenu() {
//         if (this.ws) {
//             this.ws.close();
//         }
//         this.onBackToMenu();
//     }

//     initCanvas() {
//         this.canvas = document.getElementById('game-canvas');
//         this.ctx = this.canvas.getContext('2d');

//         // Setze eine feste Größe für das Spielfeld
//         this.canvas.width = 800;
//         this.canvas.height = 600;  // Höher für bessere Proportionen
//     }

//     cleanup() {
//         if (this.ws) {
//             this.ws.close();
//         }
//         // Wichtig: Interval stoppen wenn das Spiel beendet wird
//         if (this.controlInterval) {
//             clearInterval(this.controlInterval);
//         }
//         document.removeEventListener('keydown', this.handleInput);
//         document.removeEventListener('keyup', this.handleInput);
//     }
// }


import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.172.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.172.0/examples/jsm/loaders/GLTFLoader.js';


class GameScreen {
    constructor(gameState, onBackToMenu) {
        this.gameState = gameState;
        this.onBackToMenu = onBackToMenu;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.paddles = {};
        this.ball = null;
        this.models = {};
        this.ws = null;
        this.keyState = {};

        this.setupWebSocket();
        this.setupControls();
        this.initThree();
    }

    setupWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        this.ws = new WebSocket(`${protocol}//${window.location.hostname}:8000/ws/game/${crypto.randomUUID()}`);

        this.ws.onmessage = (event) => {
            this.gameState = JSON.parse(event.data);
            this.updateScene();

            if (this.gameState.winner) {
                this.displayWinnerScreen();
            }
        };

        this.ws.onclose = () => console.log('WebSocket closed');
        this.ws.onerror = (error) => console.error('WebSocket error:', error);
    }

    setupControls() {
        const keyDownHandler = (e) => {
            this.keyState[e.key] = true;
            this.sendKeyState();
        };

        const keyUpHandler = (e) => {
            this.keyState[e.key] = false;
            this.sendKeyState();
        };

        document.addEventListener('keydown', keyDownHandler);
        document.addEventListener('keyup', keyUpHandler);

        this.cleanupHandlers = () => {
            document.removeEventListener('keydown', keyDownHandler);
            document.removeEventListener('keyup', keyUpHandler);
        };
    }

    sendKeyState() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ action: 'key_update', keys: this.keyState }));
        }
    }

    initThree() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        const container = document.getElementById('game-container');
        if (container) {
            container.appendChild(this.renderer.domElement);
        } else {
            console.error("Element with id 'game-container' not found");
        }

        this.camera.position.set(0, 0, 5);

        // Lighting
        const light = new THREE.PointLight(0xffffff, 1, 100);
        light.position.set(0, 5, 5);
        this.scene.add(light);

        // Ball
        const ballGeometry = new THREE.SphereGeometry(0.1, 32, 32);
        const ballMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.ball = new THREE.Mesh(ballGeometry, ballMaterial);
        this.scene.add(this.ball);

        // Load Paddle Models
        this.loadModel('u-bahn/lowpoly_berlin_u-bahn.glb', (model) => {
            this.models.uBahn = model;
            this.addPaddles();  // Now call addPaddles() after model is loaded
        });

        this.animate();
    }

    loadModel(path, callback) {
        const loader = new GLTFLoader();
        loader.load(
            path,
            (gltf) => {
                console.log('Model loaded:', gltf);
                const model = gltf.scene;

                // Scale the model (optional)
                model.scale.set(0.5, 0.5, 0.5);
                callback(model); // Call callback with the loaded model
            },
            (xhr) => {
                console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`);
            },
            (error) => {
                console.error('An error occurred while loading the model:', error);
            }
        );
    }

    addPaddles() {
        if (!this.models.uBahn) return;

        this.paddles.player1 = this.models.uBahn.clone();
        this.paddles.player1.position.set(-4.5, 0, 0);
        this.scene.add(this.paddles.player1);

        this.paddles.player2 = this.models.uBahn.clone();
        this.paddles.player2.position.set(4.5, 0, 0);
        this.scene.add(this.paddles.player2);
    }

    updateScene() {
        if (!this.paddles.player1 || !this.paddles.player2 || !this.ball) return;

        const scaleX = 4.5;
        const scaleY = 2;

        this.paddles.player1.position.y = this.gameState.player1.paddle.center * scaleY;
        this.paddles.player2.position.y = this.gameState.player2.paddle.center * scaleY;

        this.ball.position.set(
            this.gameState.ball[0] * scaleX,
            this.gameState.ball[1] * scaleY,
            0
        );
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }

    display() {
        const container = document.getElementById('game-container');
        if (this.gameState.winner) {
            this.displayWinnerScreen();
        } else {
            container.innerHTML = `
                <div class="game-screen">
                    <div id="score-board" class="score-board">
                        <div id="player1-score">${this.gameState.player1.name}: ${this.gameState.player1.score}</div>
                        <div id="player2-score">${this.gameState.player2.name}: ${this.gameState.player2.score}</div>
                    </div>
                </div>`;
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
            </div>`;
    }

    backToMenu() {
        if (this.ws) this.ws.close();
        this.onBackToMenu();
    }

    cleanup() {
        if (this.ws) this.ws.close();
        if (this.cleanupHandlers) this.cleanupHandlers();
    }
}

export default GameScreen;
