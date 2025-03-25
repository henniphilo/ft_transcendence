import { fillProfileFields } from './profileHandler.js';
import { getProfile } from './authLib.js';

export class UserProfileView {
    constructor(username, currentUserProfile) {
        this.username = username;
        this.currentUserProfile = currentUserProfile; // Das Profil des eingeloggten Benutzers
        this.container = document.getElementById('user-profile-container');
        this.init();
    }
    
    init() {
        // Back-Button-Handler
        const backButton = document.getElementById('back-to-menu-btn');
        if (backButton) {
            backButton.addEventListener('click', () => {
                // Zurück zum Menü mit dem aktuellen Benutzerprofil
                console.log("Zurück zum Menü mit Profil:", this.currentUserProfile);
                
                // Stelle sicher, dass das Profil im localStorage gespeichert ist
                if (this.currentUserProfile) {
                    localStorage.setItem('userProfile', JSON.stringify(this.currentUserProfile));
                }
                
                // Zurück zum Menü mit dem aktuellen Benutzerprofil
                window.showTemplate('menu', { userProfile: this.currentUserProfile });
            });
        }
        
        // Lade das Benutzerprofil
        this.loadUserProfile();
    }
    
    async loadUserProfile() {
        try {
            // Lade Benutzerprofil des angeforderten Benutzers (this.username)
            const userProfile = await this.fetchUserProfile(this.username);
            this.displayUserProfile(userProfile);
            
            // Lade Match-Statistiken
            await this.loadMatchStats(this.username);
            
            // Lade Match-Historie
            await this.loadMatchHistory(this.username);
        } catch (error) {
            console.error('Fehler beim Laden des Benutzerprofils:', error);
        }
    }
    
