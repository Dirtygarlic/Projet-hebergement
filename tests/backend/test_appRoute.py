import pytest
from appRoute import app

@pytest.fixture
def client():
    """Fixture pour créer un client de test Flask."""
    with app.test_client() as client:
        yield client

def test_get_user_reservations(client):
    """Test pour vérifier la récupération des réservations d'un utilisateur."""
    # Assumer que l'utilisateur avec ID 1 existe et a des réservations
    response = client.get('/api/mes-reservations/1')
    
    # Vérifier le statut de la réponse
    assert response.status_code == 200
    
    # Vérifier que la réponse contient des données de réservation
    reservations = response.get_json()
    assert isinstance(reservations, list)  # Doit être une liste
    if len(reservations) > 0:
        assert 'hotel_name' in reservations[0]  # Vérifier qu'un champ spécifique existe
