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

    def __str__(self):
        return self.username

    def generate_verification_code(self):
        self.verification_code = ''.join(random.choices(string.digits, k=6))
        self.save()
