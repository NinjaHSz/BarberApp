import requests

BASE_URL = "http://localhost:5555"
HEADERS = {
    "Content-Type": "application/json"
}
TIMEOUT = 30

def test_fetch_all_expenses():
    url = f"{BASE_URL}/rest/v1/saidas"
    try:
        response = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request to fetch all expenses failed: {e}"

    try:
        expenses = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert isinstance(expenses, list), "Response should be a list of expense records"

    # If there are expense records, verify presence of key details.
    if expenses:
        sample = expenses[0]
        # Check required fields presence with correct types
        assert "id" in sample, "Expense record missing 'id'"
        assert "descricao" in sample or "description" in sample, "Expense record missing description field"
        # Payment status presence and type
        payment_status_keys = ["status_pagamento", "payment_status"]
        has_payment_status = any(k in sample for k in payment_status_keys)
        assert has_payment_status, "Expense record missing payment status field"

        # Installment info presence (parcelas or installments)
        installment_keys = ["parcelas", "installments"]
        has_installments = any(k in sample for k in installment_keys)
        assert has_installments, "Expense record missing installment info field"

    else:
        # It's allowed to have empty list, but a valid successful response is required
        assert response.status_code == 200

test_fetch_all_expenses()