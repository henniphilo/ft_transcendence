export class TournamentView {
  constructor(data) {
      // Verhindert doppelte Instanzen und räumt alte auf
      if (window.__activeTournamentView && window.__activeTournamentView !== this) {
          console.warn("⚠️ TournamentView already exists – cleaning up previous instance...");
          window.__activeTournamentView.cleanup();
      }
      window.__activeTournamentView = this;

      this.userProfile = data.userProfile || {};
      // Stelle sicher, dass tournamentData alle nötigen Infos enthält (insb. später den winner)
      this.data = data.tournamentData || data || {};
      this.socket = null;

      // console.log("✅ TournamentView constructor called!", { userProfile: this.userProfile, tournamentData: this.data });

      this.initializeView();
      this.setupWebSocket();
  }

  // --- WebSocket Verbindung ---
  setupWebSocket() {
      // Nur verbinden, wenn nicht schon verbunden
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          // console.log("TournamentSocket already connected.");
          // Ergebnisse neu anfordern, falls nötig
          this.socket.send(JSON.stringify({ action: "request_tournament_results" }));
          return;
      }

      const wsProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
      const wsHost = window.location.hostname;
      const wsPort = window.location.protocol === "https:" ? "" : ":8001"; // Port für WebSocket
      const wsUrl = `${wsProtocol}${wsHost}${wsPort}/ws/menu`; // Pfad anpassen, falls nötig

      // console.log(`Attempting to connect WebSocket: ${wsUrl}`);
      try {
          const socket = new WebSocket(wsUrl);
          this.socket = socket;

          socket.addEventListener("open", () => {
              // console.log("🎯 TournamentSocket connected (setupWebSocket)");
              // Ergebnisse beim Verbinden anfordern
              socket.send(JSON.stringify({ action: "request_tournament_results" }));
          });

          socket.addEventListener("message", (event) => {
              try {
                  const msg = JSON.parse(event.data);
                  // console.log("Received WS message:", msg); // Logge alle Nachrichten

                  if (msg.action === "update_tournament_results") {
                      // console.log("📋 New tournament results received:", msg);
                      // Update state
                      this.data.results = msg.results || {};
                      this.data.round = msg.round;
                      this.data.total_rounds = msg.total_rounds;
                      this.data.matchups = msg.matchups || [];
                      if (msg.players) {
                          this.data.players = msg.players;
                      }
                       // Wichtig: Gewinner aktualisieren, falls gesendet
                      this.data.tournament_winner = msg.winner || this.data.tournament_winner || null;
                      // console.log("   -> Updated this.data.tournament_winner to:", this.data.tournament_winner);

                      this.renderTournamentGrid(); // UI neu zeichnen
                  } else if (msg.action === "tournament_finished") {
                      // console.log("🏆 Tournament finished message received! Winner:", msg.winner);
                      // Finalen Gewinner setzen und UI aktualisieren
                      this.data.tournament_winner = msg.winner;
                      this.data.match_history = msg.match_history; // Optional speichern
                      // console.log("   -> Set this.data.tournament_winner from finished message to:", this.data.tournament_winner);
                      this.renderTournamentGrid(); // Neu rendern -> Winner-Button erscheint
                  }
                  // Hier könnten weitere Aktionen behandelt werden
              } catch (e) {
                  console.error("Error parsing WebSocket message or processing update:", e, event.data);
              }
          });

          socket.addEventListener("close", (event) => {
              // console.log(`❌ TournamentSocket disconnected. Code: ${event.code}, Reason: ${event.reason}`);
              this.socket = null; // Referenz entfernen
               // Optional: Versuch, die Verbindung wiederherzustellen?
          });

          socket.addEventListener("error", (error) => {
              console.error("❌ TournamentSocket error:", error);
               // Fehler im UI anzeigen?
          });
      } catch (error) {
           console.error("Failed to create WebSocket connection:", error);
      }
  }

  // --- Aufräumen ---
  cleanup() {
      // console.log("🧹 Cleaning up TournamentView...");
      if (this.socket) {
          // console.log("   Closing WebSocket.");
           // Listener entfernen, um Memory Leaks zu vermeiden (obwohl close() das oft impliziert)
          this.socket.onopen = null;
          this.socket.onmessage = null;
          this.socket.onclose = null;
          this.socket.onerror = null;
          this.socket.close();
          this.socket = null;
      }
      if (window.__activeTournamentView === this) {
          // console.log("   Removing global reference.");
          window.__activeTournamentView = null;
      }
       // Evtl. EventListener von Buttons entfernen, falls sie nicht überschrieben werden
  }

  // --- Initialisierung der Ansicht ---
  initializeView() {
      // console.log("Initializing Tournament View...");
      const grid = document.getElementById("tournament-grid");
      const gameContainer = document.getElementById('game-container');

      if (grid) {
           // Grid existiert, gut. Evtl. leeren?
           // grid.innerHTML = ''; // Nur wenn nötig
      } else if (gameContainer) {
           // console.log("   Grid not found, creating inside game-container.");
           gameContainer.innerHTML = '<div id="tournament-grid"></div>'; // Leeren und Grid erstellen
           gameContainer.style.display = 'block';
      } else {
           console.error("❌ Cannot initialize view: Neither 'tournament-grid' nor 'game-container' found.");
           return;
      }
      this.renderTournamentGrid();
  }

  // --- Navigation zurück ---
  backToMenu() {
      // console.log("⬅️ Back to menu requested.");
      this.cleanup(); // Wichtig: WebSocket schließen etc.
      const gameContainer = document.getElementById('game-container');
      if (gameContainer) {
          // console.log("   Hiding game container.");
          gameContainer.innerHTML = ''; // Inhalt leeren für sauberen Übergang
          gameContainer.style.display = 'none';
      }
      // Stelle sicher, dass showTemplate existiert und korrekt aufgerufen wird
      if (typeof showTemplate === 'function') {
           showTemplate('menu', { userProfile: this.userProfile });
      } else {
           console.error("❌ showTemplate function is not defined!");
           window.location.hash = '#menu'; // Einfacher Fallback
      }
      if (this.onBackToMenu) this.onBackToMenu();
  }

  // --- Rendering der Hauptansicht ---
  renderTournamentGrid() {
      // console.log("Rendering tournament grid...");
      const grid = document.getElementById("tournament-grid");
      if (!grid) {
          console.warn("⚠️ renderTournamentGrid: No grid element found! Aborting render.");
          return;
      }

      // Daten extrahieren und Standardwerte setzen
      const players = this.data.players || [];
      const round = this.data.round || 1;
      const totalRounds = this.data.total_rounds || (players.length > 1 ? Math.ceil(Math.log2(players.length)) : 1);
      const results = this.data.results || {};
      const matchups = this.data.matchups || [];
      const currentWinner = this.data.tournament_winner || null; // Aktueller Gewinner aus dem State

      // console.log("  Current State for Rendering:", { round, totalRounds, currentWinner, resultsCount: Object.keys(results).length });

      // Aktuellen Spieler identifizieren
      const playerName = this.userProfile?.tournament_name || this.userProfile?.username || "N/A";
      const advancing = Object.keys(results); // Spieler, die die letzte Runde gewonnen haben
      const isStillInTournament = advancing.includes(playerName);
      const isTournamentOver = !!currentWinner;

      // HTML für Spielerliste generieren
      const playerListHTML = players.length > 0
          ? players.map((p, index) => {
              const name = p.tournament_name || p.username || `Player ${index + 1}`;
              const hasWonLastRound = advancing.includes(name);
              const isEliminated = !isTournamentOver && advancing.length > 0 && !hasWonLastRound;

              let statusIcon = ""; let itemClass = "";
              if (isTournamentOver && name === currentWinner) { statusIcon = "🏆"; itemClass = "list-group-item-warning fw-bold"; }
              else if (isTournamentOver) { statusIcon = ""; itemClass = "list-group-item-light text-muted"; } // Nur noch Teilnehmer
              else if (hasWonLastRound) { statusIcon = "✅"; itemClass = "list-group-item-success"; }
              else if (isEliminated) { statusIcon = "❌"; itemClass = "list-group-item-danger"; }

              return `<li class="list-group-item ${itemClass}">${statusIcon} ${name}</li>`;
            }).join("")
          : '<li class="list-group-item">No players found.</li>'; // Fallback

      // HTML für Matchups generieren
      let matchupsHTML = "";
      if (matchups.length > 0 && !isTournamentOver) { // Nur anzeigen, wenn Turnier läuft
          matchupsHTML += `<h5 class="text-center fw-bold mt-3 mb-2">Matchups (Round ${round})</h5>`;
          matchups.forEach((match) => {
              const p1 = match.player1; const p2 = match.player2;
              const p1Won = results[p1]; const p2Won = results[p2];
              const resultLine = p1Won ? `✅ ${p1} beat ${p2}` : p2Won ? `✅ ${p2} beat ${p1}` : `${p1} 🆚 ${p2}`;
              matchupsHTML += `<p class="text-center mb-1">${resultLine}</p>`;
          });
      }

      // Logik zur Bestimmung des richtigen Aktionsbuttons
      let buttonHTML = "";
      if (isTournamentOver && playerName === currentWinner) {
          // Spieler hat gewonnen -> Button zum Speichern anzeigen
          buttonHTML = `<button id="winner-button" class="btn btn-warning mt-2">🏆 Record Victory! 🏆</button>`;
      } else if (round === 1 && advancing.length === 0 && !isTournamentOver) {
          // Turnierstart
          buttonHTML = `<button id="start-tournament-btn" class="btn btn-primary-custom mt-2">Start Tournament</button>`;
      } else if (!isTournamentOver && advancing.length > 0 && isStillInTournament) {
          // Nächste Runde starten
          buttonHTML = `<button id="start-next-round-btn" class="btn btn-success mt-2">Start Next Round</button>`;
      } else if (isTournamentOver || (advancing.length > 0 && !isStillInTournament)) {
          // Spieler ausgeschieden oder Turnier vorbei (und er ist nicht Sieger)
           buttonHTML = `<p class="text-center text-muted mt-3 mb-0">Tournament over for you.</p>`;
      } else {
           // Wartezustand
           buttonHTML = `<p class="text-center text-muted mt-3 mb-0 fst-italic">Waiting for results...</p>`;
      }

      // Back-Button immer anzeigen
      const backButtonHTML = `<button id="back-to-menu-btn" class="btn btn-secondary mt-2">Back to Menu</button>`;

      // Finales HTML zusammensetzen und in das Grid einfügen
      grid.innerHTML = `
        <div class="card my-4 shadow-sm">
          <div class="card-header tournament-header">
            <h4 class="my-1">🏆 Tournament ${isTournamentOver ? 'Finished' : `Round ${round} of ${totalRounds}`}</h4>
            ${isTournamentOver ? `<p class="lead mb-1">Winner: <strong class="text-warning">${currentWinner}</strong></p>` : ''}
          </div>
          <div class="card-body profile-card">
            <h5 class="text-center mb-3">Player Status</h5>
            <ul class="list-group list-group-flush mb-4">${playerListHTML}</ul>
            ${matchupsHTML}
            <div class="d-grid gap-2 col-lg-6 col-md-8 mx-auto mt-4">
              ${buttonHTML}
              ${backButtonHTML}
            </div>
          </div>
        </div>
      `;

      // Event Listeners nach dem Rendern hinzufügen
      this.addEventListeners();
      // console.log("Grid rendering complete.");
  }


  // --- NEUE METHODE: Event Listeners hinzufügen ---
  addEventListeners() {
      // console.log("Attaching event listeners...");

      // Start Button
      const startBtn = document.getElementById("start-tournament-btn");
      if (startBtn) {
          // Remove previous listener if any (safer if render calls this multiple times)
          // startBtn.replaceWith(startBtn.cloneNode(true)); // Simple way to remove all listeners
          // startBtn = document.getElementById("start-tournament-btn"); // Re-select after cloning
          startBtn.addEventListener("click", () => this.startTournament(), { once: true }); // { once: true } helps prevent issues
           // console.log("  Listener added for #start-tournament-btn");
      }

      // Next Round Button
      const nextBtn = document.getElementById("start-next-round-btn");
      if (nextBtn) {
          // nextBtn.replaceWith(nextBtn.cloneNode(true));
          // nextBtn = document.getElementById("start-next-round-btn");
          nextBtn.addEventListener("click", () => this.startNextRound(), { once: true });
          // console.log("  Listener added for #start-next-round-btn");
      }

      // Back Button
      const backBtn = document.getElementById("back-to-menu-btn");
      if (backBtn) {
          // backBtn.replaceWith(backBtn.cloneNode(true));
          // backBtn = document.getElementById("back-to-menu-btn");
          backBtn.addEventListener("click", () => this.backToMenu()); // Back kann öfter geklickt werden
           // console.log("  Listener added for #back-to-menu-btn");
      }

      // --- Winner Button Listener (mit dynamischem Payload) ---
      const winnerBtn = document.getElementById("winner-button");
      if (winnerBtn) {
           // console.log("  Adding listener for #winner-button");
          // winnerBtn.replaceWith(winnerBtn.cloneNode(true)); // Falls nötig
          // winnerBtn = document.getElementById("winner-button"); // Falls nötig

          winnerBtn.addEventListener("click", () => {
              // console.log("🏆 Winner button clicked! Preparing dynamic payload...");

              // --- 1. Dynamische Daten holen ---
              const winnerName = this.data.tournament_winner; // Gewinnername aus dem State
              const timestamp = new Date().toISOString(); // Aktueller Zeitstempel im ISO Format

              // Validierung: Ist der Gewinnername vorhanden?
              if (!winnerName) {
                  console.error("❌ Cannot send to blockchain: Winner name is missing in this.data.tournament_winner");
                  alert("Error: Could not determine the winner's name to send.");
                  // Button evtl. zurücksetzen oder Fehlermeldung anzeigen
                  // winnerBtn.disabled = false; // Beispiel
                  return; // Abbruch
              }
              // console.log(`   Data prepared - Winner: ${winnerName}, Timestamp: ${timestamp}`);
              // --- Ende Daten holen ---


              // --- 2. Ladezustand anzeigen ---
              winnerBtn.disabled = true;
              const originalHTML = winnerBtn.innerHTML;
              winnerBtn.innerHTML = `
                  <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  Sending to Backend...
              `; // Text angepasst
              winnerBtn.classList.add('button-loading');
              // --- Ende Ladezustand ---


              // --- 3. API-Aufruf vorbereiten ---
              const apiUrl = '/blockchain/add_game/'; // <<< URL angepasst? Prüfe deinen Backend Endpunkt!
              // Neuer Payload, passend zur Solidity addGame Funktion
              const payload = {
                  winner_tournament_name: winnerName, // Dynamischer Name
                  timestamp: timestamp              // Dynamischer Zeitstempel
              };
              // --- Ende API-Aufruf vorbereiten ---


              // --- 4. Callbacks definieren ---
              const successHandler = (responseData) => {
                  // console.log("✅ Data sent successfully to backend:", responseData);
                  // Button-Zustand für Erfolg
                  winnerBtn.innerHTML = `✅ Result Saved!`; // Klarere Erfolgsanzeige
                  winnerBtn.classList.remove('btn-warning', 'button-loading');
                  winnerBtn.classList.add('btn-success');
                  // Button bleibt deaktiviert nach Erfolg

                  // Optional: QR-Code Logik basierend auf responseData (z.B. responseData.transactionHash)
                  // if (responseData.transactionHash) { /* ... generate QR ... */ }

                  alert(`Game result for winner ${winnerName} successfully recorded!`);
              };

              const errorHandler = (error) => {
                  console.error("❌ Failed to send data to backend:", error);
                  // Button-Zustand bei Fehler zurücksetzen
                  winnerBtn.disabled = false;
                  winnerBtn.innerHTML = originalHTML; // Originaltext wiederherstellen
                  winnerBtn.classList.remove('button-loading');
                  // Visuelles Feedback für Fehler
                  winnerBtn.classList.add('btn-danger');
                  setTimeout(() => {
                      winnerBtn.classList.remove('btn-danger');
                      if (!winnerBtn.classList.contains('btn-warning')) {
                          winnerBtn.classList.add('btn-warning');
                      }
                  }, 2500); // Fehlerfarbe für 2.5 Sek anzeigen

                  alert(`Error saving game result: ${error.message}\nPlease try again.`);
              };
              // --- Ende Callbacks ---


              // --- 5. Backend/Blockchain Funktion aufrufen ---
              // Ruft die Methode 'sendToBlockchain' auf, die in dieser Klasse definiert ist
              this.sendToBlockchain(apiUrl, payload, successHandler, errorHandler);
              // --- Ende Funktionsaufruf ---

          }, { once: true }); // { once: true } kann hier sinnvoll sein, da man den Sieg nur einmal speichern will
      } // Ende if(winnerBtn)
      // console.log("Event listeners attached.");
  } // Ende addEventListeners Methode


  // --- Methoden zum Starten der Runden ---
  startTournament() {
       // console.log("🏁 Starting tournament...");
       // (Code wie vorher, evtl. temporären Socket verwenden)
       const wsProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
       const wsHost = window.location.hostname;
       const wsPort = window.location.protocol === "https:" ? "" : ":8001";
       const wsUrl = `${wsProtocol}${wsHost}${wsPort}/ws/menu`;
       const tempSocket = new WebSocket(wsUrl);
       tempSocket.onopen = () => { tempSocket.send(JSON.stringify({ action: "start_tournament_now" })); setTimeout(()=>tempSocket.close(), 500);};
       tempSocket.onerror = (e) => console.error("Error sending start signal:", e);
  }

  startNextRound() {
      const advancing = this.data.results ? Object.keys(this.data.results) : [];
      const playerName = this.userProfile?.tournament_name || this.userProfile?.username;
      if (!advancing.includes(playerName) && !this.data.tournament_winner) {
           console.warn("⛔️ Cannot start next round: Player eliminated or tournament over.");
           return;
      }
       console.log("▶️ Starting next round...");
      // (Code wie vorher, evtl. temporären Socket verwenden)
       const wsProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
       const wsHost = window.location.hostname;
       const wsPort = window.location.protocol === "https:" ? "" : ":8001";
       const wsUrl = `${wsProtocol}${wsHost}${wsPort}/ws/menu`;
       const tempSocket = new WebSocket(wsUrl);
       tempSocket.onopen = () => { tempSocket.send(JSON.stringify({ action: "start_next_round" })); setTimeout(()=>tempSocket.close(), 500); };
       tempSocket.onerror = (e) => console.error("Error sending next round signal:", e);
  }

  // --- Methode zum Aktualisieren des Zustands von außen (falls noch genutzt) ---
  updateResults(results, round, totalRounds, matchups, players, tournament_winner) {
      // console.log("📊 External updateResults called:", { results, round, totalRounds, /*matchups, players,*/ tournament_winner });
      this.data.results = results || {};
      this.data.round = round;
      this.data.total_rounds = totalRounds;
      this.data.matchups = matchups || [];
      if (players) this.data.players = players;
      if (tournament_winner !== undefined) this.data.tournament_winner = tournament_winner;
      this.renderTournamentGrid(); // Neu rendern
  }

  // --- Methode zum Senden der Daten an das Backend ---
  // (Name ist jetzt 'sendToBlockchain', Funktionalität ist aber generisch POST)
  sendToBlockchain(url, data, onSuccess, onError) {
      const handleSuccess = onSuccess || function(responseData) { console.log('Data sent successfully:', responseData); };
      const handleError = onError || function(error) { console.error('Failed to send data:', error); };
      const fetchOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
      };
      // console.log(`🚀 Sending POST to ${url} with data:`, data);
      fetch(url, fetchOptions)
          .then(response => {
              // console.log(`   Response status: ${response.status}`);
              if (!response.ok) {
                  return response.text().then(text => { throw new Error(`HTTP ${response.status} ${response.statusText} - ${text}`); });
              }
              const contentType = response.headers.get("content-type");
              if (contentType && contentType.includes("application/json")) return response.json();
              else return response.text().then(text => ({ success: true, status: response.status, message: text || "OK" }));
          })
          .then(responseData => { console.log("   Request succeeded."); handleSuccess(responseData); })
          .catch(error => { console.error("   Request failed."); handleError(error); });
  }

} // Ende der Klasse TournamentView
