export class LeaderboardDisplay {
    constructor(menuDisplayInstance) {
        this.container = document.getElementById('menu-container');
        this.menuDisplay = menuDisplayInstance;
    }

    display() {
        console.log("Displaying leaderboard...");
        this.container.innerHTML = '';

        const leaderboardHtml = `
            <div class="container py-4">
                <div class="row justify-content-center">
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-header profile-header">
                                <h2 class="mb-0">Top 10 Spieler</h2>
                            </div>
                            <div class="card-body profile-card">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead class="table-dark">
                                            <tr>
                                                <th>Rank</th>
                                                <th>Player</th>
                                                <th>Score</th>
                                            </tr>
                                        </thead>
                                        <tbody id="leaderboard-body">
                                            <tr>
                                                <td colspan="3" class="text-center">Lade Leaderboard...</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div class="mt-4">
                                    <h3 class="mb-3">Your Position</h3>
                                    <div id="current-user-container" class="mb-4">
                                        <!-- Wird dynamisch gefüllt -->
                                    </div>
                                </div>
                                
                                <div class="d-grid">
                                    <button class="btn-primary-custom" id="back-button">
                                        Back to Menu
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
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
                        <div class="alert alert-warning">
                            Bitte logge dich ein, um deine Position zu sehen.
                        </div>
                    `;
                } else {
                    const currentUserData = await currentUserResponse.json();
                    document.getElementById('current-user-container').innerHTML = `
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <tbody>
                                    <tr class="table-primary">
                                        <td>${currentUserData.rank}</td>
                                        <td>${currentUserData.username}</td>
                                        <td>${currentUserData.score}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    `;
                }
            } catch (error) {
                console.error('Error fetching current user stats:', error);
                document.getElementById('current-user-container').innerHTML = `
                    <div class="alert alert-danger">
                        Fehler beim Laden deiner Position.
                    </div>
                `;
            }

        } catch (error) {
            console.error('Fehler beim Laden des Leaderboards:', error);
            if (document.getElementById('leaderboard-body')) {
                document.getElementById('leaderboard-body').innerHTML = `
                    <tr>
                        <td colspan="3" class="text-center text-danger">Fehler beim Laden der Daten</td>
                    </tr>
                `;
            }
        }
    }

    cleanup() {
        // Aufräumen wenn nötig
    }
}
