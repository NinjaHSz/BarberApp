import requests

BASE_URL = "http://localhost:5555"
TIMEOUT = 30

def test_fetch_all_clients():
    url = f"{BASE_URL}/rest/v1/clients"
    headers = {
        "Accept": "application/json"
    }
    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    try:
        clients = response.json()
    except ValueError:
        assert False, "Response content is not valid JSON"

    assert isinstance(clients, list), f"Expected response to be a list, got {type(clients)}"

    # Additional basic checks for data integrity
    for client in clients:
        assert isinstance(client, dict), "Each client record should be a dictionary"
        assert "id" in client, "Client should have an identifier field 'id'"
        # Attempt minimal data fields validation if they exist
        if "nome" in client:
            assert isinstance(client["nome"], str), "Client 'nome' should be a string"
        if "email" in client:
            assert isinstance(client["email"], (str, type(None))), "Client 'email' should be string or None"
        if "telefone" in client:
            assert isinstance(client["telefone"], (str, type(None))), "Client 'telefone' should be string or None"

test_fetch_all_clients()
