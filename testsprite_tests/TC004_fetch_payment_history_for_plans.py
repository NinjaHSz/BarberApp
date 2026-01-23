import requests

BASE_URL = "http://localhost:5555"
ENDPOINT = "/rest/v1/pagamentos_planos"
TIMEOUT = 30

def test_fetch_payment_history_for_plans():
    url = BASE_URL + ENDPOINT
    headers = {
        "Accept": "application/json"
    }
    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # Validate response content type
    content_type = response.headers.get("Content-Type", "")
    assert "application/json" in content_type, "Response content type is not JSON"

    # Validate response JSON schema basics: expect a list of payment history records
    try:
        payments = response.json()
    except ValueError:
        assert False, "Response is not a valid JSON"

    assert isinstance(payments, list), "Response JSON is not a list"

    # If there are records, validate expected keys in each record
    if payments:
        required_keys = {"id", "client_plan_id", "payment_date", "amount", "status"}
        for payment in payments:
            assert isinstance(payment, dict), "Payment record is not a dictionary"
            assert required_keys.issubset(payment.keys()), f"Payment record missing required keys: {required_keys - payment.keys()}"

            # Validate basic types
            assert isinstance(payment["id"], int), "Payment id is not an integer"
            assert isinstance(payment["client_plan_id"], int), "Client plan id is not an integer"
            assert isinstance(payment["payment_date"], str) and payment["payment_date"], "Payment date is empty or not a string"
            assert (isinstance(payment["amount"], (int, float)) and payment["amount"] >= 0), "Payment amount is invalid"
            assert payment["status"] in {"paid", "pending", "failed", "cancelled"}, f"Unexpected payment status: {payment['status']}"

test_fetch_payment_history_for_plans()