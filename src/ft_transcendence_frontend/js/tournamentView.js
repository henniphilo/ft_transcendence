/**
 * Class to handle the tournament view and interactions
 */
export class TournamentView {
  constructor(data) {
    this.data = data || {};
    this.userProfile = data.userProfile; // 👈 das hier sicherstellen
    this.socket = null;
    this.initializeView();
    this.setupEventListeners();
    this.setupWebSocket();
  }

  /**
   * Initialize the tournament view with data
   */
  initializeView() {
    console.log("Initializing tournament view with data:", this.data);
    this.renderTournamentGrid();

    if (this.data.results) {
      console.log("📋 Rendering initial results:", this.data.results);
      this.renderTournamentResults(
        this.data.results,
        this.data.round,
        this.data.total_rounds
      );
    }
  }

  /**
   * Render the tournament grid with players and matchups
   */
  renderTournamentGrid() {
    const tournamentGrid = document.getElementById("tournament-grid");
    if (!tournamentGrid) return;

    const players = this.data.players || [];
    const round = this.data.round || 1;
    const totalRounds = this.data.total_rounds || 1;
    const matchups = this.data.matchups || [];
    const results = this.data.results || {};

    // Create a mapping of usernames to tournament names if available
    const usernameToTournamentMap = {};
    players.forEach((p) => {
      if (p.username && p.tournament_name) {
        usernameToTournamentMap[p.username] = p.tournament_name;
      }
    });

    const playerList = players
      .map(
        (p, index) =>
          `<li class="list-group-item">Spieler ${index + 1}: ${
            p.tournament_name
          }${
            p.username && p.username !== p.tournament_name
              ? ` (${p.username})`
              : ""
          }</li>`
      )
      .join("");

    let matchupsHTML = "";
    if (matchups.length > 0) {
      matchupsHTML += `<p class="text-center"><strong>Paarungen:</strong></p>`;
      matchups.forEach((match) => {
        // Check if we need to map usernames to tournament names
        const player1 = usernameToTournamentMap[match.player1] || match.player1;
        const player2 = usernameToTournamentMap[match.player2] || match.player2;

        const resultIcon = results[player1]
          ? `✅ ${player1} hat gewonnen gegen ${player2}`
          : results[player2]
          ? `✅ ${player2} hat gewonnen gegen ${player1}`
          : `${player1} vs ${player2}`;
        matchupsHTML += `<p class="text-center">${resultIcon}</p>`;
      });
    }

    tournamentGrid.innerHTML = `
            <div class="card my-4">
                <div class="card-header text-center">
                    <h4>🏆 Turnierrunde ${round} von ${totalRounds}</h4>
                </div>
                <div class="card-body">
                    <ul class="list-group mb-4">
                        ${playerList}
                    </ul>
                    ${matchupsHTML}
                </div>
            </div>
        `;
  }

  /**
   * Render tournament results
   */
  renderTournamentResults(results, round, totalRounds) {
    const container = document.getElementById("tournament-results");
    console.log("🎯 Rendering Results:", results);
    if (!container) return;

    const resultList = Object.entries(results)
      .map(
        ([name, wins]) =>
          `<li class="list-group-item">${name} – Wins: ${wins}</li>`
      )
      .join("");

    container.innerHTML = `
            <div class="card mt-4">
                <div class="card-header text-center">
                    <h5>🕹️ Round ${round} of ${totalRounds}</h5>
                </div>
                <div class="card-body">
                    <ul class="list-group">${resultList}</ul>
                </div>
            </div>
        `;
  }

  /**
   * Setup event listeners for buttons
   */
  setupEventListeners() {
    const backToMenuBtn = document.getElementById("back-to-menu");
    if (backToMenuBtn) {
      backToMenuBtn.addEventListener("click", () => {
        window.showTemplate("menu", { userProfile: this.data.userProfile });
      });
    }

    const startTournamentBtn = document.getElementById("start-tournament-btn");
    if (startTournamentBtn) {
      startTournamentBtn.addEventListener("click", () => {
        this.startTournament();
      });
    }
  }

  /**
   * Start the tournament
   */
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

  /**
   * Setup WebSocket for tournament updates
   */
  setupWebSocket() {
    this.socket = new WebSocket("ws://" + window.location.host + "/ws/menu");

    this.socket.addEventListener("open", () => {
      console.log("🎯 TournamentSocket connected");
      this.socket.send(
        JSON.stringify({ action: "request_tournament_results" })
      );
    });

    this.socket.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);

      if (msg.action === "update_tournament_results") {
        console.log("📋 Neue Turnierergebnisse erhalten:", msg);

        this.data.results = msg.results;
        this.data.round = msg.round;
        this.data.total_rounds = msg.total_rounds;
        this.data.matchups = msg.matchups;

        this.renderTournamentGrid();
        this.renderTournamentResults(msg.results, msg.round, msg.total_rounds);

        if (Object.keys(msg.results).length === msg.matchups.length) {
          console.log("🎮 Alle Spiele dieser Runde abgeschlossen!");
          this.showNextRoundButton();
        }
      }

