
# 🌍 JustDreams06 – Site de Réservation en Ligne

Bienvenue sur **JustDreams06**, une application web complète développée en **Flask** pour rechercher, réserver et payer des hébergements de rêve partout dans le monde.

---

## 🚀 Fonctionnalités principales

- 🔍 **Recherche avancée** (lieu, dates, personnes, animaux)
- 🗺️ **Carte interactive** avec hôtels géolocalisés
- 💬 **Avis clients** triables avec pagination
- 🧾 **Réservation avec formulaire dynamique** (email, téléphone, vérifications)
- 💳 **Paiement sécurisé via Stripe** (avec webhooks)
- ✉️ **Email de confirmation personnalisé**
- 👤 **Espace utilisateur** (connexion, inscription, avatar)
- 📆 **Gestion des réservations** (annulation, visualisation)
- 🐢 **Lazy loading** des hôtels (10 par 10)
- 🧼 **Nettoyage automatique** des réservations en attente de +24h
- 🌐 **Changement de langue** (bouton dropdown)
- 📱 **Design responsive** mobile / tablette

---

## 🧠 Technologies utilisées

### 🔙 Backend

- **Python 3.10+**
- **Flask** (routes, Blueprints)
- **SQLAlchemy** (ORM avec `models.py`)
- **SQLite** (base de données locale)
- **Flask-Mail** (envoi d’emails)
- **itsdangerous** (tokens de réinitialisation de mot de passe)
- **Stripe** (paiement + webhooks)
- **Architecture MVC** partiellement appliquée, en cours de migration complète

### 🔛 Frontend

- **HTML5 / CSS3 (responsive + media queries)**
- **JavaScript (modulaire avec fichiers JS séparés)**
- **Flatpickr** (sélecteur de date)
- **Leaflet** (carte interactive)
- **Modules personnalisés** (`hotel.js`, `reservations.js`, `paiement.js`, etc.)

---

## 🗂️ Structure du projet (extraits)

```
/app/
    models.py
    config.py
    app.py
    /routes/
        hotel_routes.py
        user_routes.py
        reservation_routes.py
        ...
    /utils/
        cleaner.py
        mailer.py

/static/
    /JS/
        hotel.js
        reservations.js
        /reservations/
            reviewManager.js
            mapManager.js
            ...
    /css/
        index.css

/templates/
    index.html
    hotel.html
    paiement.html
    ...
    /email_templates/
        confirmation.html

stripe_config.js.jinja
```

---

## 🔐 Sécurité & Paiement

- Utilisation de `stripe_config.js.jinja` pour injecter la clé publique Stripe côté client sans la compromettre.
- Utilisation d’un webhook `checkout.session.completed` pour :
  - Créer la réservation
  - Mettre à jour le statut
  - Envoyer l’email de confirmation
- Les réservations sont **insérées uniquement** via le webhook (sécurisé).

---

## 📧 Système Email

- Envoi d’un email de confirmation personnalisé après paiement
- Template HTML stylisé aux couleurs de JustDreams06
- Gestion de l'envoi via `Flask-Mail`

---

## 🧼 Tâches automatiques

- Les réservations avec statut `"pending"` de plus de 24h sont supprimées automatiquement grâce à une fonction `clean_old_pending_reservations()`.

---

## 🧪 Environnement local

### ▶️ Démarrer l'app :
```bash
export FLASK_APP=app.py
export FLASK_ENV=development
flask run
```

### 📦 Dépendances principales :
```bash
pip install flask flask_sqlalchemy flask_mail stripe itsdangerous
```

---

## ✨ Prochaines améliorations envisagées

- Dashboard admin avec visualisation statistiques
- Notifications utilisateurs
- Système de filtre par prix / catégorie
- Intégration d’une API pour suggestions de destinations

---

## 👤 Auteur

Développé par **Remy** dans le cadre d’un projet personnel complet, avec une montée en compétences progressive en :
- JavaScript modulaire
- SQL → SQLAlchemy
- Paiement en ligne sécurisé
- Architecture MVC en Flask

---

## 📸 Capture d'écran

_(À insérer)_ : `static/images/screenshots/...`

---

## 📄 Licence

Projet personnel – Tous droits réservés
