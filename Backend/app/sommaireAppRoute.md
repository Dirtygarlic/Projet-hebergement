# 📚 SOMMAIRE DU FICHIER `appRoute.py`

## 🚀 Initialisation & Configuration
- Import des modules
- Chargement des variables d'environnement
- Initialisation de Flask, CORS, SQLAlchemy, Mail
- Initialisation des extensions d'inscription
- Configuration Stripe

## 💾 Gestion de la base de données
- `get_db_connection()`
- `close_db_connection()`

## 🌐 Routes HTML (pages visibles)
- `/` → Page d'accueil (`index.html`)
- `/paiement` → Page paiement avec clé Stripe
- `/resetPassword` → Page de réinitialisation
- `/hotel` → Page avec filtres et avis
- `/reservations` → Page avec carte et détails hôtel
- `/success`, `/cancel` → Pages suite au paiement Stripe

## 🔍 Fonctions de recherche / filtrage
- `/autocomplete` → Suggestions auto
- `/hotels` → Liste des hôtels + avis
- `/recherche` → Recherche globale
- `/filter_hotels` → Filtres avancés
- `/get_reviews` → Trie des avis
- `/get_hotel_name` → Récupère le nom d’un hôtel
- `/get_price_per_night/<id>` → Prix par nuit

## 📩 Réservations & Paiement Stripe
- `/api/reservations` → Création de réservation
- `/create-stripe-customer` → Création client Stripe
- `/create-checkout-session` → Création session de paiement
- `/stripe-webhook` → Webhook de confirmation
- `/send-confirmation-email` → Email de confirmation manuel

## 🧹 Nettoyage automatique des réservations
- `clean_old_pending_reservations()` → Supprime après 24h
- `/admin/clean-pending` → Route admin
- `schedule_cleaning_task()` → Thread automatique
