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
            // Verwende die vorhandene getProfile-Funktion, falls es sich um das eigene Profil handelt
            // Ansonsten verwende einen API-Aufruf für andere Profile
            let profileData;
            
            if (this.username === this.currentUserProfile.username) {
                // Eigenes Profil laden
                profileData = await getProfile();
            } else {
                // Profil eines anderen Benutzers laden
                const accessToken = localStorage.getItem('accessToken');
                const response = await fetch(`/api/users/profile/${this.username}/`, {
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
            
            this.displayUserProfile(profileData);
            
            // Lade Match-Statistiken und -Historie
            this.loadMatchStats(this.username);
            this.loadMatchHistory(this.username);
            
        } catch (error) {
            console.error('Error loading user profile:', error);
            alert('Could not load user profile. Please try again later.');
        }
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
        // Platzhalter für zukünftige Implementierung
        console.log(`Loading match stats for ${username} (not implemented yet)`);
        
        // Hier würden wir die Match-Statistiken vom Server laden
        // Für jetzt verwenden wir Dummy-Daten
        const dummyStats = {
            wins: 0,
            losses: 0,
            win_rate: '0%',
            total_games: 0
        };
        
        this.displayMatchStats(dummyStats);
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
            console.log('Spielstatistiken für Benutzer:', matchData);
            
            // Zeige die Match-Historie an
            this.displayMatchHistory(matchData, username);
        } catch (error) {
            console.error('Fehler beim Laden der Match-Historie:', error);
            // Zeige eine leere Match-Historie an
            this.displayMatchHistory([], username);
        }
    }
    
    // Angepasste Methode zum Anzeigen der Match-Historie
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
            noMatchesElement.className = 'no-matches-message';
            historyContainer.appendChild(noMatchesElement);
            return;
        }
        
        // Erstelle eine Tabelle für die Match-Historie
        const table = document.createElement('table');
        table.className = 'match-history-table';
        
        // Tabellenkopf
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        ['Datum', 'Gegner', 'Ergebnis', 'Status'].forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Tabellenkörper
        const tbody = document.createElement('tbody');
        
        matches.forEach(match => {
            const row = document.createElement('tr');
            
            // Datum formatieren
            const date = new Date(match.created_at);
            const dateCell = document.createElement('td');
            dateCell.textContent = date.toLocaleDateString();
            
            // Gegner bestimmen (der andere Spieler)
            const opponentCell = document.createElement('td');
            const isPlayer1 = match.player1_username === username;
            const opponent = isPlayer1 ? match.player2_username : match.player1_username;
            opponentCell.textContent = opponent;
            
            // Ergebnis
            const scoreCell = document.createElement('td');
            scoreCell.textContent = `${match.player1_score} : ${match.player2_score}`;
            
            // Status (Gewonnen/Verloren)
            const statusCell = document.createElement('td');
            const hasWon = match.winner && (
                (match.winner.username === username) || 
                (typeof match.winner === 'number' && 
                 ((isPlayer1 && match.player1_score > match.player2_score) || 
                  (!isPlayer1 && match.player2_score > match.player1_score)))
            );
            statusCell.textContent = hasWon ? 'Gewonnen' : 'Verloren';
            statusCell.className = hasWon ? 'win-status' : 'loss-status';
            
            // Füge alle Zellen zur Zeile hinzu
            row.appendChild(dateCell);
            row.appendChild(opponentCell);
            row.appendChild(scoreCell);
            row.appendChild(statusCell);
            
            // Füge die Zeile zum Tabellenkörper hinzu
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        historyContainer.appendChild(table);
    }
} 