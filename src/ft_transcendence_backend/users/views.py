# views.py

from django.shortcuts import render  # eventuell nicht benötigt
from rest_framework import generics, serializers
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.urls import path
from django.core.mail import send_mail
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, parser_classes
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
    """Gibt die Top 10 Spieler zurück"""
    users = CustomUser.objects.order_by('-score')[:10]
    leaderboard_data = []
    
    for rank, user in enumerate(users, 1):
        leaderboard_data.append({
            'rank': rank,
            'username': user.username,
            'score': user.score
        })
    
    return Response(leaderboard_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user_stats(request):
    """Gibt die Stats des aktuell eingeloggten Users zurück"""
    try:
        # Hole alle User, sortiert nach Score
        all_users = CustomUser.objects.order_by('-score')
        
        # Finde die Position des aktuellen Users
        current_user = request.user
        user_rank = list(all_users.values_list('id', flat=True)).index(current_user.id) + 1
        
        return Response({
            'username': current_user.username,
            'score': current_user.score,
            'rank': user_rank
        })
    except Exception as e:
        print(f"Error in get_current_user_stats: {str(e)}")
        return Response({'error': str(e)}, status=500)
