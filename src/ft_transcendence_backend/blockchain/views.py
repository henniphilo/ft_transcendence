from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .blockchain_utils import add_score, get_tournament_scores
from environ import Env
import os

env = Env()
env.read_env(os.path.join(os.path.dirname(__file__), '..', '.env'))  # Explicit .env path

@api_view(['POST'])
def add_tournament_score(request):
    """API endpoint to add a tournament score to the blockchain."""
    try:
        data = request.data
        tournament_id = int(data.get('tournament_id', 0))  # Default to 0 if missing
        user_id = int(data.get('user_id', 0))
        score = int(data.get('score', 0))
        if not all([tournament_id, user_id, score]):  # Check for missing/invalid values
            return Response({'error': 'Missing or invalid parameters'}, status=status.HTTP_400_BAD_REQUEST)
        private_key = env('ETH_PRIVATE_KEY')
        result = add_score(tournament_id, user_id, score, private_key)
        return Response({'status': 'success', 'tx_hash': result.transactionHash.hex()})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def get_tournament_scores_view(request, tournament_id):
    """API endpoint to retrieve scores for a tournament from the blockchain."""
    try:
        user_ids, scores = get_tournament_scores(int(tournament_id))
        return Response({'user_ids': user_ids, 'scores': scores})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)