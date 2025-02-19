import { updateProfile, getProfile } from './authLib.js';

export function fillProfileFields(data) {
    // Alle möglichen Element-IDs prüfen
    const elements = {
        username: document.getElementById('profile-username') || document.querySelector('.profile-username'),
        email: document.getElementById('profile-email') || document.querySelector('.profile-email'),
        bio: document.getElementById('profile-bio') || document.querySelector('.profile-bio'),
        birthDate: document.getElementById('profile-birth_date') || document.querySelector('.profile-birth-date'),
        avatar: document.getElementById('profile-avatar') || document.querySelector('.profile-avatar')
    };

    // Nur aktualisieren, wenn Element existiert
    if (elements.username) elements.username.textContent = data.username || '';
    if (elements.email) elements.email.textContent = data.email || '';
    if (elements.bio) elements.bio.textContent = data.bio || '';
    if (elements.birthDate) elements.birthDate.textContent = data.birth_date || '';
    
    if (elements.avatar) {
        if (data.avatar) {
            elements.avatar.src = data.avatar + '?t=' + new Date().getTime();
        } else {
            elements.avatar.src = 'https://placehold.co/80x80/f0f0f0/989898?text=No+Avatar';
        }
    }

    console.log("Profile fields updated with:", data);
}

export class ProfileHandler {
    static async updateProfile(formData) {
        const accessToken = localStorage.getItem('accessToken');
        return fetch('/api/users/profile/', {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + accessToken
            },
            body: formData
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => Promise.reject(err));
                }
                return response.json();
            });
    }
} 