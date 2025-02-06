# views.py

from django.shortcuts import render  # eventuell nicht benötigt
from rest_framework import generics, serializers
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.urls import path
from django.core.mail import send_mail
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import get_user_model

from .models import CustomUser
from .serializers import UserSerializer
from .permissions import IsVerified
from .leaderboard import Leaderboard

# ------------------
# 1) Registrierung
# ------------------
class RegisterUserView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

# ------------------
# 2) Custom JWT-Login
# ------------------

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Überschreibt die Standard-Validation von SimpleJWT,
    um nur verifizierten Usern ein Token zu geben.
    """
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user  # kommt aus der Standard-Logic von TokenObtainPairSerializer

        # Prüfe, ob der User verifiziert ist
        # Falls dein Feld anders heißt, passe es hier an:
        if not user.is_verified:
            raise serializers.ValidationError("User not verified. Please complete 2FA first.")

        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

# ------------------
# 3) URLs für Token
# ------------------

urlpatterns = [
    # Statt dem Standard-Login nun unsere Custom-View:
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# ------------------
# 4) 2FA Code versenden + verifizieren
# ------------------

@api_view(['POST'])
def send_verification_code(request):
    email = request.data.get('email')
    user = CustomUser.objects.filter(email=email).first()
    
    if user:
        user.generate_verification_code()  # nehme an, in models.py definiert
        send_mail(
            'Your Verification Code',
            f'Your code is {user.verification_code}',
            'supertabaluga@gmail.com',
            [email]
        )
        return Response({"message": "Verification code sent."})
    
    return Response({"error": "User not found."}, status=400)

@api_view(['POST'])
def verify_code(request):
    email = request.data.get('email')
    code = request.data.get('code')
    user = CustomUser.objects.filter(email=email, verification_code=code).first()

    if user:
        user.is_verified = True
        user.verification_code = None  # Code nach Verifikation löschen
        user.save()
        return Response({"message": "User verified."})
    
    return Response({"error": "Invalid code."}, status=400)

# ------------------
# 5) Profil (nur für verifizierte User)
# ------------------

from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser

@api_view(['GET', 'PUT'])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([IsVerified])
def user_profile(request):
    user = request.user

    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data)

    elif request.method == 'PUT':
        # Bei Datei-Uploads: request.data enthält auch die Dateien (dank MultiPartParser)
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


#@api_view(['GET', 'PUT'])
#@permission_classes([IsVerified])  # plus IsAuthenticated inside IsVerified, je nachdem wie du es definierst
#def user_profile(request):
#    """
#    Der User kann sein eigenes Profil auslesen oder updaten.
#    Erreicht wird dieser Endpunkt nur, wenn IsVerified = True.
#    """
#    user = request.user
#
#    if request.method == 'GET':
#        serializer = UserSerializer(user)
#        return Response(serializer.data)
#
#    elif request.method == 'PUT':
#        serializer = UserSerializer(user, data=request.data, partial=True)
#        if serializer.is_valid():
#            serializer.save()
#            return Response(serializer.data)
#        return Response(serializer.errors, status=400)

@api_view(['GET'])
def get_leaderboard(request):
    top_players = Leaderboard.get_top_players()
    leaderboard_data = [
        {
            'rank': index + 1,
            'username': player['username'],
            'score': player['score']
        }
        for index, player in enumerate(top_players)
    ]
    return Response(leaderboard_data)
