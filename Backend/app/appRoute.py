import sqlite3
import logging
import traceback
from flask import Flask, g, request, jsonify, render_template
from datetime import datetime

# Initialisation de l'application Flask
app = Flask(__name__, static_folder="../../static", template_folder="../../Frontend/templates")  # Chemin relatif vers les templates

# Fonction pour gérer la connexion à la base de données SQLite
def get_db_connection():
    if not hasattr(g, 'sqlite_db'):  # Vérifier si la connexion à la DB existe déjà
        g.sqlite_db = sqlite3.connect('hotels.db')  # Ouvrir une nouvelle connexion à la DB
        g.sqlite_db.row_factory = sqlite3.Row  # Permet de récupérer les résultats sous forme de dictionnaire
    return g.sqlite_db  # Retourner la connexion à la DB

# Fermeture de la connexion à la base de données quand l'application se termine
@app.teardown_appcontext
def close_db_connection(exception):
    if hasattr(g, 'sqlite_db'):  # Vérifier si la connexion à la DB existe
        g.sqlite_db.close()  # Fermer la connexion à la base de données

@app.route('/')
def home():
    return render_template('hotel.html')

@app.route('/index')
def index_page():
    return render_template('index.html')

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
        "lng": request.args.get("lng", type=float)
    }
    return render_template('reservations.html', hotel=hotel)  # Assure-toi que le fichier s'appelle bien reservations.html

# 🔹 ✅ Ajout de la route pour afficher hotel.html avec les filtres passés depuis index.html
@app.route('/hotel')
def hotel():
    """
    Affiche hotel.html avec les paramètres de recherche.
    """

    # ✅ Récupérer les filtres transmis depuis index.html
    filters = {
        "destination": request.args.get("destination", ""),
        "start_date": request.args.get("start_date", ""),
        "end_date": request.args.get("end_date", ""),
        "adults": request.args.get("adults", "1"),
        "children": request.args.get("children", "0"),
        "pets": request.args.get("pets", "0")
    }

    print("📌 Filtres transmis à hotel.html :", filters)

    # 📌 Passer ces filtres à hotel.html pour qu'il les utilise
    return render_template('hotel.html', **filters)

# 🔍 Autocomplétion pour les destinations (continent, pays, ville)
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

# 🔹 **Ajout de la route pour récupérer tous les hôtels avec leurs images**
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

        hotels = [{
            "id": row["id"],
            "name": row["name"],
            "stars": row["stars"],
            "price_per_night": row["price_per_night"],
            "hotel_rating": row["hotel_rating"],
            "city": row["city"],
            "address": row["full_address"] if "full_address" in row.keys() else "Adresse inconnue",
            "description": row["description"],
            "latitude": row["latitude"],
            "longitude": row["longitude"],
            # ✅ Corrige ici pour un chemin absolu
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
            ]
        } for row in cursor.fetchall()]
        return jsonify(hotels)

# 🔎 Recherche d'hôtels selon la destination, la période et le nombre de personnes
@app.route("/recherche", methods=["POST"])
def recherche_hotels():
    try:
        # ✅ Vérifie que la requête est bien en JSON
        if request.content_type != "application/json":
            return jsonify({"error": "Content-Type must be application/json"}), 

        data = request.json
        print("🔍 Filtres reçus pour la recherche :", data)  # Ajout d'un log
        
        destination = data.get("destination")
        start_date = data.get("start_date")
        end_date = data.get("end_date")
        adults = data.get("adults")
        children = data.get("children")
        pets = data.get("pets")

        # ✅ Vérification et conversion du format des dates
        try:
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
            end_date = datetime.strptime(end_date, "%Y-%m-%d").date()
        except Exception as e:
            return jsonify({"error": "Format de date invalide. Attendu: YYYY-MM-DD"}), 400

        # ✅ Vérifier que start_date est avant end_date
        if start_date > end_date:
            return jsonify({"error": "La date de début doit être avant la date de fin"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
        SELECT hotels.*, cities.name AS city, countries.name AS country
        FROM hotels
        JOIN cities ON hotels.city_id = cities.id
        JOIN countries ON cities.country_id = countries.id
        WHERE hotels.available_from <= ? AND hotels.available_to >= ?
        AND hotels.adults_per_room >= ? AND hotels.children_per_room >= ?
        """
        params = [start_date, end_date, adults, children]

        if pets:
            query += " AND hotels.pets_allowed = ?"
            params.append(pets)

        if destination:
            query += " AND (cities.name LIKE ? OR countries.name LIKE ? OR countries.continent LIKE ?)"
            params.extend([f"%{destination}%", f"%{destination}%", f"%{destination}%"])

        print("🧐 Requête SQL exécutée :", query)
        print("📌 Paramètres SQL :", params)

        cursor.execute(query, params)
        hotels = cursor.fetchall()
        conn.close()

        return jsonify([
            {
                "id": hotel["id"],
                "name": hotel["name"],
                "stars": hotel["stars"],
                "hotel_rating": hotel["hotel_rating"],
                "price_per_night": hotel["price_per_night"],
                "city": hotel["city"],
                "country": hotel["country"],
                "available_from": hotel["available_from"],
                "available_to": hotel["available_to"],
                "description":hotel["description"],
                "address":hotel["address"],
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
                ]
            }
            for hotel in hotels
        ])
    except Exception as e:
        print("Erreur lors de l'exécution SQL :", str(e))
        return jsonify({'error': str(e)}), 500

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
        piscine = filters.get('piscine', None)  # Récupération du filtre piscineanimals = filters.get('animals', None)
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
        conn.close()

        print("🔍 Hôtels filtrés envoyés :", [dict(hotel) for hotel in hotels])


        return jsonify([
            {
                "id": hotel["id"],
                "name": hotel["name"],
                "stars": hotel["stars"],
                "price_per_night": hotel["price_per_night"],
                "hotel_rating": hotel["hotel_rating"],
                "city": hotel["city"],
                "description":hotel["description"],
                "address":hotel["address"],
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
                ]
            }
            for hotel in hotels
        ])

    except Exception as e:
        print("Erreur lors de l'exécution SQL :", str(e))
        return jsonify({'error': str(e)}), 500
    
    pass
    
    # Fonction pour démarrer l'application Flask
if __name__ == '__main__':
        print("🚀 Flask démarre sur http://127.0.0.1:5003")
 # Démarrer le serveur Flask
        app.run(host='0.0.0.0', port=5003, debug=True)