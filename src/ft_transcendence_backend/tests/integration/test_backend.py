# integration/test_backend.py
import pytest
import requests

BACKEND_URL = "http://backend:8000"

def test_backend_health():
    response = requests.get(f"{BACKEND_URL}/metrics")
    assert response.status_code == 200

# Add tests for other Django backend endpoints here...

# integration/test_game.py
# import pytest
# import requests

# GAME_URL = "http://game:8001"

# def test_game_health():
#     response = requests.get(GAME_URL)
#     assert response.status_code == 200

# more tests for the game service...