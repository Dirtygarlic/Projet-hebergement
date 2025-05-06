# 📚 SOMMAIRE DU FICHIER `appRoute.py`

## 1. 🚀 Initialisation & Configuration
- 1.1. Import des modules nécessaires
- 1.2. Chargement des variables d’environnement (.env)
- 1.3. Définition du chemin absolu de la base de données
- 1.4. Initialisation de l'application Flask
- 1.5. Configuration SQLAlchemy
- 1.6. Configuration Stripe
- 1.7. Configuration Flask-Mail
- 1.8. Initialisation manuelle SQLAlchemy
- 1.9. Initialisation de Flask-Mail
- 1.10. Initialisation des Blueprints (inscription)

## 2. 🔧 Connexion à la base de données
- 2.1. `get_db_connection()` → Ouverture
- 2.2. `close_db_connection()` → Fermeture automatique

## 3. 🌐 Pages HTML visibles
- 3.1. `/` → Accueil (`index.html`)
- 3.2. `/paiement` → Page de paiement
- 3.3. `/stripe_config.js` → Script Stripe
- 3.4. `/resetPassword` → Réinitialisation du mot de passe
- 3.5. `/mes-reservations` → Mes réservations
- 3.6. `/contact (GET)` → Formulaire contact (affichage)

## 4. 🏨 Pages dynamiques hôtels & réservations
- 4.1. `/hotel` → Page des hôtels avec filtres et avis
- 4.2. `/reservations` → Page de réservation détaillée d’un hôtel
- 4.3. `/api/default-hotel` → Hôtel par défaut (Le Parisien Luxe)

## 5. 📧 Newsletter
- 5.1. `/subscribe (POST)` → Inscription à la newsletter

## 6. 💬 Contact
- 6.1. `/contact (POST)` → Envoi du formulaire de contact

## 7. 🔍 Recherche & Filtres
- 7.1. `/autocomplete (GET)` → Suggestions auto
- 7.2. `/hotels (GET)` → Liste complète des hôtels
- 7.3. `/recherche (POST)` → Recherche globale
- 7.4. `/filter_hotels (POST)` → Filtres avancés
- 7.5. `/get_reviews (GET)` → Avis d’un hôtel
- 7.6. `/get_hotel_name (GET)` → Nom d’un hôtel
- 7.7. `/get_price_per_night/<id> (GET)` → Prix d’un hôtel

## 8. 📦 Réservations & Stripe
- 8.1. `/api/reservations (POST)` → Réservation (désactivé)
- 8.2. `/stripe-webhook (POST)` → Webhook Stripe
- 8.3. `/create-checkout-session (POST)` → Session Stripe Checkout

## 9. ✅ Pages de confirmation Stripe
- 9.1. `/success` → Paiement réussi
- 9.2. `/cancel` → Paiement annulé

## 10. 👤 Espace utilisateur
- 10.1. `/api/mes-reservations/<user_id>` → Réservations utilisateur
- 10.2. `/api/reservations/<id> (DELETE)` → Annulation d’une réservation

## 11. 🧹 Nettoyage automatique des réservations
- 11.1. `/admin/clean-pending` → Nettoyage manuel
- 11.2. `clean_old_pending_reservations()` → Suppression > 24h
- 11.3. `schedule_cleaning_task()` → Thread toutes les 12h

## 12. 🧪 Exécution du serveur Flask
- 12.1. `if __name__ == '__main__'`
