class LeaderboardDisplay {
    constructor() {
        this.container = document.getElementById('menu-container');
    }

    display() {
        console.log("Displaying leaderboard...");
        // Container leeren
        this.container.innerHTML = '';
        
        // Leaderboard HTML erstellen
        const leaderboardHtml = `
            <div class="leaderboard-container">
                <h2>Top 10 Spieler</h2>
                <div id="leaderboard-content">
                    <table class="leaderboard-table">
                        <thead>
                            <tr>
                                <th>Rang</th>
                                <th>Spieler</th>
                                <th>Punkte</th>
                            </tr>
                        </thead>
                        <tbody id="leaderboard-body">
                            <tr>
                                <td colspan="3">Lade Leaderboard...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <button class="menu-button" onclick="menuDisplay.handleMenuClick('back')">
                    Zurück zum Menü
                </button>
            </div>
        `;
        
        // Leaderboard anzeigen
        this.container.innerHTML = leaderboardHtml;
        
        // Daten laden
        this.loadLeaderboardData();
    }

    async loadLeaderboardData() {
        try {
            const response = await fetch('/api/users/leaderboard/');
            const data = await response.json();
            
            const tbody = document.getElementById('leaderboard-body');
            if (!tbody) return;

            tbody.innerHTML = data.map((player) => `
                <tr>
                    <td>${player.rank}</td>
                    <td>${player.username}</td>
                    <td>${player.score}</td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Fehler beim Laden des Leaderboards:', error);
            const tbody = document.getElementById('leaderboard-body');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="3">Fehler beim Laden des Leaderboards</td>
                    </tr>
                `;
            }
        }
    }

    cleanup() {
        // Aufräumen wenn nötig
    }
}

// Globale Verfügbarkeit sicherstellen
window.LeaderboardDisplay = LeaderboardDisplay; 