# =========================================
# 📚 SOMMAIRE DU FICHIER appRoute.py
# =========================================
# 🚀 Initialisation & Configuration
#   - Import des modules
#   - Chargement des variables d'environnement
#   - Initialisation de Flask, CORS, SQLAlchemy, Mail
#   - Initialisation des extensions d'inscription
#   - Configuration Stripe
#   - Initialisation manuelle SQLAlchemy (hors Flask-SQLAlchemy)
#
# 📂 Gestion de la base de données
#   - get_db_connection()
#   - close_db_connection()
#
# 🌐 Routes HTML (pages visibles)
#   - /                  → Page d'accueil (index.html)
#   - /paiement          → Page paiement avec clé Stripe
#   - /resetPassword     → Page de réinitialisation
#   - /hotel             → Page avec filtres et avis
#   - /reservations      → Page avec carte et détails hôtel
#   - /success /cancel   → Pages suite au paiement Stripe
#
# 📧 Newsletter
#   - /subscribe         → Inscription à la newsletter
#
# 🔍 Fonctions de recherche / filtrage
#   - /autocomplete              → Suggestions auto
#   - /hotels                   → Liste des hôtels + avis
#   - /recherche                → Recherche globale
#   - /filter_hotels            → Filtres avancés
#   - /get_reviews              → Trie des avis
#   - /get_hotel_name           → Récupère le nom d’un hôtel
#   - /get_price_per_night/<id> → Prix par nuit
#
# 📩 Réservations & Paiement Stripe
#   - /api/reservations            → Création de réservation
#   - /create-checkout-session     → Création session de paiement
#   - /stripe-webhook              → Webhook de confirmation
#   - /send-confirmation-email     → Email de confirmation manuel
#
# 👤 Espace utilisateur
#   - /mes-reservations                   → Page mes réservations
#   - /api/mes-reservations/<user_id>     → Récupère les réservations
#   - /api/reservations/<id> (DELETE)     → Annule une réservation
#
# 🩹 Nettoyage automatique des réservations
#   - clean_old_pending_reservations()        → Supprime après 24h
#   - /admin/clean-pending                    → Route admin
#   - schedule_cleaning_task()                → Thread automatique
# =========================================

# ============================
# 🚀 Initialisation des extensions Flask
# ============================
import sqlite3
import logging
import traceback
import stripe
import os
import threading
import time
from flask_cors import CORS
from flask_mail import Mail, Message
from flask import Flask, flash, g, request, jsonify, redirect, render_template, render_template_string
from appInscription import inscription_bp, init_inscription_extensions
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


# ============================
# 🔐 Chargement des variables d’environnement
# ============================
load_dotenv("securite_mdp.env")
stripe_public_key = os.getenv("STRIPE_PUBLIC_KEY")
print("🔑 Clé publique Stripe (test) chargée :", "OK" if stripe_public_key else "Non trouvée")


# ============================
# 📁 Définition du chemin absolu de la base de données
# ============================
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, 'hotels.db')


# ============================
# 🛠️ Initialisation manuelle SQLAlchemy (hors Flask-SQLAlchemy)
# ============================
engine = create_engine(f"sqlite:///{db_path}")
Session = sessionmaker(bind=engine)
db_session = Session()


# ============================
# 🔧 Initialisation de l'application Flask
# ============================ 
app = Flask(__name__, static_folder="../../static", template_folder="../../Frontend/templates")  # Chemin relatif vers les templates
CORS(app)


# ============================
# 🔧 Initialisation de l'application Flask-mail
# ============================ 
mail = Mail(app)
mail.init_app(app)


# ============================
# 🛠️ Configuration de la base de données pour SQLAlchemy
# ============================
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False


# ============================
# 🛠️ Configuration Flask-Mail 
# ============================
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_USERNAME')


# ============================
# 🧩 Initialisation des extensions liées à l'inscription
# ============================
init_inscription_extensions(app)


# ============================
# 📌 Enregistrement du Blueprint d'inscription
# ============================
app.register_blueprint(inscription_bp)


# ============================
# 🔧 Configuration Stripe
# ============================            
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
app.secret_key = os.getenv("FLASK_SECRET_KEY", "justdreams_secret_123")


# ============================
# 🔧 Connexion à la base de données SQLite
# ============================
# Récupère ou initialise une connexion à la base de données SQLite
def get_db_connection():
    if not hasattr(g, 'sqlite_db'):  # Vérifier si la connexion à la DB existe déjà
        g.sqlite_db = sqlite3.connect('hotels.db')  # Ouvrir une nouvelle connexion à la DB
        g.sqlite_db.row_factory = sqlite3.Row  # Permet de récupérer les résultats sous forme de dictionnaire
    return g.sqlite_db  # Retourner la connexion à la DB


# ============================
# 🔧 Fermeture de la connexion à la base de données SQLite
# ============================
@app.teardown_appcontext
def close_db_connection(exception):
    if hasattr(g, 'sqlite_db'):  # Vérifier si la connexion à la DB existe
        g.sqlite_db.close()  # Fermer la connexion à la base de données


# ============================
# 🌐 Routes HTML de base
# ============================
# Affiche la page d'accueil
@app.route('/')
def home():
    return render_template('index.html')

# Affiche la page de paiement
@app.route('/paiement')
def paiement():
    public_key = os.getenv("STRIPE_PUBLIC_KEY")
    return render_template('paiement.html', stripe_public_key=public_key)

