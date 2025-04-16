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

    console.log("✅ TournamentView constructor aufgerufen!", data);

    this.initializeView();
    this.setupWebSocket(); // muss hier bleiben!
  }

  setupWebSocket() {
    this.socket = new WebSocket("ws://" + window.location.host + "/ws/menu");
  
    this.socket.addEventListener("open", () => {
      console.log("🎯 TournamentSocket connected (setupWebSocket)");
      this.socket.send(JSON.stringify({ action: "request_tournament_results" }));
    });
  
    this.socket.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
  
      if (msg.action === "update_tournament_results") {
        console.log("📋 Neue Turnierergebnisse erhalten:", msg);
  
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
        console.log("🏆 Turnier beendet! Gewinner:", msg.winner);
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

  renderTournamentGrid() {
    const grid = document.getElementById("tournament-grid");
    if (!grid) {
      console.warn("⚠️ Kein Grid gefunden!");
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
            Spieler ${index + 1}: ${statusIcon} ${name}
          </li>`;
      })
      .join("");
  
    // 🔁 Matchups anzeigen
    let matchupsHTML = "";
    if (matchups.length > 0) {
      matchupsHTML += `<p class="text-center fw-bold">Paarungen:</p>`;
      matchups.forEach((match) => {
        const p1 = match.player1;
        const p2 = match.player2;
  
        const p1Won = results[p1];
        const p2Won = results[p2];
  
        const resultLine = p1Won
          ? `✅ ${p1} hat gegen ${p2} gewonnen`
          : p2Won
          ? `✅ ${p2} hat gegen ${p1} gewonnen`
          : `${p1} 🆚 ${p2}`;
  
        matchupsHTML += `<p class="text-center">${resultLine}</p>`;
      });
    }
  
    // 🟢 Button-Logik
    let buttonHTML = "";
  
    if (round === 1 && advancing.length === 0) {
      buttonHTML = `
        <button id="start-tournament-btn" class="btn btn-primary mt-2">
          Turnier starten
        </button>`;
    } else if (advancing.length > 0 && isStillInTournament) {
      buttonHTML = `
        <button id="start-next-round-btn" class="btn btn-success mt-2">
          Nächste Runde starten
        </button>`;
    }
  
    grid.innerHTML = `
      <div class="card my-4">
        <div class="card-header text-center">
          <h4>🏆 Turnierrunde ${round} von ${totalRounds}</h4>
        </div>
        <div class="card-body">
          <ul class="list-group mb-4">${playerList}</ul>
          ${matchupsHTML}
          <div class="d-grid gap-2 col-6 mx-auto mt-4">
            ${buttonHTML}
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
  }
  

  startTournament() {
    const socket = new WebSocket(`ws://${window.location.host}/ws/menu`);

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
      console.warn("⛔️ Du bist ausgeschieden und darfst die nächste Runde nicht starten.");
      return;
    }
  
    const socket = new WebSocket(`ws://${window.location.host}/ws/menu`);
  
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
