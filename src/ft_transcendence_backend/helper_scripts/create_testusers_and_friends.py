from django.contrib.auth import get_user_model
from users.models import CustomUser
import random

User = get_user_model()

# 🔥 Alle bestehenden User löschen (falls du neu starten willst)
CustomUser.objects.all().delete()

# ✅ 15 Testuser mit Zufallsscores erstellen
test_users = []
for i in range(1, 16):
    username = f'testuser{i}'
    email = f'testuser{i}@example.com'
    password = 'testuser'
    avatar = f'avatars/avatar_{i}.png'  # Falls du Avatare hast
    
    user = CustomUser.objects.create_user(
        username=username,
        email=email,
        password=password,
        is_active=True,
        score=random.randint(0, 1000),
        avatar=avatar
    )
    
    user.is_verified = True  # Direkt als verifiziert markieren
    user.save()
    
    test_users.append(user)
    print(f"✅ Created test user: {username} (Password: {password})")

# ✅ Zufällige Freundschaften erstellen (jeder User bekommt bis zu 3 Freunde)
for user in test_users:
    friends = random.sample(test_users, k=random.randint(1, 3))  # Maximal 3 Freunde
    for friend in friends:
        if user != friend and not user.friends.filter(id=friend.id).exists():
            user.friends.add(friend)
            friend.friends.add(user)  # Bidirektionale Freundschaft
            print(f"🤝 {user.username} is now friends with {friend.username}")

print("\n🎉 DONE! 15 Testusers created with random friendships.")
print("\nhuhu:")
# 🔥 Alle User löschen
print("🛑 Deleting all users and related data...")

CustomUser.objects.all().delete()

print("✅ All users and friendships deleted successfully!")