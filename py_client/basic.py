import requests

endpoint ="https://httpbin.org/status.200"
endpoint ="https://httpbin.org/"
endpoint = "http://localhost:8000/"

# API (Application Programming Interface) -> Method
get_response = requests.get(endpoint) 
print(get_response.text)
print(get_response.status_code)
