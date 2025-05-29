JustDreams06 - Application de réservation (Flask + SQLAlchemy)

🚀 Description

Ce projet est une application de réservation d'hôtels, avec paiement via Stripe, gérée en backend avec Flask et SQLAlchemy, et disposant d'une interface frontend (HTML/CSS/JS). Il propose notamment :

un système de recherche d'hôtels avec filtres

un espace utilisateur avec réservations

la gestion des paiements avec Stripe Checkout

l'envoi d'e-mails avec Flask-Mail

un nettoyage automatique des réservations expirées

🔧 Stack technique

Python 3 + Flask

SQLAlchemy (ORM)

SQLite (base locale)

Stripe API

Flask-Mail + Gmail SMTP

HTML / CSS / JS

🔹 Structure du fichier appRoute.py

1. 🚀 Initialisation & Configuration

Configuration de l'app Flask, de Stripe, de Flask-Mail, de SQLAlchemy (via scoped_session).

2. 🔧 Connexion à la base de données

Suppression du db_session à la fin de chaque requête via teardown_appcontext.

3. 🌐 Pages HTML visibles

Rendu de templates frontend : /, /paiement, /resetPassword, etc.

4. 🏨 Pages dynamiques Hôtels & Réservations

Routage des pages /hotel, /reservations, /api/default-hotel avec gestion dynamique via SQLAlchemy.

5. 📧 Newsletter

Inscription à la newsletter, stockage en base et envoi d'un e-mail de bienvenue.

6. 💬 Contact

Soumission du formulaire de contact avec double envoi d'e-mail : à l'administrateur et en réponse automatique à l'utilisateur.

7. 🔍 Recherche & Filtres

Routes de recherche autocomplete, par filtre ou pagination : /recherche, /filter_hotels, /get_reviews, etc.

8. 📦 Réservations & Paiement Stripe

Création de client Stripe, session de paiement, gestion du webhook /stripe-webhook.

9. ✅ Pages de confirmation Stripe

Pages /success et /cancel affichées après paiement ou annulation.

10. 👤 Espace utilisateur

Affichage des réservations, rôle utilisateur, annulation de réservation avec e-mail de confirmation.

11. 🪜 Nettoyage manuel admin

Route /admin/clean-pending pour suppression des réservations expirées (statut "pending").

12. 🪥 Tâche planifiée de nettoyage

Thread démon appelant clean_old_pending_reservations() toutes les 12h.

13. 🟢 Démarrage du serveur

Bloc if __name__ == '__main__' avec lancement de l'app Flask sur le port 5003.

🔄 Migration SQLAlchemy

Ce fichier a été entièrement migré de sqlite3 vers SQLAlchemy ORM pour une meilleure structure, des requêtes plus propres et une maintenance facilitée.

🌟 Auteur

Ce projet est développé par Remy pour l'application JustDreams06.

N'hésitez pas à consulter le fichier models.py pour voir la définition des tables utilisées dans les requêtes.

