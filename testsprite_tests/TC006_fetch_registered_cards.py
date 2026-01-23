import requests

BASE_URL = "http://localhost:5555"
TIMEOUT = 30

def test_fetch_registered_cards():
    url = f"{BASE_URL}/rest/v1/cartoes"
    headers = {
        "Accept": "application/json"
    }
    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request to fetch registered cards failed: {e}"

    try:
        cards = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert isinstance(cards, list), "Response JSON should be a list"
    # The list can be empty or have card objects
    for card in cards:
        assert isinstance(card, dict), "Each card entry should be a dictionary"
        # Checking minimal expected fields that a credit card detail might have based on context
        # As PRD does not provide schema, check some common fields
        expected_keys = {"id", "card_number", "cardholder_name", "expiration_date", "brand"}
        present_keys = set(card.keys())
        assert expected_keys.intersection(present_keys), "Card entry should contain credit card fields"

test_fetch_registered_cards()