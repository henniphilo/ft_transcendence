# integration/test_api.py
import pytest
import requests
import os

# Assuming your Django app runs on port 8000
# BASE_URL = "http://backend:8000" #backend is the service name of your django service in the docker-compose.ci.yml file.

# def test_api_health():
#     response = requests.get(f"{BASE_URL}/health/")  # Replace /health/ with your actual endpoint
#     assert response.status_code == 200

# def test_api_data():
#     response = requests.get(f"{BASE_URL}/api/data/") #replace /api/data/ with your actual endpoint.
#     assert response.status_code == 200
#     # Add more assertions to check the response data
#     assert "some_data" in response.text

#Example of a test that needs a post request.
# def test_api_post():
#     data = {"key": "value"}
#     response = requests.post(f"{BASE_URL}/api/post_endpoint/", json=data)
#     assert response.status_code == 201
#     assert response.json()["result"] == "success"