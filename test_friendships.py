import requests

# Base URL for your API (update if necessary)
BASE_URL = "http://127.0.0.1:8080/api/users"

# Test user data
USER_1 = {"username": "user1", "email": "user1@example.com", "password": "password123"}
USER_2 = {"username": "user2", "email": "user2@example.com", "password": "password123"}

def register_user(user_data):
    """Registers a new user"""
    response = requests.post(f"{BASE_URL}/register/", json=user_data)
    if response.status_code == 201:
        print(f"✅ User {user_data['username']} registered successfully!")
    elif response.status_code == 400 and "username" in response.json():
        print(f"⚠️ User {user_data['username']} already exists. Skipping registration.")
    else:
        print(f"❌ Error registering {user_data['username']}: {response.json()}")

def login_user(user_data):
    """Logs in a user and returns the access token"""
    response = requests.post(f"{BASE_URL}/login/", json={
        "username": user_data["username"],
        "password": user_data["password"]
    })
    if response.status_code == 200:
        token = response.json().get("access")
        print(f"🔑 User {user_data['username']} logged in successfully!")
        return token
    else:
        print(f"❌ Error logging in {user_data['username']}: {response.json()}")
        return None

def add_friend(auth_token, friend_username):
    """Adds a friend"""
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = requests.post(f"{BASE_URL}/friends/add/{friend_username}/", headers=headers)
    
    # Debugging: Print raw response content
    print(f"🛑 RAW Response Status: {response.status_code}")
    print(f"🛑 RAW Response Text: {response.text}")

    try:
        json_response = response.json()
        print(f"➕ Add friend response: {json_response}")
    except requests.exceptions.JSONDecodeError:
        print("❌ ERROR: Response was not valid JSON")


def list_friends(auth_token):
    """Lists all friends of the authenticated user"""
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = requests.get(f"{BASE_URL}/friends/list/", headers=headers)
    print(f"📜 Friend list: {response.json()}")

def remove_friend(auth_token, friend_username):
    """Removes a friend"""
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = requests.post(f"{BASE_URL}/friends/remove/{friend_username}/", headers=headers)
    print(f"❌ Remove friend response: {response.json()}")

def main():
    """Main function to execute the test steps"""
    print("\n🚀 Starting Friend Management Test\n")

    # 1️⃣ Register both users
    register_user(USER_1)
    register_user(USER_2)

    # 2️⃣ Log both users in & get tokens
    token_user1 = login_user(USER_1)
    token_user2 = login_user(USER_2)

    if not token_user1 or not token_user2:
        print("⚠️ Error: Could not log in both users. Exiting.")
        return

    # 3️⃣ User1 adds User2 as a friend
    add_friend(token_user1, USER_2["username"])

    # 4️⃣ User1's friend list
    list_friends(token_user1)

    # 5️⃣ Remove User2 from User1's friend list
    remove_friend(token_user1, USER_2["username"])

    # 6️⃣ Check User1's friend list again
    list_friends(token_user1)

if __name__ == "__main__":
    main()
