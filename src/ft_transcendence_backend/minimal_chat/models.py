from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class BlockedUser(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocking')
    blocked_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocked_by')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'blocked_user')
        
    def __str__(self):
        return f"{self.user.username} blockiert {self.blocked_user.username}"
