import requests

endpoint ="https://httpbin.org/status.200"
endpoint ="https://httpbin.org/"

# API (Application Programming Interface) -> Method
get_response = requests.get(endpoint) 
print(get_response.text)
