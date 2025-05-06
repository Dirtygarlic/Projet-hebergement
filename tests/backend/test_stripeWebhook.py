from unittest.mock import patch
import json

def test_stripe_webhook(client):
    """Test pour simuler un webhook Stripe."""

    # Données du webhook Stripe simulées
    event_data = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "customer": "cus_test",
                "metadata": {
                    "hotel_id": "1",
                    "user_id": "1",
                    "user_name": "John Doe",
                    "email": "john.doe@example.com",
                    "checkin": "2025-05-01",
                    "checkout": "2025-05-05",
                    "guests": "2",
                    "adults": "2",
                    "children": "0",
                    "total_price": "200"
                }
            }
        }
    }

    # Utilisation de patch pour mocker l'appel à Stripe
    with patch("stripe.Webhook.construct_event") as mock_webhook:
        mock_webhook.return_value = event_data  # Simule l'événement Stripe

        # Effectuer une requête POST à la route de webhook
        response = client.post('/stripe-webhook', data=json.dumps(event_data), content_type='application/json')

        # Vérifier que le code de statut est 200
        assert response.status_code == 200