@app.route("/stripe_config.js")
def serve_stripe_config():
    return render_template("JS/stripe_config.js.jinja", stripe_public_key=os.getenv("STRIPE_PUBLIC_KEY")), 200, {
        "Content-Type": "application/javascript"
    }

@app.route('/resetPassword')
def reset_password_form():
    return render_template('resetPassword.html')

@app.route("/mes-reservations")
def mes_reservations_page():
    return render_template("mesReservations.html")


# ============================
# 🏨 Route HTML pour pages dynamiques hotel.html et reservations.html (avec données) 
# ============================

# Affiche hotel.html avec les filtres et les avis passés depuis index.html
@app.route('/hotel')
def hotel():
    hotel_id = request.args.get("hotel_id")
    filters = {
        "destination": request.args.get("destination", ""),
        "start_date": request.args.get("start_date", ""),
        "end_date": request.args.get("end_date", ""),
        "adults": request.args.get("adults", "1"),
        "children": request.args.get("children", "0"),
        "pets": request.args.get("pets", "0")
    }

    reviews = []
    if hotel_id:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT r.rating, r.comment, r.date_posted, u.first_name, u.name
            FROM reviews r
            JOIN user u ON r.user_id = u.id_user
            WHERE r.hotel_id = ?
            ORDER BY r.date_posted DESC
        """, (hotel_id,))
        reviews = [{
            "first_name": row["first_name"],
            "last_name": row["name"],
            "rating": row["rating"],
            "comment": row["comment"],
            "date_posted": row["date_posted"]
        } for row in cursor.fetchall()]
        conn.close()

    print("📌 Filtres transmis à hotel.html :", filters)

    return render_template('hotel.html', reviews=reviews, **filters)

# Affiche la page des réservations avec les infos d'un hôtel, une map interactive et ses avis
@app.route('/reservations')
def reservation():
    hotel = {
        "name": request.args.get("name"),
        "stars": request.args.get("stars", type=int),
        "rating": request.args.get("rating"),
        "equipments": request.args.get("equipments"),
        "price": request.args.get("price"),
        "address": request.args.get("address", "Adresse inconnue"),  # ✅ Ajout de l'adresse
        "description": request.args.get("description", "Aucune description disponible."),  # ✅ Ajout de la description
        "lat": request.args.get("lat", type=float),
        "lng": request.args.get("lng", type=float),
        "id": request.args.get("hotel_id")
    }
    reviews = []
    if hotel["id"]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT r.rating, r.comment, r.date_posted, u.first_name, u.name
            FROM reviews r
            JOIN user u ON r.user_id = u.id_user
            WHERE r.hotel_id = ?
            ORDER BY r.date_posted DESC
        """, (hotel["id"],))
        reviews = [{
            "first_name": row["first_name"],
            "last_name": row["name"],
            "rating": row["rating"],
            "comment": row["comment"],
            "date_posted": row["date_posted"]
        } for row in cursor.fetchall()]
        conn.close()

    return render_template('reservations.html', hotel=hotel, reviews=reviews)


# ============================
# 🏨 Gestion de l inscription a la Newsletters 
# ============================
@app.route("/subscribe", methods=["POST"])
def subscribe():
    email = request.form.get("email")

    if not email:
        flash("Adresse email invalide.", "error")
        return redirect("/")

    try:
        with sqlite3.connect("hotels.db") as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT OR IGNORE INTO newsletter_subscriptions (email) VALUES (?)",
                (email,)
            )
            conn.commit()

        # 💌 Email de confirmation
        msg = Message(
            subject="✅ Merci pour votre inscription à la newsletter JustDreams",
            recipients=[email],
            html="""
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #1a73e8;">Bienvenue dans l'univers JustDreams ✨</h2>
                    <p>Merci pour votre inscription à notre newsletter !</p>
                    <p>Vous recevrez bientôt des offres exclusives, des bons plans voyages et plein de surprises 🧳</p>
                    <p>À très vite 🌍</p>
                    <br>
                    <p style="font-size: 14px; color: #555;">L’équipe JustDreams</p>
                </div>
            """,
            reply_to="support@justdreams06.com"
        )

        mail.send(msg)
        flash("Inscription réussie. Un email de confirmation vous a été envoyé !", "success")

    except Exception as e:
        print("❌ Erreur newsletter :", e)
        flash("Une erreur est survenue lors de l'inscription.", "error")

    return redirect("/")


# ============================
# 🔍 Endpoint pour l'autocomplétion des destinations (pour toutes les pages)
# ============================
@app.route("/autocomplete", methods=["GET"])
def autocomplete():
    query = request.args.get("query", "").lower()
    if not query:
        return jsonify([])

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT DISTINCT name FROM cities WHERE LOWER(name) LIKE ?", (f"%{query}%",))
    city_results = [row["name"] for row in cursor.fetchall()]

    cursor.execute("SELECT DISTINCT name FROM countries WHERE LOWER(name) LIKE ?", (f"%{query}%",))
    country_results = [row["name"] for row in cursor.fetchall()]

    cursor.execute("SELECT DISTINCT continent FROM countries WHERE LOWER(continent) LIKE ?", (f"%{query}%",))
    continent_results = [row["continent"] for row in cursor.fetchall()]

    conn.close()
    return jsonify(continent_results + country_results + city_results)


