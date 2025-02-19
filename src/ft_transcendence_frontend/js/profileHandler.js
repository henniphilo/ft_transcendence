export class ProfileHandler {
    static fillProfileFields(data) {
        if (data.username) {
            document.getElementById('profile-username').textContent = data.username;
        }
        if (data.email) {
            document.getElementById('profile-email').textContent = data.email;
        }
        if (data.bio) {
            document.getElementById('profile-bio').textContent = data.bio;
        }
        if (data.birth_date) {
            document.getElementById('profile-birth_date').textContent = data.birth_date;
        }
        if (data.avatar_url) {
            document.getElementById('profile-avatar').src = data.avatar_url;
        }
    }

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