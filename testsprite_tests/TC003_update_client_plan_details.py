import requests

BASE_URL = "http://localhost:5555"
TIMEOUT = 30
HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
}

def test_update_client_plan_details():
    client_create_url = f"{BASE_URL}/rest/v1/clientes"
    client_patch_url = f"{BASE_URL}/rest/v1/clientes"
    # Prepare a new client with initial plan details to create
    new_client_data = {
        "nome": "Test Client TC003",
        "email": "testclienttc003@example.com",
        "telefone": "555-1234",
        "plano_id": 1,           # assuming plan id 1 exists
        "status_assinatura": "ativo",
        "data_renovacao": "2026-12-31"
    }

    # Updated plan details for PATCH request
    updated_client_plan_data = {
        "plano_id": 2,           # change subscription plan to id 2, assuming this exists
        "status_assinatura": "inativo",
        "data_renovacao": "2027-01-31"
    }

    client_id = None

    try:
        # Create a new client first to update it later
        response = requests.post(
            client_create_url,
            headers=HEADERS,
            json=new_client_data,
            timeout=TIMEOUT,
        )
        response.raise_for_status()
        created_clients = response.json()
        # The POST returns an array of created records typically
        assert isinstance(created_clients, list), "Create client response is not a list"
        assert len(created_clients) == 1, "Expected exactly one created client"
        client_id = created_clients[0].get("id")
        assert client_id is not None, "Created client missing 'id' field"

        # Patch the created client's plan details using PATCH with filter in query string
        patch_url = f"{client_patch_url}?id=eq.{client_id}"
        patch_response = requests.patch(
            patch_url,
            headers=HEADERS,
            json=updated_client_plan_data,
            timeout=TIMEOUT,
        )
        patch_response.raise_for_status()
        # The PATCH request typically returns the updated record(s) as list
        patched_clients = patch_response.json()
        assert isinstance(patched_clients, list), "Patch response is not a list"
        assert len(patched_clients) > 0, "No client records were updated"

        # Verify the updated fields match what we sent
        patched_client = patched_clients[0]
        assert patched_client.get("plano_id") == updated_client_plan_data["plano_id"], "plano_id not updated correctly"
        assert patched_client.get("status_assinatura") == updated_client_plan_data["status_assinatura"], "status_assinatura not updated correctly"
        assert patched_client.get("data_renovacao") == updated_client_plan_data["data_renovacao"], "data_renovacao not updated correctly"

        # Retrieve the client to confirm persisted changes
        get_url = f"{client_create_url}?id=eq.{client_id}"
        get_response = requests.get(get_url, headers=HEADERS, timeout=TIMEOUT)
        get_response.raise_for_status()
        get_clients = get_response.json()
        assert len(get_clients) == 1, "Client not found after update"
        retrieved_client = get_clients[0]
        assert retrieved_client.get("plano_id") == updated_client_plan_data["plano_id"], "Persisted plano_id mismatch"
        assert retrieved_client.get("status_assinatura") == updated_client_plan_data["status_assinatura"], "Persisted status_assinatura mismatch"
        assert retrieved_client.get("data_renovacao") == updated_client_plan_data["data_renovacao"], "Persisted data_renovacao mismatch"

    finally:
        # Cleanup: delete the created client if exists
        if client_id:
            del_url = f"{client_create_url}?id=eq.{client_id}"
            try:
                del_response = requests.delete(del_url, headers=HEADERS, timeout=TIMEOUT)
                del_response.raise_for_status()
            except Exception:
                pass

test_update_client_plan_details()