# ============================
# 📦 Récupère tous les hôtels avec leurs données et leurs avis
# ============================
@app.route('/hotels', methods=['GET'])
def get_hotels():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT hotels.*, cities.name AS city, hotels.address AS full_address, 
               hotels.latitude, hotels.longitude
        FROM hotels
        JOIN cities ON hotels.city_id = cities.id
        """)
        hotels = []
        for row in cursor.fetchall():
            hotel_id = row["id"]

            # ✅ Récupérer les avis pour chaque hôtel
            cursor.execute("""
            SELECT r.rating, r.comment, r.date_posted, u.first_name, u.name
            FROM reviews r
            JOIN user u ON r.user_id = u.id_user
            WHERE r.hotel_id = ?
            ORDER BY r.date_posted DESC
            """, (hotel_id,))

            reviews = [{
                "first_name": review["first_name"],
                "last_name": review["name"],
                "rating": review["rating"],
                "comment": review["comment"],
                "date_posted": review["date_posted"]
            } for review in cursor.fetchall()]

            hotels.append ({
                "id": row["id"],
                "name": row["name"],
                "stars": row["stars"],
                "price_per_night": row["price_per_night"],
                "hotel_rating": row["hotel_rating"],
                "city": row["city"],
                "address": row["full_address"] if row["full_address"] not in (None, "", "null") else "Adresse inconnue",
                "description": row["description"],
                "latitude": row["latitude"],
                "longitude": row["longitude"],
                "image": f"http://127.0.0.1:5003/static/Image/{row['image_url']}" if row["image_url"] else "http://127.0.0.1:5003/static/Image/default.jpg",
                "equipments": [
                    equip for equip in [
                        "Parking" if row["parking"] else None,
                        "Restaurant" if row["restaurant"] else None,
                        "Piscine" if row["piscine"] else None,
                        "Animaux admis" if row["pets_allowed"] else None,
                        "Salle de sport" if row["gym"] else None,
                        "Spa" if row["spa"] else None,
                        "Wi-Fi gratuit" if row["free_wifi"] else None,
                        "Climatisation" if row["air_conditioning"] else None,
                        "Borne recharge" if row["ev_charging"] else None,
                        "Accès PMR" if row["wheelchair_accessible"] else None,
                        "Machine à laver" if row["washing_machine"] else None,
                        "Kitchenette" if row["kitchenette"] else None
                    ] if equip is not None  # ✅ Supprime les valeurs None
                ],
                "reviews": reviews  # ✅ Ajout des avis
            })
    print(f"📌 Nombre d'hôtels envoyés à `hotel.js`: {len(hotels)}")
    conn.close()
    return jsonify(hotels)


# ============================
# 🔍 Recherche d'hôtels selon destination, dates, invités (pour toutes les pages)
# ============================
@app.route("/recherche", methods=["POST"])
def recherche_hotels():
    try:
        if request.content_type != "application/json":
            return jsonify({"error": "Content-Type must be application/json"}), 400

        data = request.json
        print("🔍 Filtres reçus pour la recherche :", data)

        destination = data.get("destination")
        start_date = data.get("start_date")
        end_date = data.get("end_date")
        adults = data.get("adults")
        children = data.get("children")
        pets = data.get("pets")

        try:
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
            end_date = datetime.strptime(end_date, "%Y-%m-%d").date()
        except Exception as e:
            return jsonify({"error": "Format de date invalide. Attendu: YYYY-MM-DD"}), 400

        if start_date > end_date:
            return jsonify({"error": "La date de début doit être avant la date de fin"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
            SELECT hotels.*, cities.name AS city, countries.name AS country
            FROM hotels
            JOIN cities ON hotels.city_id = cities.id
            JOIN countries ON cities.country_id = countries.id
            WHERE hotels.adults_per_room >= ?
              AND hotels.children_per_room >= ?
              AND hotels.pets_allowed = ?
              AND NOT EXISTS (
                SELECT 1 FROM reservations res
                WHERE res.hotel_id = hotels.id
                  AND (
                    (res.checkin <= ? AND res.checkout > ?)
                    OR (res.checkin < ? AND res.checkout >= ?)
                    OR (res.checkin >= ? AND res.checkout <= ?)
                  )
              )
        """
        params = [adults, children, pets, end_date, start_date, end_date, start_date, start_date, end_date]

        if destination:
            query += " AND (cities.name LIKE ? OR countries.name LIKE ? OR countries.continent LIKE ?)"
            destination_like = f"%{destination}%"
            params.extend([destination_like, destination_like, destination_like])

        print("🧐 Requête SQL exécutée :", query)
        print("📌 Paramètres SQL :", params)
        print("🟢 ROUTE /recherche bien mise à jour")
        cursor.execute(query, params)
        hotels = cursor.fetchall()

        unique_hotels = {}  # ✅ Pour éviter les doublons

        for hotel in hotels:
            hotel_id = hotel["id"]

            if hotel_id not in unique_hotels:
                # ✅ Récupérer les avis
                cursor.execute("""
                    SELECT r.rating, r.comment, r.date_posted, u.first_name, u.name
                    FROM reviews r
                    JOIN user u ON r.user_id = u.id_user
                    WHERE r.hotel_id = ?
                    ORDER BY r.date_posted DESC
                """, (hotel_id,))
                reviews = [{
                    "first_name": review["first_name"],
                    "last_name": review["name"],
                    "rating": review["rating"],
                    "comment": review["comment"],
                    "date_posted": review["date_posted"]
                } for review in cursor.fetchall()]

                unique_hotels[hotel_id] = {
                    "id": hotel_id,
                    "name": hotel["name"],
                    "stars": hotel["stars"],
                    "hotel_rating": hotel["hotel_rating"],
                    "price_per_night": hotel["price_per_night"],
                    "city": hotel["city"],
                    "country": hotel["country"],
                    "available_from": hotel["available_from"],
                    "available_to": hotel["available_to"],
                    "description": hotel["description"],
                    "address": hotel["address"] if hotel["address"] not in (None, "", "null") else "Adresse inconnue",
                    "latitude": hotel["latitude"],
                    "longitude": hotel["longitude"],
                    "image": f"/static/Image/{hotel['image_url']}" if hotel["image_url"] else "/static/Image/default.jpg",
                    "equipments": [
                        equip for equip in [
                            "Parking" if hotel["parking"] else None,
                            "Restaurant" if hotel["restaurant"] else None,
                            "Piscine" if hotel["piscine"] else None,
                            "Animaux admis" if hotel["pets_allowed"] else None,
                            "Salle de sport" if hotel["gym"] else None,
                            "Spa" if hotel["spa"] else None,
                            "Wi-Fi gratuit" if hotel["free_wifi"] else None,
                            "Climatisation" if hotel["air_conditioning"] else None,
                            "Borne recharge" if hotel["ev_charging"] else None,
                            "Accès PMR" if hotel["wheelchair_accessible"] else None,
                            "Machine à laver" if hotel["washing_machine"] else None,
                            "Kitchenette" if hotel["kitchenette"] else None
                        ] if equip is not None
                    ],
                    "reviews": reviews
                }

        conn.close()
        return jsonify(list(unique_hotels.values()))

    except Exception as e:
        print("Erreur lors de l'exécution SQL :", str(e))
        return jsonify({'error': str(e)}), 500

