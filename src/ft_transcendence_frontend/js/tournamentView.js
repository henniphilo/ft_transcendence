export class TournamentView {
  constructor(data) {
    if (window.__activeTournamentView) {
      console.warn("⚠️ TournamentView already exists – cleaning up...");
      window.__activeTournamentView.cleanup();
    }

    window.__activeTournamentView = this;

    this.userProfile = data.userProfile || {};
    this.data = data.tournamentData || data || {}; // <-- wichtig für Rückkehr nach Spiel
    this.socket = null;

    console.log("✅ TournamentView constructor called!", data);

    this.initializeView();
    this.setupWebSocket(); // muss hier bleiben!
  }

  setupWebSocket() {

    const wsProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
    const wsHost = window.location.hostname;
    const wsPort = window.location.protocol === "https:" ? "" : ":8001";
    const wsUrl = `${wsProtocol}${wsHost}${wsPort}/ws/menu`;
    const socket = new WebSocket(wsUrl);
    this.socket = socket;

    this.socket.addEventListener("open", () => {
      console.log("🎯 TournamentSocket connected (setupWebSocket)");
      this.socket.send(JSON.stringify({ action: "request_tournament_results" }));
    });

    this.socket.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);

      if (msg.action === "update_tournament_results") {
        console.log("📋 New tournament results received:", msg);

        this.data.results = msg.results;
        this.data.round = msg.round;
        this.data.total_rounds = msg.total_rounds;
        this.data.matchups = msg.matchups;

        if (msg.players) {
          this.data.players = msg.players; // ⬅️ Wichtig!
        }

        this.renderTournamentGrid(); // alles neu zeichnen
      }

      if (msg.action === "tournament_finished") {
        console.log("🏆 Tournament ended! Winner:", msg.winner);
        this.showTournamentWinner(msg.winner, msg.match_history);
      }
    });

    this.socket.addEventListener("close", () => {
      console.log("❌ TournamentSocket disconnected");
    });
  }

  cleanup() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  initializeView() {
    this.renderTournamentGrid();
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

  renderTournamentGrid() {
    const grid = document.getElementById("tournament-grid");
    if (!grid) {
      console.warn("⚠️ No grid found!");
      return;
    }
  
    const players = this.data.players || [];
    const round = this.data.round || 1;
    const totalRounds = this.data.total_rounds || 1;
    const results = this.data.results || {};
    const matchups = this.data.matchups || [];
  
    const advancing = Object.keys(results);
    const playerName =
      this.userProfile?.tournament_name || this.userProfile?.username;
    const isStillInTournament = advancing.includes(playerName);
  
    // 🔧 Spieler mit Status (✅ / ❌)
    const playerList = players
      .map((p, index) => {
        const name = p.tournament_name || p.username;
        const hasWon = advancing.includes(name);
  
        const statusIcon = hasWon
          ? "✅"
          : advancing.length > 0
            ? "❌"
            : "";
  
        const itemClass = hasWon
          ? "list-group-item-success"
          : advancing.length > 0
            ? "list-group-item-danger"
            : "";
  
        return `
          <li class="list-group-item ${itemClass}">
            Player ${index + 1}: ${statusIcon} ${name}
          </li>`;
      })
      .join("");
  
    // 🔁 Matchups anzeigen
    let matchupsHTML = "";
    if (matchups.length > 0) {
      matchupsHTML += `<p class="text-center fw-bold">Matchups:</p>`;
      matchups.forEach((match) => {
        const p1 = match.player1;
        const p2 = match.player2;
  
        const p1Won = results[p1];
        const p2Won = results[p2];
  
        const resultLine = p1Won
          ? `✅ ${p1} won against ${p2} `
          : p2Won
            ? `✅ ${p2} won against ${p1} `
            : `${p1} 🆚 ${p2}`;
  
        matchupsHTML += `<p class="text-center">${resultLine}</p>`;
      });
    }
  
    // 🟢 Button-Logik
    let buttonHTML = "";
  
    if (this.data.tournament_winner && playerName === this.data.tournament_winner) {
      buttonHTML = `
        <button id="winner-button" class="btn btn-warning mt-2">
          🏆 Congratulations, you won!
        </button>`;
    } else if (round === 1 && advancing.length === 0) {
      buttonHTML = `
        <button id="start-tournament-btn" class="btn btn-primary mt-2">
          Start tournament
        </button>`;
    } else if (advancing.length > 0 && isStillInTournament) {
      buttonHTML = `
        <button id="start-next-round-btn" class="btn btn-success mt-2">
          Start next round
        </button>`;
    }
  
    // 🆕 Back-to-Menu-Button immer sichtbar
    const backButtonHTML = `
      <button id="back-to-menu-btn" class="btn btn-secondary mt-2">
        Back to menu
      </button>`;
  
    // ⛺ Gesamtes HTML zusammensetzen
    grid.innerHTML = `
      <div class="card my-4">
        <div class="card-header text-center">
          <h4>🏆 Round ${round} of ${totalRounds}</h4>
        </div>
        <div class="card-body">
          <ul class="list-group mb-4">${playerList}</ul>
          ${matchupsHTML}
          <div class="d-grid gap-2 col-6 mx-auto mt-4">
            ${buttonHTML}
            ${backButtonHTML}
          </div>
        </div>
      </div>
    `;
  
    // 🧠 Event-Listener für Buttons
    const startBtn = document.getElementById("start-tournament-btn");
    if (startBtn) {
      startBtn.addEventListener("click", () => this.startTournament());
    }
  
    const nextBtn = document.getElementById("start-next-round-btn");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => this.startNextRound());
    }
  
    const backBtn = document.getElementById("back-to-menu-btn");
    if (backBtn) {
      backBtn.addEventListener("click", () => this.backToMenu());
    }
  }
  

  startTournament() {

    const wsProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
    const wsHost = window.location.hostname;
    const wsPort = window.location.protocol === "https:" ? "" : ":8001";
    const wsUrl = `${wsProtocol}${wsHost}${wsPort}/ws/menu`;
    const socket = new WebSocket(wsUrl);


    socket.onopen = () => {
      console.log("📡 Tournament Start Button WebSocket connected");
      socket.send(
        JSON.stringify({
          action: "start_tournament_now",
        })
      );
    };

    socket.onmessage = (event) => {
      console.log("Server response:", event.data);
      socket.close();
    };

    socket.onerror = (error) => {
      console.error("Error sending start signal:", error);
    };
  }

  startNextRound() {
    const advancing = this.data.results
      ? Object.keys(this.data.results)
      : [];

    const playerName =
      this.userProfile?.tournament_name || this.userProfile?.username;

    const isStillInTournament = advancing.includes(playerName);

    if (!isStillInTournament) {
      console.warn("⛔️ You have been eliminated and cannot play the next round.");
      return;
    }

    const wsProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
    const wsHost = window.location.hostname;
    const wsPort = window.location.protocol === "https:" ? "" : ":8001";
    const wsUrl = `${wsProtocol}${wsHost}${wsPort}/ws/menu`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("📡 Nächste Runde WebSocket verbunden");
      socket.send(
        JSON.stringify({
          action: "start_next_round",
        })
      );
    };

    socket.onmessage = (event) => {
      console.log("✅ Server-Antwort zur nächsten Runde:", event.data);
      socket.close();
    };

    socket.onerror = (error) => {
      console.error("❌ Fehler beim Senden des Start-Signals:", error);
    };
  }

  updateResults(results, round, totalRounds, matchups, players) {
    console.log("📊 Tournament results received from displayMenu.js:", results);

    // 🔄 Update internal state
    this.data.results = results;
    this.data.round = round;
    this.data.total_rounds = totalRounds;
    this.data.matchups = matchups;
    if (players) {
      this.data.players = players;
    }

    // 🔁 Neu rendern
    this.renderTournamentGrid();
  }
}
