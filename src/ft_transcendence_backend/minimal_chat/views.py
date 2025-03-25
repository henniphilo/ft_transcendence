from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from .models import BlockedUser

User = get_user_model()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_by_username(request, username):
    """Gibt die Benutzer-ID anhand des Benutzernamens zurück"""
    user = get_object_or_404(User, username=username)
    return Response({'id': user.id, 'username': user.username})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_by_id(request, user_id):
    """Gibt den Benutzernamen anhand der ID zurück"""
    user = get_object_or_404(User, id=user_id)
    return Response({'id': user.id, 'username': user.username})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def block_user(request):
    """Blockiert einen Benutzer"""
    username = request.data.get('username')
    if not username:
        return Response({'detail': 'Username ist erforderlich'}, status=400)
    
    # Stelle sicher, dass der Benutzer sich nicht selbst blockieren kann
    if username == request.user.username:
        return Response({'detail': 'Du kannst dich nicht selbst blockieren'}, status=400)
    
    user_to_block = get_object_or_404(User, username=username)
    
    # Prüfe, ob der Benutzer bereits blockiert ist
    if BlockedUser.objects.filter(user=request.user, blocked_user=user_to_block).exists():
        return Response({'detail': f'Benutzer {username} ist bereits blockiert'})
    
    # Blockiere den Benutzer
    BlockedUser.objects.create(user=request.user, blocked_user=user_to_block)
    
    return Response({'detail': f'Benutzer {username} wurde blockiert'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unblock_user(request):
    """Hebt die Blockierung eines Benutzers auf"""
    username = request.data.get('username')
    if not username:
        return Response({'detail': 'Username ist erforderlich'}, status=400)
    
    user_to_unblock = get_object_or_404(User, username=username)
    
    # Prüfe, ob der Benutzer blockiert ist
    block = BlockedUser.objects.filter(user=request.user, blocked_user=user_to_unblock).first()
    if not block:
        return Response({'detail': f'Benutzer {username} ist nicht blockiert'})
    
    # Hebe die Blockierung auf
    block.delete()
    
    return Response({'detail': f'Blockierung von {username} wurde aufgehoben'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_blocked_users(request):
    """Gibt eine Liste aller blockierten Benutzer zurück"""
    blocked_users = BlockedUser.objects.filter(user=request.user).select_related('blocked_user')
    blocked_list = [
        {'id': block.blocked_user.id, 'username': block.blocked_user.username}
        for block in blocked_users
    ]
    return Response(blocked_list) 