      if (msg.action === "tournament_finished") {
        console.log("🏆 Turnier beendet! Gewinner:", msg.winner);
        this.showTournamentWinner(msg.winner, msg.match_history);
      }
    });

    this.socket.addEventListener("close", () => {
      console.log("🎯 TournamentSocket disconnected");
    });
  }

  /**
   * Clean up resources when view is destroyed
   */
  cleanup() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  /**
   * Zeigt den Button für die nächste Runde an, wenn alle Spiele abgeschlossen sind
   */
  showNextRoundButton() {
    const startTournamentBtn = document.getElementById("start-tournament-btn");
  
    // Gewinnernamen der aktuellen Runde
    const advancing = this.data.results ? Object.keys(this.data.results) : [];
  
    // Spielername anhand des Tournament-Namens (nicht Username!)
    const playerName =
      this.userProfile?.tournament_name || this.userProfile?.username;
  
    const isStillInTournament = advancing.includes(playerName);
  
    console.log("🔍 userProfile:", this.userProfile);
    console.log("🔍 Spielername (Vergleichsgrundlage):", playerName);
    console.log("🔍 Spieler ist noch drin?:", isStillInTournament);
    console.log("🔍 Gewinner dieser Runde:", advancing);
  
    if (startTournamentBtn && isStillInTournament) {
      startTournamentBtn.textContent = "Nächste Runde starten";
      startTournamentBtn.style.display = "block";
  
      // Event-Listener aktualisieren
      startTournamentBtn.removeEventListener("click", this.startTournament);
      startTournamentBtn.addEventListener("click", () => {
        this.startNextRound();
      });
    } else if (startTournamentBtn) {
      startTournamentBtn.style.display = "none";
    }
  }
  
  
  
  
  

  /**
   * Startet die nächste Turnierrunde
   */
  startNextRound() {
    const advancing = this.data.results
      ? Object.keys(this.data.results)
      : [];
  
    const isStillInTournament = advancing.includes(this.userProfile?.username);
  
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
      console.log("Server-Antwort:", event.data);
      socket.close();
    };
  
    socket.onerror = (error) => {
      console.error("Fehler beim Senden des Start-Signals:", error);
    };
  }
  

  /**
   * Zeigt den Turniersieger an
   */
  showTournamentWinner(winner, matchHistory) {
    const tournamentGrid = document.getElementById("tournament-grid");
    if (!tournamentGrid) return;

    // Create a mapping of usernames to tournament names if available
    const usernameToTournamentMap = {};
    if (this.data.players) {
      this.data.players.forEach((p) => {
        if (p.username && p.tournament_name) {
          usernameToTournamentMap[p.username] = p.tournament_name;
        }
      });
    }

    // Try to get the tournament name if winner is a username
    const displayWinner = usernameToTournamentMap[winner] || winner;

    // Erstelle eine schöne Darstellung der Match-Historie
    const historyHTML = matchHistory
      .map((match) => {
        // Map usernames to tournament names if possible
        const displayWinner =
          usernameToTournamentMap[match.winner] || match.winner;
        const displayLoser =
          usernameToTournamentMap[match.loser] || match.loser;

        return `<li class="list-group-item">
          Runde ${match.round}: ${displayWinner} hat gegen ${displayLoser} gewonnen
        </li>`;
      })
      .join("");

    tournamentGrid.innerHTML = `
      <div class="card my-4">
        <div class="card-header text-center bg-success text-white">
          <h4>🏆 Turniersieger: ${displayWinner}</h4>
        </div>
        <div class="card-body">
          <p class="text-center">Herzlichen Glückwunsch an ${displayWinner} zum Turniersieg!</p>
          
          <h5 class="mt-4">Turnierverlauf:</h5>
          <ul class="list-group">
            ${historyHTML}
          </ul>
          
          <div class="d-grid gap-2 col-6 mx-auto mt-4">
            <button id="back-to-menu" class="btn btn-primary">Zurück zum Hauptmenü</button>
          </div>
        </div>
      </div>
    `;

    // Event-Listener für den Zurück-Button
    const backButton = document.getElementById("back-to-menu");
    if (backButton) {
      backButton.addEventListener("click", () => {
        window.showTemplate("menu", { userProfile: this.data.userProfile });
      });
    }
  }

  /**
   * Update tournament results from MenuDisplay
   */
  updateResults(results, round, totalRounds, matchups) {
    console.log("📊 Tournament results received from MenuDisplay:", results);

    // Daten aktualisieren
    this.data.results = results;
    this.data.round = round;
    this.data.total_rounds = totalRounds;
    this.data.matchups = matchups;

    // Grid und Ergebnisse neu rendern
    this.renderTournamentGrid();

    // Prüfen, ob die nächste Runde beginnen soll
    if (Object.keys(results).length === matchups.length) {
      console.log("🎮 Alle Spiele dieser Runde abgeschlossen!");
      this.showNextRoundButton();
    }
  }
}
