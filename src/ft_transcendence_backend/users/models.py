from django.contrib.auth.models import AbstractUser
from django.db import models
import random
import string

class CustomUser(AbstractUser):
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(blank=True, null=True)
    birth_date = models.DateField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)  # 2FA aktiviert?
    verification_code = models.CharField(max_length=6, blank=True, null=True)  # 6-stelliger Code
    score = models.IntegerField(default=0)  # Neues Feld für den Score
    tournament_name = models.CharField(max_length=50, unique=True, blank=True, null=True)

    def __str__(self):
        return self.username

    def generate_verification_code(self):
        self.verification_code = ''.join(random.choices(string.digits, k=6))
        self.save()

    def generate_tournament_name(self):
        """ Generiert einen eindeutigen Tournament-Namen """
        adjectives = ["Legendary", "Mighty", "Stealthy", "Fierce", "Epic"]
        nouns = ["Phoenix", "Dragon", "Warrior", "Ninja", "Samurai"]
        while True:
            name = f"{random.choice(adjectives)}-{random.choice(nouns)}-{random.randint(100, 999)}"
            if not CustomUser.objects.filter(tournament_name=name).exists():
                return name

    def save(self, *args, **kwargs):
        """ Falls kein Tournament-Name gesetzt ist, generiere einen """
        if not self.tournament_name:
            self.tournament_name = self.generate_tournament_name()
        super().save(*args, **kwargs)
