export class OnlineUsersHandler {
    static pollingInterval = null;
    
    static startPolling(friendsHandler) {
        // Speichere den FriendsHandler für die Verwendung in updateOnlineUsersList
        this.friendsHandler = friendsHandler;
        
        // Stoppe vorherige Polling-Intervalle, falls vorhanden
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        // Sofort beim Start abrufen
        this.fetchOnlineUsers();
        
        // Dann alle 10 Sekunden aktualisieren
        this.pollingInterval = setInterval(() => {
            this.fetchOnlineUsers();
        }, 10000);
    }
    
    static async fetchOnlineUsers() {
        try {
            const accessToken = localStorage.getItem('accessToken');
            if (!accessToken) {
                console.error('Kein Access-Token gefunden');
                return;
            }
            
            const response = await fetch('/api/users/online-users/', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Fehler beim Abrufen der Online-Benutzer');
            }
            
            const data = await response.json();
            this.updateOnlineUsersList(data.online_users, this.friendsHandler);
        } catch (error) {
            console.error('Fehler beim Abrufen der Online-Benutzer:', error);
        }
    }
    
    static updateOnlineUsersList(onlineUsers, friendsHandler) {
        // Diese Methode wird in displayMenu.js überschrieben
        const usersList = document.getElementById('online-users-list');
        if (!usersList) return;
        
        usersList.innerHTML = '';
        
        if (onlineUsers.length === 0) {
            usersList.innerHTML = '<li class="list-group-item text-center">Keine Spieler online</li>';
            return;
        }
        
        onlineUsers.forEach(user => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item';
            listItem.textContent = user.username;
            usersList.appendChild(listItem);
        });
    }

    static async removeUserFromOnline() {
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) return;

        try {
            // FIXME: gesamte URL ist wahrscheinlich falsch (but works)
            const response = await fetch("/api/users/logout/", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            console.log("👋 User aus Online-Liste entfernt");
        } catch (error) {
            console.error("⚠️ Fehler beim Entfernen des Users:", error);
            throw error;
        } finally {
            this.stopPolling();
        }
    }
} 