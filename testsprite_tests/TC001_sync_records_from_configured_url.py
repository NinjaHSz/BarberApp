import requests

BASE_URL = "http://localhost:5555"
TIMEOUT = 30

def test_sync_records_from_configured_url():
    sync_url = "https://example.com/data-to-sync.json"  # Example URL for syncing data
    headers = {
        "Accept": "application/json"
    }

    # Step 1: Get records from the /sync endpoint with the URL parameter
    try:
        response = requests.get(f"{BASE_URL}/sync", params={"url": sync_url}, headers=headers, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request to /sync endpoint failed: {e}"

    data = response.json()
    assert isinstance(data, list), "Response data should be a list of records"

    # Step 2: Validate no duplicates in the resulting data
    # Assuming each record has a unique 'id' field for simplicity
    ids = [record.get("id") for record in data if "id" in record]
    assert len(ids) == len(set(ids)), "Duplicate record IDs found after sync"

    # Step 3: Validate no data loss by ensuring at least one record is returned (or adjust per expectation)
    assert len(data) > 0, "No records were synchronized from provided URL"

    # Step 4: Optionally, verify integrity of fields in records (example: all records have expected keys)
    required_keys = {"id", "client_id", "service", "date", "status"}
    for record in data:
        assert required_keys.issubset(record.keys()), f"Record missing required keys: {record}"

test_sync_records_from_configured_url()