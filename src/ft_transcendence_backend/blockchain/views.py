from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .blockchain_utils import add_game, get_game, get_game_count
from environ import Env
import os
import requests

env = Env()
env.read_env(os.path.join(os.path.dirname(__file__), '..', '.env'))  # Explicit .env path

@api_view(['POST'])
def add_game_manual(request):
    try:
        data = request.data
        winner_tournament_name = data.get('winner_tournament_name', '')
        timestamp = data.get('timestamp', '')
        if not all([winner_tournament_name, timestamp]):
            return Response({'error': 'Missing or invalid parameters'}, status=status.HTTP_400_BAD_REQUEST)
        private_key = env('ETH_PRIVATE_KEY')
        if not private_key:
            raise ValueError("ETH_PRIVATE_KEY not set in environment")
        result = add_game(winner_tournament_name, timestamp, private_key)
        return Response({
            'status': 'success',
            'tx_hash': result.transactionHash.hex()
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def sync_games(request):
    """API endpoint to sync game stats from API to the blockchain."""
    try:
        # Fetch game stats from API
        response = requests.get('http://localhost:8000/api/gamestats/')
        response.raise_for_status()
        games = response.json()

        private_key = env('ETH_PRIVATE_KEY')
        if not private_key:
            raise ValueError("ETH_PRIVATE_KEY not set in environment")

        # Process each game
        tx_hashes = []
        for game in games:
            # Map winner ID to username
            winner_tournament_name = (
                game['player1_username'] if game['winner'] == game['player1']
                else game['player2_username']
            )
            # Add game to blockchain
            result = add_game(winner_tournament_name, game['created_at'], private_key)
            tx_hashes.append(result.transactionHash.hex())

        return Response({
            'status': 'success',
            'message': 'Games synced to blockchain',
            'tx_hashes': tx_hashes
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def get_game(request, index):
    """API endpoint to retrieve a game's details from the blockchain."""
    try:
        winner_tournament_name, timestamp = get_game(int(index))
        return Response({
            'status': 'success',
            'winner_tournament_name': winner_tournament_name,
            'timestamp': timestamp
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def get_game_count(request):
    """API endpoint to retrieve the total number of games from the blockchain."""
    try:
        count = get_game_count()
        return Response({
            'status': 'success',
            'game_count': count
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)