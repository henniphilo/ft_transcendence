/**
 * Klasse zur Verwaltung von Freundschaften
 */
export class FriendsHandler {
    constructor() {
        this.friends = [];
    }
    
    /**
     * Holt die Freundesliste vom Server
     * @returns {Promise<Array>} Liste der Freunde
     */
    async getFriends() {
        try {
            const accessToken = localStorage.getItem('accessToken');
            const response = await fetch('/api/users/friends/list/', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Fehler beim Abrufen der Freundesliste');
            }
            
            const data = await response.json();
            this.friends = data;
            return data;
        } catch (error) {
            console.error('Fehler beim Abrufen der Freundesliste:', error);
            throw error;
        }
    }
    
    /**
     * Fügt einen Benutzer als Freund hinzu
     * @param {string} username - Benutzername des hinzuzufügenden Freundes
     * @returns {Promise<Object>} Antwort vom Server
     */
    async addFriend(username) {
        try {
            const accessToken = localStorage.getItem('accessToken');
            const response = await fetch(`/api/users/friends/add/${username}/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Fehler beim Hinzufügen des Freundes');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Fehler beim Hinzufügen des Freundes:', error);
            throw error;
        }
    }
    
    /**
     * Entfernt einen Benutzer aus der Freundesliste
     * @param {string} username - Benutzername des zu entfernenden Freundes
     * @returns {Promise<Object>} Antwort vom Server
     */
    async removeFriend(username) {
        try {
            const accessToken = localStorage.getItem('accessToken');
            const response = await fetch(`/api/users/friends/remove/${username}/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Fehler beim Entfernen des Freundes');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Fehler beim Entfernen des Freundes:', error);
            throw error;
        }
    }
} 