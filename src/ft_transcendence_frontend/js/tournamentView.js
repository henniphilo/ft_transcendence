/**
 * Class to handle the tournament view and interactions
 */
export class TournamentView {
  constructor(data) {
    this.data = data || {};
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

    const playerList = players
      .map(
        (p, index) =>
          `<li class="list-group-item">Player ${index + 1}: ${
            p.tournament_name
          }</li>`
      )
      .join("");

    let matchupsHTML = "";
    if (matchups.length > 0) {
      matchupsHTML += `<p class="text-center"><strong>Matchups:</strong></p>`;
      matchups.forEach((match) => {
        const resultIcon = results[match.player1]
          ? `✅ ${match.player1}`
          : results[match.player2]
          ? `✅ ${match.player2}`
          : `${match.player1} vs ${match.player2}`;
        matchupsHTML += `<p class="text-center">${resultIcon}</p>`;
      });
    }

    tournamentGrid.innerHTML = `
            <div class="card my-4">
                <div class="card-header text-center">
                    <h4>🏆 Tournament Round ${round} of ${totalRounds}</h4>
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
        console.log("📋 Results received:", msg.results);
        this.renderTournamentResults(
          msg.results,
          msg.round,
          msg.total_rounds,
          msg.matchups
        );
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
}