# ============================
# 🔍 Filtres avancés sur les hôtels (prix, équipements, etc.) pour la page hotel.html
# ============================
@app.route('/filter_hotels', methods=['POST'])
def filter_hotels():
    print("🚀 Route '/filter_hotels' appelée !")
    filters = request.json
    print("📌 Filtres reçus :", filters)  # Ajoute ce log pour voir ce qui arrive

    try:
        filters = request.json
        stars = filters.get('stars', [])
        min_price = filters.get('min_price', None)  # Prix minimum
        max_price = filters.get('max_price', None)  # Prix maximum
        max_rooms = filters.get('max_rooms', None)
        hotel_name = filters.get('hotel_name', None)
        kitchenette = filters.get('kitchenette', None)
        city_name = filters.get('city_name', None)  # Récupère le nom de la ville
        parking = filters.get('parking', None)  # Récupération du filtre parking
        restaurant = filters.get('restaurant', None)  # Récupération du filtre restaurant
        piscine = filters.get('piscine', None)  # Récupération du filtre piscine
        gym = filters.get('gym', None)
        spa = filters.get('spa', None)
        pets_allowed = filters.get('pets_allowed', None)
        free_wifi = filters.get('free_wifi', None)
        air_conditioning = filters.get('air_conditioning', None)
        ev_charging = filters.get('ev_charging', None)
        wheelchair_accessible = filters.get('wheelchair_accessible', None)
        washing_machine = filters.get('washing_machine', None)
        meal_plan = filters.get('meal_plan', [])
        hotel_rating = filters.get('hotel_rating', [])

        query = """
        SELECT hotels.*, cities.name AS city 
        FROM hotels
        JOIN cities ON hotels.city_id = cities.id
        """
        params = []
        conditions = []

        if stars:
            conditions.append(f"stars IN ({','.join(['?'] * len(stars))})")
            params.extend(stars)

        if min_price is not None:
            conditions.append("price_per_night >= ?")
            params.append(min_price)

        if max_price is not None:
            conditions.append("price_per_night <= ?")
            params.append(max_price)

        if max_rooms is not None:
            conditions.append("rooms <= ?")
            params.append(max_rooms)

        if hotel_name:
            conditions.append("hotels.name LIKE ?")
            params.append(f"%{hotel_name}%")  # Recherche partielle

        if kitchenette is not None:
            conditions.append("hotels.kitchenette = ?")
            params.append(kitchenette)

        if city_name:
            conditions.append("cities.name LIKE ?")  # Recherche partielle sur le nom de la ville
            params.append(f"%{city_name}%")  
        
        if parking:  
            conditions.append("hotels.parking = ?")
            params.append(parking)

        if restaurant:  
            conditions.append("hotels.restaurant = ?")
            params.append(restaurant)
        
        if piscine:  
            conditions.append("hotels.piscine = ?")
            params.append(piscine)
        
        if gym:  
            conditions.append("hotels.gym = ?")
            params.append(gym)

        if spa:  
            conditions.append("hotels.spa = ?")
            params.append(spa)

        if pets_allowed:  
            conditions.append("hotels.pets_allowed = ?")
            params.append(pets_allowed)
        
        if free_wifi:  
            conditions.append("hotels.free_wifi = ?")
            params.append(free_wifi)

        if air_conditioning:  
            conditions.append("hotels.air_conditioning = ?")
            params.append(air_conditioning)

        if ev_charging:  
            conditions.append("hotels.ev_charging = ?")
            params.append(ev_charging)
        
        if wheelchair_accessible:  
            conditions.append("hotels.wheelchair_accessible = ?")
            params.append(wheelchair_accessible)

        if washing_machine:  
            conditions.append("hotels.washing_machine = ?")
            params.append(washing_machine)

        if meal_plan:
            conditions.append(f"hotels.meal_plan IN ({','.join(['?'] * len(meal_plan))})")
            params.extend(meal_plan)

        if hotel_rating:
            try:
                # ✅ Vérifier que hotel_rating est bien une liste et convertir en float
                hotel_rating = [float(r) for r in hotel_rating if isinstance(r, (int, float, str)) and str(r).replace('.', '', 1).isdigit()]

                if hotel_rating:
                    # ✅ Filtrer les hôtels ayant une note supérieure ou égale à la plus basse note cochée
                    conditions.append("hotels.hotel_rating >= ?")
                    params.append(min(hotel_rating))
            except ValueError:
                print("⚠️ Erreur conversion hotel_rating :", hotel_rating)
        
        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        print("Requête SQL exécutée :", query)
        print("Paramètres SQL :", params)
        
        with get_db_connection() as conn:
            cursor = conn.execute(query, params)
            hotels = cursor.fetchall()
        
        result = []
        for hotel in hotels:
            hotel_id = hotel["id"]

            # ✅ Récupérer les avis pour chaque hôtel
            cursor.execute("""
            SELECT r.rating, r.comment, r.date_posted, u.first_name, u.name
            FROM reviews r
            JOIN user u ON r.user_id = u.id_user
            WHERE r.hotel_id = ?
            ORDER BY r.date_posted DESC
            """, (hotel_id,))

            reviews = [{
                "first_name": review["first_name"],
                "last_name": review["name"],
                "rating": review["rating"],
                "comment": review["comment"],
                "date_posted": review["date_posted"]
            } for review in cursor.fetchall()]

            result.append({
                "id": hotel["id"],
                "name": hotel["name"],
                "stars": hotel["stars"],
                "price_per_night": hotel["price_per_night"],
                "hotel_rating": hotel["hotel_rating"],
                "city": hotel["city"],
                "description":hotel["description"],
                "address": hotel["address"] if hotel["address"] not in (None, "", "null") else "Adresse inconnue",
                "latitude": hotel["latitude"],
                "longitude": hotel["longitude"],
                "image": f"/static/Image/{hotel['image_url']}" if hotel["image_url"] else "/static/Image/default.jpg",
                "equipments": [
                    equip for equip in [
                        "Parking" if hotel["parking"] else None,
                        "Restaurant" if hotel["restaurant"] else None,
                        "Piscine" if hotel["piscine"] else None,
                        "Animaux admis" if hotel["pets_allowed"] else None,
                        "Salle de sport" if hotel["gym"] else None,
                        "Spa" if hotel["spa"] else None,
                        "Wi-Fi gratuit" if hotel["free_wifi"] else None,
                        "Climatisation" if hotel["air_conditioning"] else None,
                        "Borne recharge" if hotel["ev_charging"] else None,
                        "Accès PMR" if hotel["wheelchair_accessible"] else None,
                        "Machine à laver" if hotel["washing_machine"] else None,
                        "Kitchenette" if hotel["kitchenette"] else None
                    ] if equip is not None  # ✅ Supprime les valeurs None
                ],
                    "reviews": reviews  # ✅ Ajout des avis
            })
        
        conn.close()
        return jsonify(result)

    except Exception as e:
        print("Erreur lors de l'exécution SQL :", str(e))
        return jsonify({'error': str(e)}), 500


