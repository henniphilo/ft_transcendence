import { ThreeJSManager } from "./3dmanager.js";
import { backgroundAudioManager } from "./background3d.js";

export class GameScreen {
  constructor(gameData, onBackToMenu) {
    console.log("GameScreen loaded!");
    console.log("Game Data:", gameData); // Debug-Ausgabe der gesamten gameData

    this.settings = gameData.settings || {}; // 👈 HINZUGEFÜGT!

    // Speichere das Benutzerprofil
    this.userProfile = gameData.userProfile;

    // Nur initiale Werte, werden vom Server überschrieben
    this.gameState = {
      player1: { name: gameData.player1, score: 0 },
      player2: { name: gameData.player2, score: 0 },
      ball: [0, 0],
    };
    this.playerRole = gameData.playerRole;
    this.onBackToMenu = onBackToMenu;
    this.gameId = gameData.game_id;

    this.ws = null;
    this.keyState = {};
    this.scoreBoard = null;

    // Setze den Spielmodus basierend auf der Spielerrolle und den Spielernamen
    if (this.playerRole === "both") {
      this.gameMode = "local";
    } else if (gameData.player2 === "AI Player") {
      this.gameMode = "ai";
    } else {
      this.gameMode = "online";
    }

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
      this.display(); // Anzeige des Spiels inkl. Ready-Button
      this.startGameLoop();
    } catch (error) {
      console.error("Failed to load 3D models:", error);
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
    const wsProtocol =
      window.location.protocol === "https:" ? "wss://" : "ws://";
    const wsHost = window.location.hostname;
    const wsPort = wsProtocol === "ws://" ? ":8001" : ""; // Port nur für ws:// setzen

    const wsUrl = `${wsProtocol}${wsHost}${wsPort}/ws/game/${this.gameId}`;
    console.log("Versuche WebSocket-Verbindung zu:", wsUrl);

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log("🎯 Settings werden mitgeschickt:", this.settings);
      console.log("WebSocket connection established for game:", this.gameId);

      // Sende Benutzerprofilinformationen nach der Verbindung
      if (this.userProfile) {
        this.ws.send(
          JSON.stringify({
            action: "player_info",
            player_role: this.playerRole,
            user_profile: this.userProfile,
            settings: this.settings,
          })
        );
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

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  setupControls() {
    this.keyState = {
      a: false,
      d: false,
      ArrowLeft: false,
      ArrowRight: false,
    };

    // Sende Inputs zum Server (60 mal pro Sekunde)
    this.controlInterval = setInterval(() => {
      if (Object.values(this.keyState).some((key) => key)) {
        this.ws.send(
          JSON.stringify({
            action: "key_update",
            keys: this.keyState,
          })
        );
      }
    }, 16); // ~60 FPS

    document.addEventListener("keydown", (e) => {
      if (this.playerRole === "both") {
        // Lokaler Modus: Erlaube alle Tasten
        if (this.keyState.hasOwnProperty(e.key)) {
          e.preventDefault();
          this.keyState[e.key] = true;
        }
      } else if (this.playerRole === "player1") {
        // Spieler 1: Nur A und D
        if (e.key === "a" || e.key === "d") {
          e.preventDefault();
          this.keyState[e.key] = true;
        }
      } else if (this.playerRole === "player2") {
        // Spieler 2: Nur Pfeiltasten
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          this.keyState[e.key] = true;
        }
      }
    });

    document.addEventListener("keyup", (e) => {
      if (this.keyState.hasOwnProperty(e.key)) {
        e.preventDefault();
        this.keyState[e.key] = false;
      }
    });
  }

  // Hier fügen wir den Ready-Button in die Anzeige ein
  display() {
    console.log("Game wird angezeigt...");
    const container = document.getElementById("game-container");

    // Background Musik stoppen, wenn Spiel angezeigt wird
    if (backgroundAudioManager?.isPlaying("background")) {
      backgroundAudioManager.stopSound("background");
    }

    // Bestimme die Spielernamen basierend auf dem Spielmodus
    let player1Name = this.gameState.player1.name;
    let player2Name = this.gameState.player2.name;

    if (this.userProfile) {
      if (this.gameMode === "ai") {
        if (this.playerRole === "player1") {
          player1Name = this.userProfile.username;
          player2Name = "AI Player";
        }
      } else if (this.gameMode === "local") {
        if (this.playerRole === "player1") {
          player1Name = this.userProfile.username;
          player2Name = "Local Player";
        } else {
          player1Name = "Local Player";
          player2Name = this.userProfile.username;
        }
      }
    }

    // Hier wird zusätzlich ein Ready-Button eingebaut
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
    this.scoreBoard = document.getElementById("score-board");
    this.threeJSManager.setupRenderer(
      document.getElementById("three-js-container")
    );

    // Richte den Ready-Button ein, um den Ready-State zu senden
    this.setupReadyButton();
  }

  setupReadyButton() {
    const readyButton = document.getElementById("ready-button");
    if (readyButton) {
      readyButton.addEventListener("click", () => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(
            JSON.stringify({
              action: "player_ready",
              player_role: this.playerRole,
            })
          );
          console.log("Ready state sent for role:", this.playerRole);

          // Deaktiviere den Button und ändere den Text
          readyButton.disabled = true;
          readyButton.innerText = "Waiting for opponent...";

          // Lasse den Button nach kurzer Verzögerung verschwinden
          setTimeout(() => {
            document.getElementById("ready-container").classList.add("hidden");
            setTimeout(() => {
              document.getElementById("ready-container").style.display = "none";
            }, 500); // Nach der Animation entfernen
          }, 1000);
        } else {
          console.error("WebSocket is not open. Cannot send ready state.");
        }
      });
    }
  }

  updateScoreBoard() {
    if (!this.scoreBoard) {
      console.log("Scoreboard nicht gefunden!");
      return;
    }

    const player1Score = this.scoreBoard.querySelector("#player1-score");
    const player2Score = this.scoreBoard.querySelector("#player2-score");

    let player1Name = this.gameState.player1.name;
    let player2Name = this.gameState.player2.name;

    if (this.userProfile) {
      if (this.gameMode === "ai") {
        if (this.playerRole === "player1") {
          player1Name = this.userProfile.username;
          player2Name = "AI Player";
        }
      } else if (this.gameMode === "local") {
        if (this.playerRole === "player1") {
          player1Name = this.userProfile.username;
          player2Name = "Local Player";
        } else {
          player1Name = "Local Player";
          player2Name = this.userProfile.username;
        }
      }
    }

    if (player1Score && player2Score) {
      player1Score.innerHTML = `<strong>${player1Name}:</strong> ${this.gameState.player1.score}`;
      player2Score.innerHTML = `<strong>${player2Name}:</strong> ${this.gameState.player2.score}`;
    } else {
      console.log("Scoreboard-Elemente nicht gefunden!");
    }
  }

  displayWinnerScreen() {
    if (this.threeJSManager?.audioManager?.isPlaying("game")) {
      this.threeJSManager.audioManager.stopSound("game");
      backgroundAudioManager.playSound("background");
    }

    const container = document.getElementById("game-container");

    if (this.settings?.is_tournament) {
      container.innerHTML = `
                <div class="winner-screen">
                    <h1>Game Over!</h1>
                    <h2>${this.gameState.winner.name} wins!</h2>
                    <p>Final Score: ${this.gameState.winner.score}</p>
                    <button class="menu-item" onclick="gameScreen.backToTournament()">Back to Tournament</button>
                </div>
            `;
    } else {
      container.innerHTML = `
                <div class="winner-screen">
                    <h1>Game Over!</h1>
                    <h2>${this.gameState.winner.name} wins!</h2>
                    <p>Final Score: ${this.gameState.winner.score}</p>
                    <button class="menu-item" onclick="gameScreen.backToMenu()">Back to Menu</button>
                </div>
            `;
    }
  }

  backToTournament() {
    console.log("🏁 Zurück zum Tournament Grid");
    console.log("Tournament Data:", this.settings);
    console.log("GameState:", this.gameState);

    // WebSocket schließen
    if (this.ws) {
      console.log("Closing WebSocket connection...");
      this.ws.close();
      this.ws = null;
    }

    // Alles im Spiel aufräumen
    this.cleanup();

    // Game-Container verstecken
    const gameContainer = document.getElementById("game-container");
    if (gameContainer) {
      console.log("Hiding game container...");
      gameContainer.style.display = "none";
    }

    // Stelle sicher, dass die Tournament-Daten korrekt übergeben werden
    const tournamentData = {
      userProfile: this.userProfile,
      round: this.settings?.tournament_round || 1,
      total_rounds: this.settings?.tournament_totalRounds || 1,
      players: this.settings?.tournament_players || [],
      winner: this.gameState?.winner?.user_profile.tournament_name,
    };

    // Wechsle zum Tournament-Template
    showTemplate("tournament", {
      userProfile: this.userProfile,
      tournamentData: this.settings,
    });

    // Turnier-Ergebnis an den Server melden
    if (this.settings?.is_tournament && this.gameState?.winner?.name) {
      // Send the username (not tournament name) to the backend
      // The backend will handle the mapping
      const message = {
        action: "tournament_result",
        winner: this.gameState.winner.user_profile.tournament_name,
      };

      const tournamentSocket = new WebSocket(
        "ws://" + window.location.host + "/ws/menu"
      );

      tournamentSocket.addEventListener("open", () => {
        console.log("📡 Sending tournament result:", message);
        tournamentSocket.send(JSON.stringify(message));
      });

      tournamentSocket.addEventListener("error", (err) => {
        console.error("❌ Tournament WebSocket error:", err);
      });

      tournamentSocket.addEventListener("close", () => {
        console.log("🔌 Tournament WebSocket closed");
      });
    }
  }

  backToMenu() {
    console.log("Cleaning up game...");

    // WebSocket schließen
    if (this.ws) {
      console.log("Closing WebSocket connection...");
      this.ws.close();
      this.ws = null;
    }

    // Game aufräumen
    this.cleanup();

    // Game Container verstecken
    const gameContainer = document.getElementById("game-container");
    if (gameContainer) {
      console.log("Hiding game container...");
      gameContainer.style.display = "none";
    }

    // Template mit userProfile wechseln
    showTemplate("menu", { userProfile: this.userProfile });

    if (this.onBackToMenu) {
      this.onBackToMenu();
    }
  }

  cleanup() {
    if (this.ws) {
      this.ws.close();
    }
    if (this.controlInterval) {
      clearInterval(this.controlInterval);
    }
    this.threeJSManager.cleanup();
  }
}
