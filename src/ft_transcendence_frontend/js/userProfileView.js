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
        // Platzhalter für zukünftige Implementierung
        console.log(`Loading match history for ${username} (not implemented yet)`);
        
        // Hier würden wir die Match-Historie vom Server laden
        // Für jetzt lassen wir die Standardnachricht "No matches found" stehen
    }
} 