# ============================
# 💬 Récupère les avis d'un hôtel triés par note ou date
# ============================
@app.route('/get_reviews', methods=['GET'])
def get_reviews():
    """Récupère les avis d'un hôtel donné, triés par date ou par note"""
    hotel_id = request.args.get("hotel_id")
    sort_by = request.args.get("sort_by", "date")  # Par défaut, trie par date

    if not hotel_id:
        return jsonify({"error": "ID de l'hôtel manquant"}), 400

    conn = get_db_connection()
    conn.row_factory = sqlite3.Row  # ✅ Ajout de la row_factory ici
    cursor = conn.cursor()

    # ✅ Jointure entre reviews et user pour récupérer les noms
    if sort_by == "note":
        query = """
        SELECT r.rating, r.comment, r.date_posted, u.first_name, u.name
        FROM reviews r
        JOIN user u ON r.user_id = u.id_user
        WHERE r.hotel_id = ?
        ORDER BY r.rating DESC
        """
    else:
        query = """
        SELECT r.rating, r.comment, r.date_posted, u.first_name, u.name
        FROM reviews r
        JOIN user u ON r.user_id = u.id_user
        WHERE r.hotel_id = ?
        ORDER BY r.date_posted DESC
        """

    cursor.execute(query, (hotel_id,))
    reviews = [{
        "first_name": row["first_name"],
        "name": row["name"],
        "rating": row["rating"],
        "comment": row["comment"],
        "date_posted": row["date_posted"]
    } for row in cursor.fetchall()]
    
    conn.close()
    return jsonify(reviews)


