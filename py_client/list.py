import requests
from getpass import getpass

auth_endpoint = "http://localhost:8000/api/auth/"
password = getpass()

auth_response = requests.post(
	auth_endpoint,
	json={"username": "vishm", "password": password}
)
print(auth_response.json())

token = auth_response.json().get("token")
headers = {"Authorization": f"Token {token}"} if token else {}

endpoint = "http://localhost:8000/api/products/"

get_response = requests.get(endpoint, headers=headers)
print(get_response.json())