    async fetchUserProfile(username) {
        // Verwende die vorhandene getProfile-Funktion, falls es sich um das eigene Profil handelt
        // Ansonsten verwende einen API-Aufruf für andere Profile
        let profileData;
        
        if (username === this.currentUserProfile.username) {
            // Eigenes Profil laden
            profileData = await getProfile();
        } else {
            // Profil eines anderen Benutzers laden
            const accessToken = localStorage.getItem('accessToken');
            const response = await fetch(`/api/users/profile/${username}/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Error loading user profile');
            }
            
            profileData = await response.json();
        }
        
        return profileData;
    }
    
    displayUserProfile(profileData) {
        // Profilbild
        const avatarElement = document.getElementById('profile-view-avatar');
        if (avatarElement) {
            avatarElement.src = profileData.avatar || '/assets/default-avatar.png';
        }
        
        // Benutzername
        const usernameElement = document.getElementById('profile-view-username');
        if (usernameElement) {
            usernameElement.textContent = profileData.username;
        }
        
        // Weitere Profildetails
        const emailElement = document.getElementById('profile-view-email');
        if (emailElement) {
            emailElement.textContent = profileData.email || 'Not provided';
        }
        
        const bioElement = document.getElementById('profile-view-bio');
        if (bioElement) {
            bioElement.textContent = profileData.bio || 'No bio provided';
        }
        
        const birthDateElement = document.getElementById('profile-view-birth-date');
        if (birthDateElement) {
            birthDateElement.textContent = profileData.birth_date || 'Not provided';
        }
        
        const tournamentNameElement = document.getElementById('profile-view-tournament-name');
        if (tournamentNameElement) {
            tournamentNameElement.textContent = profileData.tournament_name || 'Not provided';
        }
    }
    
    async loadMatchStats(username) {
        console.log(`Lade Match-Statistiken für ${username}`);
        
        try {
            // Hole den Access Token aus dem localStorage
            const accessToken = localStorage.getItem('accessToken');
            
            // Hole die Spielstatistiken mit dem Benutzernamen
            const statsResponse = await fetch(`/api/gamestats/stats/username/${username}/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            if (!statsResponse.ok) {
                throw new Error('Fehler beim Abrufen der Spielstatistiken');
            }
            
            const statsData = await statsResponse.json();
            console.log('Match-Statistiken für Benutzer:', statsData);
            
            // Zeige die Match-Statistiken an
            this.displayMatchStats(statsData);
        } catch (error) {
            console.error('Fehler beim Laden der Match-Statistiken:', error);
            // Zeige Standardstatistiken an
            this.displayMatchStats({
                wins: 0,
                losses: 0,
                win_rate: '0%',
                total_games: 0
            });
        }
    }
    
    displayMatchStats(stats) {
        const winsElement = document.getElementById('profile-view-wins');
        if (winsElement) {
            winsElement.textContent = stats.wins;
        }
        
        const lossesElement = document.getElementById('profile-view-losses');
        if (lossesElement) {
            lossesElement.textContent = stats.losses;
        }
        
        const winRateElement = document.getElementById('profile-view-win-rate');
        if (winRateElement) {
            winRateElement.textContent = stats.win_rate;
        }
        
        const totalGamesElement = document.getElementById('profile-view-total-games');
        if (totalGamesElement) {
            totalGamesElement.textContent = stats.total_games;
        }
    }
    
    async loadMatchHistory(username) {
        console.log(`Lade Match-Historie für ${username}`);
        
        try {
            // Hole den Access Token aus dem localStorage
            const accessToken = localStorage.getItem('accessToken');
            
            // Hole die Spielstatistiken direkt mit dem Benutzernamen
            const statsResponse = await fetch(`/api/gamestats/username/${username}/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            if (!statsResponse.ok) {
                throw new Error('Fehler beim Abrufen der Spielstatistiken');
            }
            
            const matchData = await statsResponse.json();
            console.log('Match-Historie für Benutzer:', matchData);
            
            // Zeige die Match-Historie an
            this.displayMatchHistory(matchData, username);
        } catch (error) {
            console.error('Fehler beim Laden der Match-Historie:', error);
            // Zeige eine leere Match-Historie an
            this.displayMatchHistory([], username);
        }
    }
    
    displayMatchHistory(matches, username) {
        const historyContainer = document.getElementById('match-history');
        
        if (!historyContainer) {
            console.error('Match-Historie-Container nicht gefunden');
            return;
        }
        
        // Lösche vorhandene Einträge
        historyContainer.innerHTML = '';
        
        if (!matches || matches.length === 0) {
            // Keine Spiele gefunden
            const noMatchesElement = document.createElement('p');
            noMatchesElement.textContent = 'Keine Spiele gefunden';
            noMatchesElement.className = 'text-center';
            historyContainer.appendChild(noMatchesElement);
            return;
        }
        
        // Erstelle eine Liste für die Match-Historie
        const historyList = document.createElement('ul');
        historyList.className = 'list-group match-history-items';
        
        // Begrenze auf die letzten 5 Spiele
        const recentMatches = matches.slice(0, 5);
        
        recentMatches.forEach(match => {
            const item = document.createElement('li');
            item.className = 'list-group-item match-history-item';
            
            // Datum formatieren
            const date = new Date(match.created_at);
            const formattedDate = date.toLocaleDateString('de-DE');
            
            // Gegner bestimmen
            const isPlayer1 = match.player1_username === username;
            const opponent = isPlayer1 ? match.player2_username : match.player1_username;
            
            // Ergebnis
            const score = `${match.player1_score} : ${match.player2_score}`;
            
            // Status (Gewonnen/Verloren)
            let result;
            if (match.winner) {
                // Wenn winner ein Objekt ist
                if (typeof match.winner === 'object') {
                    result = match.winner.username === username ? 'Gewonnen' : 'Verloren';
                } 
                // Wenn winner eine ID ist
                else {
                    const userWon = (isPlayer1 && match.player1_score > match.player2_score) || 
                                   (!isPlayer1 && match.player2_score > match.player1_score);
                    result = userWon ? 'Gewonnen' : 'Verloren';
                }
            } else {
                // Wenn kein Gewinner gesetzt ist, bestimme anhand der Punkte
                if (isPlayer1) {
                    result = match.player1_score > match.player2_score ? 'Gewonnen' : 'Verloren';
                } else {
                    result = match.player2_score > match.player1_score ? 'Gewonnen' : 'Verloren';
                }
            }
            
            const resultClass = result === 'Gewonnen' ? 'text-success' : 'text-danger';
            
            // HTML für das Listenelement
            item.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <span class="match-date">${formattedDate}</span>
                        <span class="match-opponent">vs. ${opponent}</span>
                    </div>
                    <div>
                        <span class="match-score">${score}</span>
                        <span class="match-result ${resultClass}">${result}</span>
                    </div>
                </div>
            `;
            
            historyList.appendChild(item);
        });
        
        historyContainer.appendChild(historyList);
    }
} 