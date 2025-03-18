from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(allow_null=True, required=False)
    tournament_name = serializers.CharField(read_only=True)  # Damit User den Namen nicht selbst setzen kann

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'avatar', 'bio', 'birth_date', 'tournament_name', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
