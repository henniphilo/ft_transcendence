export class LeaderboardDisplay {
    constructor(menuDisplayInstance) {
        this.container = document.getElementById('menu-container');
        this.menuDisplay = menuDisplayInstance;
    }

    display() {
        console.log("Displaying leaderboard...");
        this.container.innerHTML = '';
        
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
                <div id="current-user-stats" class="current-user-stats">
                    <h3>Deine Position</h3>
                    <div id="current-user-container">
                        <!-- Wird dynamisch gefüllt -->
                    </div>
                </div>
                <button class="menu-item" id="back-button">
                    Zurück zum Menü
                </button>
            </div>
        `;
        
        this.container.innerHTML = leaderboardHtml;
        this.loadLeaderboardData();

        // Event Listener für den Back-Button
        document.getElementById('back-button').addEventListener('click', () => {
            this.menuDisplay.handleMenuClick('back');
        });
    }

    async loadLeaderboardData() {
        try {
            // Hole den Access Token aus dem localStorage
            const accessToken = localStorage.getItem('accessToken');
            
            // Request Headers mit Authorization Token
            const headers = {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            };

            // Lade Top 10
            const leaderboardResponse = await fetch('/api/users/leaderboard/');
            const leaderboardData = await leaderboardResponse.json();

            // Top 10 anzeigen
            const tbody = document.getElementById('leaderboard-body');
            if (tbody) {
                tbody.innerHTML = leaderboardData.map((player) => `
                    <tr>
                        <td>${player.rank}</td>
                        <td>${player.username}</td>
                        <td>${player.score}</td>
                    </tr>
                `).join('');
            }

            // Versuche Current User zu laden
            try {
                const currentUserResponse = await fetch('/api/users/current-stats/', {
                    method: 'GET',
                    headers: headers  // Hier wird der Token mitgeschickt
                });
                
                if (currentUserResponse.status === 401) {
                    // Token abgelaufen oder ungültig
                    document.getElementById('current-user-container').innerHTML = `
                        <div class="not-logged-in-message">
                            Bitte logge dich ein, um deine Position zu sehen.
                        </div>
                    `;
                } else {
                    const currentUserData = await currentUserResponse.json();
                    document.getElementById('current-user-container').innerHTML = `
                        <table class="leaderboard-table">
                            <tbody>
                                <tr class="current-user-row">
                                    <td>${currentUserData.rank}</td>
                                    <td>${currentUserData.username}</td>
                                    <td>${currentUserData.score}</td>
                                </tr>
                            </tbody>
                        </table>
                    `;
                }
            } catch (error) {
                console.error('Error fetching current user stats:', error);
                document.getElementById('current-user-container').innerHTML = `
                    <div class="error-message">
                        Fehler beim Laden deiner Position.
                    </div>
                `;
            }

        } catch (error) {
            console.error('Fehler beim Laden des Leaderboards:', error);
            if (document.getElementById('leaderboard-body')) {
                document.getElementById('leaderboard-body').innerHTML = `
                    <tr>
                        <td colspan="3">Fehler beim Laden der Daten</td>
                    </tr>
                `;
            }
        }
    }

    cleanup() {
        // Aufräumen wenn nötig
    }
} 