# ============================
# 🏨 Récupère le nom d'un hôtel à partir de son ID
# ============================
@app.route('/get_hotel_name')
def get_hotel_name():
    hotel_id = request.args.get("hotel_id")
    if not hotel_id:
        return jsonify({"error": "ID d'hôtel manquant"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM hotels WHERE id = ?", (hotel_id,))
    hotel = cursor.fetchone()
    conn.close()

    if hotel:
        return jsonify({"name": hotel[0]})
    else:
        return jsonify({"error": "Hôtel non trouvé"}), 404
    

# ============================
# 🏨 Récupère le prix par nuit nuit d'un hôtel
# ============================    
@app.route('/get_price_per_night/<int:hotel_id>', methods=['GET'])
def get_price_per_night(hotel_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT price_per_night FROM hotels WHERE id = ?", (hotel_id,))
    result = cursor.fetchone()
    conn.close()

    if result:
        return jsonify({"price_per_night": result[0]})
    else:
        return jsonify({"error": "Hôtel non trouvé"}), 404


# ============================
# 📩 Crée une réservation via API avec données complètes utilisateur
# ============================
@app.route("/api/reservations", methods=["POST"])
def create_reservation():
    print("ℹ️ Endpoint /api/reservations appelé mais non utilisé.")
    return jsonify({"message": "Endpoint désactivé. Utilisez Stripe Webhook pour insérer la réservation."}), 200

    # data = request.json
    # print("📩 Données reçues :", data)  # 🔍 Pour le debug

    # hotel_id = data.get("hotel_id")
    # checkin = data.get("checkin")
    # checkout = data.get("checkout")
    # guests = data.get("guests")
    # adults = data.get("adults", 1)
    # children = data.get("children", 0)

    # # 🔽 On récupère les nouveaux champs à insérer
    # first_name = data.get("first_name")
    # gender = data.get("gender")
    # phone = data.get("phone")
    # stripe_customer_id = data.get("stripe_customer_id")
    # user_name = data.get("user_name")
    # email = data.get("email")
    # user_id = data.get("user_id")
    # total_price = data.get("total_price")

    # if not hotel_id or not checkin or not checkout or not guests or not adults:
    #     return jsonify({"error": "Tous les champs sont obligatoires"}), 400

    # try:
    #     conn = get_db_connection()
    #     cursor = conn.cursor()

    #     print(f"📝 Tentative de réservation : Hôtel {hotel_id} | {checkin} -> {checkout} | {guests} voyageurs")

    #     now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    #     # Mise à jour de l'insertion pour inclure le user_id
    #     cursor.execute("""
    #         INSERT INTO reservations (
    #             hotel_id, user_id, user_name, email, checkin, checkout, guests, adults, children, 
    #             first_name, gender, phone, stripe_customer_id, status, created_at, total_price
    #         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    #     """, (
    #         hotel_id, user_id, user_name, email, checkin, checkout,
    #         guests, adults, children, first_name, gender, phone, stripe_customer_id, now, total_price
    #     ))

    #     conn.commit()
    #     reservation_id = cursor.lastrowid
    #     conn.close()

    #     print(f"✅ Réservation confirmée (ID: {reservation_id})")

    #     return jsonify({
    #         "reservation_id": reservation_id,
    #         "hotel_id": hotel_id,
    #         "checkin": checkin,
    #         "checkout": checkout,
    #         "guests": guests,
    #         "adults": adults,
    #         "children": children,
    #         "total_price": total_price
    #     })

    # except Exception as e:
    #     print(f"❌ Erreur lors de la réservation : {str(e)}")
    #     return jsonify({"error": str(e)}), 500
    

# ============================
# 💾 Création d'un webhook Stripe 
# ============================   
@app.route("/stripe-webhook", methods=["POST"])
def stripe_webhook():
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except ValueError as e:
        print("❌ Erreur payload webhook :", e)
        return "Invalid payload", 400
    except stripe.error.SignatureVerificationError as e:
        print("❌ Erreur signature webhook :", e)
        return "Invalid signature", 400

    # 🎯 Paiement réussi
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        customer_id = session["customer"]
        metadata = session.get("metadata", {})

        print(f"✅ Paiement reçu pour customer_id : {customer_id}")
        print("🧾 Metadata reçues :", metadata)

        # ✅ Vérifie qu'on a bien les metadata attendues
        if not metadata:
            print("❌ Aucun metadata reçu dans la session Stripe.")
            return jsonify({"error": "Metadata manquants dans le webhook Stripe"}), 400

        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

            cursor.execute("""
                INSERT INTO reservations (
                    hotel_id, user_id, user_name, email, checkin, checkout, guests, adults, children, 
                    first_name, gender, phone, stripe_customer_id, status, created_at, total_price
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?, ?)
            """, (
                metadata.get("hotel_id"),
                int(metadata["user_id"]) if metadata.get("user_id") and metadata.get("user_id").isdigit() else None,
                metadata.get("user_name"),
                metadata.get("email"),
                metadata.get("checkin"),
                metadata.get("checkout"),
                metadata.get("guests"),
                metadata.get("adults"),
                metadata.get("children"),
                metadata.get("first_name"),
                metadata.get("gender"),
                metadata.get("phone"),
                customer_id,
                now,
                metadata.get("total_price")
            ))

            conn.commit()
            reservation_id = cursor.lastrowid
            print(f"💾 Réservation insérée en base (ID: {reservation_id})")
            print("📦 Détails de la réservation insérée :", metadata)

            # Email
            cursor.execute("SELECT name FROM hotels WHERE id = ?", (metadata.get("hotel_id"),))
            hotel = cursor.fetchone()
            hotel_name = hotel[0] if hotel else "Votre hôtel"
            conn.close()

            template_path = os.path.join(
                os.path.dirname(__file__),
                "..", "..", "Frontend", "templates", "email_templates", "confirmation.html"
            )

            with open(template_path, encoding="utf-8") as f:
                html_template = f.read()

            html_email = render_template_string(
                html_template,
                first_name=metadata.get("first_name"),
                hotel_name=hotel_name,
                checkin=metadata.get("checkin"),
                checkout=metadata.get("checkout"),
                guests=metadata.get("guests"),
                total_price=metadata.get("total_price")
            )

            msg = Message(
                "🌟 Confirmation de votre réservation JustDreams",
                recipients=[metadata.get("email")],
                html=html_email,
                reply_to="support@justdreams06.com"  # 💌 Suggestion : adresse de réponse
            )

            print("📧 Envoi du mail à :", metadata.get("email"))
            try:
                mail.send(msg)
                print("✅ Mail envoyé avec succès")
            except Exception as e:
                print("❌ Erreur lors de l’envoi du mail :", e)
                traceback.print_exc()

        except Exception as e:
            print("❌ Erreur lors de l’insertion post-paiement :", e)
            traceback.print_exc()
        
        return jsonify({'status': 'success'}), 200
    return '', 200

# ============================
# 💳 Crée une session de paiement Stripe
# ============================
@app.route('/create-checkout-session', methods=['POST'])
def create_checkout_session():
    try:
        data = request.json
        print("📩 Données reçues pour Stripe :", data)
        hotel_id = int(data.get("hotelId"))
        guests = int(data.get("guests", 1))  # Valeur par défaut
        checkin = data.get("checkin")
        checkout = data.get("checkout")

        if not checkin or not checkout:
            return jsonify({"error": "checkin ou checkout manquant"}), 400

        user_id = data.get("user_id")

        # 🕓 Calcul du nombre de nuits
        nights = (datetime.strptime(checkin, "%Y-%m-%d") - datetime.strptime(checkout, "%Y-%m-%d")).days
        nights = abs(nights) if nights > 0 else 1  # Sécurité pour éviter 0 ou négatif

        # 💰 Récupérer le prix par nuit
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT price_per_night FROM hotels WHERE id = ?", (hotel_id,))
        result = cursor.fetchone()

        if not result:
            conn.close()
            return jsonify({"error": "Hôtel introuvable"}), 404

        price_per_night = result[0]
        amount = int(price_per_night * nights * 100)  # en centimes
        print(f"💰 Calcul montant total : {amount} centimes ({price_per_night}€/nuit * {nights} nuit(s))")

        # 🔍 Vérifier si l'utilisateur a déjà un stripe_customer_id
        cursor.execute("SELECT email, first_name, name, stripe_customer_id FROM user WHERE id_user = ?", (user_id,))
        user_row = cursor.fetchone()

        if not user_row:
            conn.close()
            return jsonify({"error": "Utilisateur introuvable"}), 404

        email, first_name, name, stripe_customer_id = user_row

        if stripe_customer_id:
            customer_id = stripe_customer_id
            print(f"✅ Client Stripe déjà existant : {customer_id}")
        else:
            print("➕ Création d’un nouveau client Stripe...")
            customer = stripe.Customer.create(
                email=email,
                name=f"{first_name} {name}"
            )
            customer_id = customer.id
            print(f"✅ Nouveau client Stripe créé : {customer_id}")

            # 🧠 Mise à jour dans la table user
            cursor.execute(
                "UPDATE user SET stripe_customer_id = ? WHERE id_user = ?",
                (customer_id, user_id)
            )
            conn.commit()

        conn.close()

        # 💳 Création session Stripe Checkout
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            customer=customer_id,
            line_items=[{
                'price_data': {
                    'currency': 'eur',
                    'product_data': {'name': f"Hôtel {hotel_id}"},
                    'unit_amount': amount,
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url="http://127.0.0.1:5003/success",
            cancel_url="http://127.0.0.1:5003/cancel",
            metadata={
                "hotel_id": str(hotel_id),
                "checkin": checkin,
                "checkout": checkout,
                "guests": str(guests),
                "adults": str(data.get("adults", 1)),
                "children": str(data.get("children", 0)),
                "first_name": data.get("firstName"),
                "gender": data.get("gender"),
                "phone": data.get("phone"),
                "user_name": data.get("userName"),
                "email": data.get("email"),
                "user_id": str(user_id),
                "total_price": str(amount / 100)
            }
        )

        print(f"✅ Session Stripe créée : {checkout_session.url}")
        return jsonify({"url": checkout_session.url})

    except stripe.error.StripeError as e:
        print(f"❌ Stripe Error : {str(e)}")
        return jsonify({"error": "Erreur Stripe : " + str(e)}), 500

    except Exception as e:
        print(f"❌ Erreur serveur : {str(e)}")
        return jsonify({"error": "Erreur serveur : " + str(e)}), 500


# ============================
# ✅ Affiche une page de succès après paiement Stripe
# ============================
@app.route('/success')
def success():
    return """
    <html>
        <head><title>Paiement réussi</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1>✅ Paiement réussi !</h1>
            <p>Merci pour votre réservation.</p>
            <a href="/" style="text-decoration: none; color: blue;">← Retour à l'accueil</a>
        </body>
    </html>
    """

# ============================
# ❌ Affiche une page d’échec après annulation Stripe
# ============================
@app.route('/cancel')
def cancel():
    return """
    <html>
        <head><title>Paiement echec</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1>❌ Paiement echec !</h1>
            <p>Merci de reessayer.</p>
            <a href="/" style="text-decoration: none; color: blue;">← Retour à l'accueil</a>
        </body>
    </html>
    """


# ============================
# 👤 Route admin pr vois resa "pending supprimées"
# ============================
@app.route('/admin/clean-pending', methods=['GET'])
def admin_clean_pending():
    deleted = clean_old_pending_reservations()

    if deleted == -1:
        return jsonify({"success": False, "message": "Erreur lors du nettoyage"}), 500
    return jsonify({
        "success": True,
        "message": f"{deleted} réservation(s) 'pending' supprimée(s) avec succès."
    }), 200


# ============================
# 👤 Affiche les reservations de l utilisateur
# ============================
@app.route("/api/mes-reservations/<int:user_id>")
def get_user_reservations(user_id):
    with sqlite3.connect("hotels.db") as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("""
            SELECT r.id AS reservation_id, h.name AS hotel_name, h.image_url,
                   r.checkin, r.checkout, r.guests, r.total_price
            FROM reservations r
            JOIN hotels h ON r.hotel_id = h.id
            WHERE r.user_id = ? AND r.status != 'cancelled'
            ORDER BY r.checkin DESC
        """, (user_id,))
        reservations = []
        for row in cursor.fetchall():
            image_url = row["image_url"]
            full_image_url = f"/static/Image/{image_url}" if image_url else "/static/Image/default.jpg"
            reservations.append({
                "reservation_id": row["reservation_id"],
                "hotel_name": row["hotel_name"],
                "image_url": full_image_url,  # ✅ chemin complet
                "checkin": row["checkin"],
                "checkout": row["checkout"],
                "guests": row["guests"],
                "total_price": row["total_price"]
            })
    return jsonify(reservations)


# ============================
# 👤 Annulation des réservations par l'utilisateur
# ============================
@app.route("/api/reservations/<int:reservation_id>", methods=["DELETE"])
def cancel_reservation(reservation_id):
    try:
        with sqlite3.connect("hotels.db") as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            # Vérifie si la réservation existe
            cursor.execute("""
                SELECT r.*, h.name AS hotel_name
                FROM reservations r
                JOIN hotels h ON r.hotel_id = h.id
                WHERE r.id = ?
            """, (reservation_id,))
            reservation = cursor.fetchone()

            if reservation is None:
                return jsonify({"error": "Réservation introuvable"}), 404

            # Met à jour le statut et ajoute la date d'annulation
            now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute("""
                UPDATE reservations
                SET status = 'cancelled', cancelled_at = ?
                WHERE id = ?
            """, (now, reservation_id))
            conn.commit()

            # 🔐 Sécurisation des champs potentiellement absents
            first_name = reservation["first_name"] or "Client"
            email = reservation["email"] or "noreply@justdreams.fr"

            # 🔄 Charge le template HTML d’annulation
            template_path = os.path.join(
                os.path.dirname(__file__),
                "..", "..", "Frontend", "templates", "email_templates", "cancelConfirmation.html"
            )

            print("📨 Email du client :", email)

            with open(template_path, encoding="utf-8") as f:
                html_template = f.read()
            print("📄 Template HTML chargé avec succès.")

            html_email = render_template_string(
                html_template,
                first_name=first_name,
                hotel_name=reservation["hotel_name"],
                checkin=reservation["checkin"],
                checkout=reservation["checkout"],
                guests=reservation["guests"],
                total_price=reservation["total_price"],
                cancelled_at=now
            )

            # 📧 Prépare et envoie le mail
            msg = Message(
                subject="❌ Votre réservation JustDreams a été annulée",
                recipients=[email],
                html=html_email,
                reply_to="support@justdreams06.com"
            )

            try:
                mail.send(msg)
                print("📧 Email d'annulation envoyé avec succès.")
            except Exception as e:
                print("❌ Erreur lors de l’envoi de l'email d'annulation :", e)

            return jsonify({"message": "Réservation annulée"}), 200

    except Exception as e:
        print("❌ Erreur dans cancel_reservation :", e)
        return jsonify({"error": str(e)}), 500



# ============================
# 👤 Supprime les reservations statut "pending" automatiquement au bout de 24h
# ============================
def clean_old_pending_reservations():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        time_limit = datetime.now(timezone.utc) - timedelta(hours=24)
        formatted_limit = time_limit.strftime("%Y-%m-%d %H:%M:%S")

        print(f"🧹 Suppression des réservations 'pending' avant : {formatted_limit}")

        cursor.execute("""
            DELETE FROM reservations 
            WHERE status = 'pending' AND created_at <= ?
        """, (formatted_limit,))

        conn.commit()
        deleted_rows = cursor.rowcount
        print(f"✅ {deleted_rows} réservation(s) 'pending' supprimée(s)")
        conn.close()

        return deleted_rows

    except Exception as e:
        print("❌ Erreur dans clean_old_pending_reservations :", e)
        return -1  


# ============================
# 👤 Thread qui exécute le nettoyage toutes les 12h
# ============================
def schedule_cleaning_task(interval_seconds=43200):
    def run_task():
        while True:
            with app.app_context():  # ✅ Ajoute le contexte Flask ici
                print("⏳ Lancement de clean_old_pending_reservations() dans le thread...")
                clean_old_pending_reservations()
            time.sleep(interval_seconds)

    cleaning_thread = threading.Thread(target=run_task, daemon=True)
    cleaning_thread.start()
    print("🧹 Thread de nettoyage lancé !")


# ============================
# 🚀 Démarre le serveur Flask
# ============================
if __name__ == '__main__':
        schedule_cleaning_task()
        print("🚀 Flask démarre sur http://127.0.0.1:5003")
        app.run(host='0.0.0.0', port=5003, debug=True)