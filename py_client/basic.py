import requests

# endpoint ="https://httpbin.org/status.200"
# endpoint ="https://httpbin.org/"
endpoint = "http://localhost:8000/api/"

# API (Application Programming Interface) -> Method
get_response = requests.post(endpoint,json={'tirtle': "Hello World"}) 

# print(get_response.headers)
# print(get_response.text)
print(get_response.json())
