import requests

url = "http://127.0.0.1:5000/register"
data = {
    "name": "Marie",
    "email": "marie@example.com",
    "password": "securepassword",
    "phone": "1234567890"
}
response = requests.post(url, json=data)
print(response.json())
