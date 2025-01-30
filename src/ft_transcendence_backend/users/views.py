#from django.shortcuts import render
#first line above might not be needed
# Create your views here.
from rest_framework import generics
from rest_framework.permissions import AllowAny
from .models import CustomUser
from .serializers import UserSerializer

class RegisterUserView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.urls import path

urlpatterns = [
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]


from django.core.mail import send_mail
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import CustomUser

@api_view(['POST'])
def send_verification_code(request):
    email = request.data.get('email')
    user = CustomUser.objects.filter(email=email).first()
    
    if user:
        user.generate_verification_code()
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


from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializers import UserSerializer

User = get_user_model()


from .permissions import IsVerified

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated, IsVerified])  # 👈 Jetzt nur für verifizierte User
def user_profile(request):
    user = request.user

    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
