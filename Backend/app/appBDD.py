import sqlite3
import random
import logging
import time
from opencage.geocoder import OpenCageGeocode
from flask import Flask, g, request, jsonify
from datetime import datetime, timedelta

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

# Création des tables nécessaires
def create_tables():
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("BEGIN TRANSACTION;")

            # Création de la table countries avec la colonne continent
            cursor.execute('''CREATE TABLE IF NOT EXISTS countries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                continent TEXT NOT NULL
            );''')
                    
            # Table des villes avec une relation de clé étrangère vers countries
            cursor.execute('''CREATE TABLE IF NOT EXISTS cities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                country_id INTEGER NOT NULL,
                UNIQUE(name, country_id),
                FOREIGN KEY (country_id) REFERENCES countries (id)
            )''')

            # Création d'un index pour la relation entre villes et pays
            cursor.execute('''CREATE INDEX IF NOT EXISTS idx_cities_country_id ON cities(country_id);''')

            # Table des hôtels avec une relation de clé étrangère vers cities
            cursor.execute('''CREATE TABLE IF NOT EXISTS hotels (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                city_id INTEGER NOT NULL,
                stars INTEGER NOT NULL,
                rooms INTEGER NOT NULL,
                adults_per_room INTEGER NOT NULL,
                children_per_room INTEGER NOT NULL,
                pets_allowed INTEGER NOT NULL,
                parking INTEGER NOT NULL,
                restaurant INTEGER NOT NULL,
                piscine INTEGER NOT NULL,
                spa INTEGER NOT NULL,
                gym INTEGER NOT NULL,  
                price_per_night REAL,
                free_wifi INTEGER DEFAULT 0,
                ev_charging INTEGER DEFAULT 0,
                wheelchair_accessible INTEGER DEFAULT 0,
                air_conditioning INTEGER DEFAULT 0,
                washing_machine INTEGER DEFAULT 0,
                meal_plan TEXT DEFAULT 'Pas de restauration',
                kitchenette INTEGER DEFAULT 0,
                hotel_rating REAL, 
                address TEXT NOT NULL,
                description TEXT NOT NULL,
                latitude REAL, 
                longitude REAL, 
                available_from DATE NOT NULL,
                available_to DATE NOT NULL,
                image_url TEXT,
                UNIQUE(name, city_id),
                FOREIGN KEY (city_id) REFERENCES cities (id))''')
        
            # Création d'un index pour améliorer les performances des requêtes sur hotels
            cursor.execute('''CREATE INDEX IF NOT EXISTS idx_hotels_city_id ON hotels(city_id);''')

            # Création de la table reviews pour les avis des utilisateurs
            cursor.execute('''CREATE TABLE IF NOT EXISTS reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                hotel_id INTEGER NOT NULL,
                user_name TEXT NOT NULL,
                rating INTEGER NOT NULL,
                comment TEXT,
                FOREIGN KEY (hotel_id) REFERENCES hotels (id)
            )''')

            conn.commit()

    except sqlite3.Error as e:
            # Gestion des erreurs lors de la création des tables et des transactions
            logging.error(f"Erreur lors de la création des tables : {e}")
            if conn:
                conn.rollback()  # Annule les modifications si une erreur survient

# Clé API OpenCage (remplace par ta propre clé)
API_KEY = "2fb9ebbe9e88490cb39edf48d3016309"
geocoder = OpenCageGeocode(API_KEY)
coordinate_cache = {}  # Cache local pour stocker les coordonnées GPS

def get_coordinates(address):
    """
    Récupère les coordonnées GPS (latitude, longitude) d'une adresse via l'API OpenCage.
    Utilise un cache pour éviter de refaire les mêmes requêtes.
    """
    if address in coordinate_cache:
        return coordinate_cache[address]  # Retourne les coordonnées déjà trouvées

    try:
        time.sleep(0.5)  # Pause pour éviter d'être bloqué par l'API
        results = geocoder.geocode(address)
        if results:
            lat, lng = results[0]['geometry']['lat'], results[0]['geometry']['lng']
            coordinate_cache[address] = (lat, lng)  # Stocke en cache
            return lat, lng
    except Exception as e:
        print(f"❌ Erreur API : {e}")
    return None, None
    
# Insertion de données fictives dans la base de données
def insert_data():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        try:
            conn.execute("BEGIN TRANSACTION")

            # Liste des pays et continents
            countries = [
                ("Nigéria", "Afrique"), ("Égypte", "Afrique"), ("Afrique du Sud", "Afrique"), ("Kenya", "Afrique"), ("Algérie", "Afrique"),
                ("Chine", "Asie"), ("Inde", "Asie"), ("Indonésie", "Asie"), ("Pakistan", "Asie"), ("Bangladesh", "Asie"),
                ("États-Unis", "North America"), ("Canada", "North America"), ("Mexique", "North America"), ("Cuba", "North America"), ("Guatemala", "North America"),
                ("Brésil", "South America"), ("Argentine", "South America"), ("Colombie", "South America"), ("Chili", "South America"), ("Pérou", "South America"),
                ("France", "Europe"), ("Allemagne", "Europe"), ("Royaume-Uni", "Europe"), ("Italie", "Europe"), ("Espagne", "Europe"),
                ("Australie", "Océanie"), ("Nouvelle-Zélande", "Océanie"), ("Papouasie-Nouvelle-Guinée", "Océanie"), ("Fidji", "Océanie"), ("Samoa", "Océanie")
            ]
            
            for country_name, continent in countries:
                cursor.execute('INSERT OR IGNORE INTO countries (name, continent) VALUES (?, ?)', (country_name, continent))
            
            # Récupération des IDs des pays
            cursor.execute('SELECT name, id FROM countries')
            country_ids = {row[0]: row[1] for row in cursor.fetchall()}

            #Insertion des villes
            cities = {
                "Nigéria": ["Lagos", "Abuja", "Kano"],
                "Égypte": ["Le Caire", "Alexandrie", "Gizeh"],
                "Afrique du Sud": ["Johannesburg", "Le Cap", "Durban"],
                "Kenya": ["Nairobi", "Mombasa", "Kisumu"],
                "Algérie": ["Alger", "Oran", "Constantine"],
                "Chine": ["Pékin", "Shanghai", "Guangzhou"],
                "Inde": ["New Delhi", "Mumbai", "Bangalore"],
                "Indonésie": ["Jakarta", "Surabaya", "Bandung"],
                "Pakistan": ["Karachi", "Lahore", "Islamabad"],
                "Bangladesh": ["Dhaka", "Chittagong", "Khulna"],
                "États-Unis": ["New York", "Los Angeles", "Chicago"],
                "Canada": ["Toronto", "Vancouver", "Montreal"],
                "Mexique": ["Mexico City", "Guadalajara", "Monterrey"],
                "Cuba": ["La Havane", "Santiago", "Camagüey"],
                "Guatemala": ["Guatemala City", "Mixco", "Villa Nueva"],
                "Brésil": ["São Paulo", "Rio de Janeiro", "Brasília"],
                "Argentine": ["Buenos Aires", "Córdoba", "Rosario"],
                "Colombie": ["Bogotá", "Medellín", "Cali"],
                "Chili": ["Santiago", "Valparaíso", "Concepción"],
                "Pérou": ["Lima", "Arequipa", "Trujillo"],
                "France": ["Paris", "Marseille", "Lyon", "Nice", "Bordeaux"],
                "Allemagne": ["Berlin", "Munich", "Hambourg"],
                "Royaume-Uni": ["Londres", "Manchester", "Birmingham"],
                "Italie": ["Rome", "Milan", "Venise"],
                "Espagne": ["Madrid", "Barcelone", "Séville"],
                "Australie": ["Sydney", "Melbourne", "Brisbane"],
                "Nouvelle-Zélande": ["Auckland", "Wellington", "Christchurch"],
                "Papouasie-Nouvelle-Guinée": ["Port Moresby", "Lae", "Mount Hagen"],
                "Fidji": ["Suva", "Nadi", "Lautoka"],
                "Samoa": ["Apia", "Salelologa", "Asau"]
            }
            for country_name, city_list in cities.items():
                country_id = country_ids.get(country_name)
                if country_id:
                    for city_name in city_list:
                        try:
                            cursor.execute('INSERT OR IGNORE INTO cities (name, country_id) VALUES (?, ?)', (city_name, country_id))
                        except sqlite3.IntegrityError as e:
                            print(f"Erreur lors de l'insertion de la ville {city_name} pour le pays {country_name} : {e}")

            # Insertion des hôtels
            hotels_data = [
                # France
                {"name": "Le Parisien Luxe", "city": "Paris", "stars": 5, "rooms": 12, "adults_per_room": 3, "children_per_room": 0, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 300.0, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 1, "meal_plan": "breakfast", "kitchenette": 0, "hotel_rating": 9.9, "address": "12 Rue de Rivoli, 75001 Paris, France", "description": "Situé en plein cœur de Paris, Le Parisien Luxe offre une expérience unique avec son spa, sa piscine et son restaurant gastronomique. Idéal pour les voyageurs en quête d'un confort absolu avec un accès facile aux sites emblématiques de la capitale."},
                {"name": "Hôtel de Ville", "city": "Paris", "stars": 3, "rooms": 8, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 0, "parking": 0, "restaurant": 1, "piscine": 0, "spa": 0, "gym": 0, "price_per_night": 120.0, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "half_board", "kitchenette": 0, "hotel_rating": 7.2, "address": "5 Place de l'Hôtel de Ville, 75004 Paris, France", "description": "Cet hôtel charmant offre une proximité immédiate avec les monuments historiques de Paris. Parfait pour un séjour agréable avec un accès rapide aux transports en commun."},
                {"name": "Château de Versailles", "city": "Paris", "stars": 4, "rooms": 5, "adults_per_room": 4, "children_per_room": 2, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 0, "gym": 1, "price_per_night": 250.0, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "full_board", "kitchenette": 1, "hotel_rating": 8.8, "address": "10 Avenue de Versailles, 78000 Versailles, France", "description": "Inspiré par l'élégance du célèbre château, cet hôtel offre un cadre raffiné et luxueux avec des chambres spacieuses et un accès à une piscine et un restaurant gastronomique."},
                {"name": "Lyon Central", "city": "Lyon", "stars": 4, "rooms": 6, "adults_per_room": 3, "children_per_room": 1, "pets_allowed": 0, "parking": 0, "restaurant": 1, "piscine": 1, "spa": 0, "gym": 1, "price_per_night": 180.0, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "half_board", "kitchenette": 0, "hotel_rating": 7.5, "address": "25 Rue de la République, 69002 Lyon, France", "description": "Idéalement situé dans le centre-ville de Lyon, cet hôtel propose un confort moderne avec une piscine, un accès rapide aux transports et une gastronomie locale raffinée."},
                {"name": "Lyon Petit", "city": "Lyon", "stars": 3, "rooms": 10, "adults_per_room": 1, "children_per_room": 2, "pets_allowed": 0, "parking": 1, "restaurant": 0, "piscine": 0, "spa": 0, "gym": 0, "price_per_night": 90.0, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 0, "washing_machine": 0, "meal_plan": "Pas de restauration", "kitchenette": 0, "hotel_rating": 6.8, "address": "10 Rue de la Charité, 69002 Lyon, France", "description": "Un hôtel accessible et abordable pour les voyageurs d'affaires et les familles, proche des transports et des sites historiques de Lyon."},
                {"name": "Hôtel du Sud", "city": "Marseille", "stars": 2, "rooms": 7, "adults_per_room": 4, "children_per_room": 1, "pets_allowed": 0, "parking": 0, "restaurant": 1, "piscine": 0, "spa": 0, "gym": 0, "price_per_night": 75.0, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 0, "washing_machine": 0, "meal_plan": "breakfast", "kitchenette": 0, "hotel_rating": 8.5, "address": "12 Rue de la République, 13002 Marseille, France", "description": "Situé à proximité du Vieux-Port, l'Hôtel du Sud est un établissement convivial offrant un accès rapide aux sites emblématiques de Marseille. Idéal pour les familles, il propose une connexion Wi-Fi gratuite et un restaurant servant une cuisine locale authentique."},
                {"name": "Le Vieux Port", "city": "Marseille", "stars": 5, "rooms": 12, "adults_per_room": 4, "children_per_room": 2, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 280.0, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 1, "meal_plan": "full_board", "kitchenette": 1, "hotel_rating": 9.7, "address": "5 Quai du Port, 13002 Marseille, France", "description": "Offrant une vue imprenable sur le Vieux-Port, cet hôtel de luxe propose des chambres élégantes avec kitchenette. Détendez-vous dans son spa ou profitez de sa piscine extérieure. Un choix idéal pour un séjour de prestige en bord de mer."},
                {"name": "Nice Riviera Palace", "city": "Nice", "stars": 5, "rooms": 40, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 0, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 320.0, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 1, "meal_plan": "breakfast", "kitchenette": 0, "hotel_rating": 9.9, "address": "15 Promenade des Anglais, 06000 Nice, France", "description": "Idéalement situé sur la Promenade des Anglais, cet hôtel prestigieux offre un cadre raffiné avec spa et piscine. Profitez de sa proximité avec les plages et les boutiques de luxe du centre-ville."},
                {"name": "Bordeaux Wine Hotel", "city": "Bordeaux", "stars": 4, "rooms": 50, "adults_per_room": 1, "children_per_room": 2, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 0, "gym": 1, "price_per_night": 200.0, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "half_board", "kitchenette": 1, "hotel_rating": 8.6, "address": "8 Rue du Château Trompette, 33000 Bordeaux, France", "description": "Niché au cœur de Bordeaux, cet hôtel élégant met en avant l'héritage viticole de la région. Il propose une sélection raffinée de vins et un hébergement confortable avec kitchenette."},
                
                # Espagne
                {"name": "Palacio Madrid", "city": "Madrid", "stars": 5, "rooms": 10, "adults_per_room": 3, "children_per_room": 1, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 300, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "breakfast", "kitchenette": 0, "hotel_rating": 9.0, "address": "Calle Mayor 46, 28013 Madrid, Espagne", "description": "Situé à quelques pas du Palais Royal, cet hôtel combine luxe et charme historique. Profitez du spa et de la piscine tout en explorant la capitale espagnole."},
                {"name": "Hotel Madrid City", "city": "Madrid", "stars": 3, "rooms": 6, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 0, "parking": 0, "restaurant": 1, "piscine": 0, "spa": 0, "gym": 0, "price_per_night": 120, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "Pas de restauration", "kitchenette": 0, "hotel_rating": 7.5, "address": "Gran Vía 28, 28013 Madrid, Espagne", "description": "Un hôtel abordable et bien situé sur la Gran Vía, parfait pour les voyageurs souhaitant découvrir Madrid à pied. Ambiance conviviale et chambres confortables."},
                {"name": "Barcelona Suites", "city": "Barcelone", "stars": 4, "rooms": 9, "adults_per_room": 3, "children_per_room": 2, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 0, "gym": 1, "price_per_night": 250, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "half_board", "kitchenette": 1, "hotel_rating": 8.0, "address": "Passeig de Gracia 74, 08008 Barcelone, Espagne", "description": "Des suites élégantes en plein cœur de Barcelone, à proximité des boutiques et des sites emblématiques comme la Sagrada Familia. Idéal pour les séjours en famille."},
                {"name": "Hotel Bcn", "city": "Barcelone", "stars": 2, "rooms": 5, "adults_per_room": 4, "children_per_room": 0, "pets_allowed": 0, "parking": 0, "restaurant": 0, "piscine": 0, "spa": 0, "gym": 0, "price_per_night": 90, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "Pas de restauration", "kitchenette": 0, "hotel_rating": 6.5, "address": "Carrer de la Marina 18, 08005 Barcelone, Espagne", "description": "Un choix économique pour les voyageurs en quête de simplicité. À proximité des plages et du quartier animé de la Barceloneta."},
                {"name": "Sevilla Grande", "city": "Séville", "stars": 3, "rooms": 7, "adults_per_room": 4, "children_per_room": 1, "pets_allowed": 0, "parking": 0, "restaurant": 1, "piscine": 0, "spa": 0, "gym": 0, "price_per_night": 150, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "breakfast", "kitchenette": 0, "hotel_rating": 7.0, "address": "Av. de la Constitución, 15, 41004 Séville, Espagne", "description": "Situé en plein cœur de Séville, l'hôtel Sevilla Grande propose des chambres confortables avec climatisation et Wi-Fi gratuit. Son emplacement central permet d'accéder facilement à la cathédrale de Séville et au quartier historique de Santa Cruz. Idéal pour les familles, il propose un restaurant sur place et un accès facile aux transports en commun."},
                {"name": "Sevilla Palace", "city": "Séville", "stars": 5, "rooms": 12, "adults_per_room": 3, "children_per_room": 2, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 450, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "full_board", "kitchenette": 0, "hotel_rating": 9.5, "address": "Calle San Fernando, 2, 41004 Séville, Espagne", "description": "Le Sevilla Palace est un hôtel 5 étoiles luxueux offrant des prestations haut de gamme, un spa relaxant et une piscine avec vue panoramique sur la ville. Situé à quelques pas de l'Alcazar et de la Plaza de España, cet établissement est parfait pour une escapade romantique ou un séjour de luxe."},

                # Italie
                {"name": "Roma Deluxe", "city": "Rome", "stars": 5, "rooms": 8, "adults_per_room": 3, "children_per_room": 2, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 380, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "half_board", "kitchenette": 0, "hotel_rating": 9.2, "address": "Via Veneto, 155, 00187 Rome, Italie", "description": "Le Roma Deluxe est un hôtel prestigieux situé sur la célèbre Via Veneto. Il dispose d'un spa, d'une piscine chauffée et d'un restaurant gastronomique proposant des spécialités italiennes. Proche des attractions majeures telles que la fontaine de Trevi et la Place d'Espagne, il constitue un choix idéal pour les voyageurs recherchant le confort et l'élégance."},
                {"name": "Hotel Roma", "city": "Rome", "stars": 3, "rooms": 7, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 0, "parking": 0, "restaurant": 0, "piscine": 0, "spa": 0, "gym": 0, "price_per_night": 130, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "Pas de restauration", "kitchenette": 0, "hotel_rating": 7.2, "address": "Piazza della Repubblica, 20, 00185 Rome, Italie", "description": "L'Hotel Roma offre un hébergement abordable en plein centre historique, à proximité de la gare Termini. Idéal pour les voyageurs souhaitant explorer Rome à pied, il propose des chambres modernes et un service convivial pour un séjour agréable."},
                {"name": "Venise Grand", "city": "Venise", "stars": 4, "rooms": 10, "adults_per_room": 3, "children_per_room": 0, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 0, "gym": 1, "price_per_night": 320, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "breakfast", "kitchenette": 0, "hotel_rating": 8.7,"address": "San Marco 1234, 30124 Venise, Italie","description": "Le Venise Grand est un hôtel 4 étoiles élégant situé dans le quartier de San Marco, à quelques pas du célèbre Pont du Rialto. Offrant des chambres spacieuses et modernes avec vue sur le Grand Canal, l'hôtel dispose d'une piscine extérieure, d'un centre de remise en forme et d'un restaurant proposant une cuisine vénitienne raffinée. Idéal pour un séjour romantique ou culturel."},
                {"name": "Hôtel Serenissimo", "city": "Venise", "stars": 2, "rooms": 6, "adults_per_room": 4, "children_per_room": 2, "pets_allowed": 0, "parking": 0, "restaurant": 0, "piscine": 0, "spa": 0, "gym": 0, "price_per_night": 95, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 0, "washing_machine": 0, "meal_plan": "Pas de restauration", "kitchenette": 0, "hotel_rating": 6.8,"address": "Cannaregio 4321, 30121 Venise, Italie","description": "L’Hôtel Serenissimo est un petit établissement charmant, idéal pour les voyageurs souhaitant découvrir Venise à petit budget. Situé dans le quartier pittoresque de Cannaregio, il offre un accès facile aux vaporetto et aux attractions principales, telles que la Place Saint-Marc et le Palais des Doges. Les chambres sont simples mais confortables, parfaites pour un séjour authentique."},
                {"name": "Milan Luxury", "city": "Milan", "stars": 5, "rooms": 12, "adults_per_room": 3, "children_per_room": 2, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 480, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "full_board", "kitchenette": 0, "hotel_rating": 9.6,"address": "Via Montenapoleone 10, 20121 Milan, Italie","description": "Le Milan Luxury est un hôtel 5 étoiles situé en plein cœur du quartier de la mode de Milan. Il propose des chambres somptueuses avec des vues panoramiques sur la ville, un spa exclusif, un restaurant gastronomique et une piscine chauffée. À quelques minutes du Duomo et du Teatro alla Scala, il est parfait pour un séjour haut de gamme dans la capitale italienne de la mode."},
                {"name": "Hôtel Milano", "city": "Milan", "stars": 3, "rooms": 8, "adults_per_room": 1, "children_per_room": 2, "pets_allowed": 0, "parking": 0, "restaurant": 1, "piscine": 0, "spa": 0, "gym": 0, "price_per_night": 150, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "Pas de restauration", "kitchenette": 0, "hotel_rating": 7.0,"address": "Corso Buenos Aires 56, 20124 Milan, Italie","description": "L'Hôtel Milano est un choix abordable pour les voyageurs souhaitant explorer Milan. Situé à proximité des transports en commun, il permet un accès rapide aux principales attractions, telles que le Duomo et le quartier de Brera. Ses chambres modernes et bien équipées garantissent un séjour agréable."},

                # USA
                {"name": "New York Luxury", "city": "New York", "stars": 5, "rooms": 10, "adults_per_room": 4, "children_per_room": 1, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 450, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "breakfast", "kitchenette": 0, "hotel_rating": 9.5, "address": "123 Fifth Avenue, New York, NY 10001, USA", "description": "Situé au cœur de Manhattan, le New York Luxury offre une vue imprenable sur l'Empire State Building. Profitez d'un spa haut de gamme, d'une piscine intérieure et d'une salle de sport entièrement équipée. L'hôtel propose un restaurant gastronomique et un bar panoramique, parfaits pour se détendre après une journée dans la ville qui ne dort jamais. Les chambres spacieuses et modernes disposent d'un mobilier élégant et d'une literie de luxe."},
                {"name": "NYC Central", "city": "New York", "stars": 3, "rooms": 6, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 0, "parking": 0, "restaurant": 1, "piscine": 0, "spa": 0, "gym": 0, "price_per_night": 150, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "Pas de restauration", "kitchenette": 0, "hotel_rating": 7.8,"address": "456 Broadway, New York, NY 10012, USA", "description": "L'hôtel NYC Central est idéalement situé à Soho, offrant un accès rapide aux boutiques de luxe, aux restaurants branchés et aux célèbres attractions comme Times Square. Les chambres sont confortables et équipées du Wi-Fi gratuit. Son restaurant sur place propose une cuisine locale savoureuse, parfaite pour commencer ou terminer la journée."},
                {"name": "LA Sunshine", "city": "Los Angeles", "stars": 4, "rooms": 8, "adults_per_room": 3, "children_per_room": 2, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 0, "gym": 1, "price_per_night": 250, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "breakfast", "kitchenette": 0, "hotel_rating": 8.5,"address": "789 Sunset Boulevard, Los Angeles, CA 90028, USA", "description": "Avec son emplacement privilégié sur Sunset Boulevard, l'hôtel LA Sunshine est un refuge moderne en plein cœur de Los Angeles. Il dispose d'une piscine extérieure avec vue panoramique sur la ville, d'un centre de remise en forme et d'un restaurant servant des plats californiens frais. Idéal pour explorer Hollywood et les plages de Santa Monica."},
                {"name": "Hotel LA Beach", "city": "Los Angeles", "stars": 2, "rooms": 5, "adults_per_room": 4, "children_per_room": 1, "pets_allowed": 0, "parking": 0, "restaurant": 1, "piscine": 0, "spa": 0, "gym": 0, "price_per_night": 120, "free_wifi": 0, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "Pas de restauration", "kitchenette": 0, "hotel_rating": 6.9,"address": "321 Ocean Avenue, Santa Monica, CA 90401, USA", "description": "À seulement quelques pas de la plage de Santa Monica, l'hôtel LA Beach est parfait pour les voyageurs cherchant un séjour abordable à proximité du Pacifique. Les chambres offrent une atmosphère chaleureuse et un accès rapide aux cafés et boutiques du front de mer. Son restaurant propose des spécialités locales de fruits de mer."},
                {"name": "Chicago Tower", "city": "Chicago", "stars": 5, "rooms": 9, "adults_per_room": 3, "children_per_room": 2, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 480, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "half_board", "kitchenette": 0, "hotel_rating": 9.3,"address": "875 North Michigan Avenue, Chicago, IL 60611, USA", "description": "Situé sur la Magnificent Mile, le Chicago Tower offre des vues spectaculaires sur la skyline de la ville et le lac Michigan. Il dispose d'un spa luxueux, d'une piscine chauffée et d'un restaurant gastronomique. À proximité des meilleurs magasins et attractions culturelles de Chicago, cet hôtel est parfait pour un séjour haut de gamme."},
                {"name": "Chicago Budget", "city": "Chicago", "stars": 3, "rooms": 7, "adults_per_room": 4, "children_per_room": 1, "pets_allowed": 0, "parking": 0, "restaurant": 1, "piscine": 0, "spa": 0, "gym": 0, "price_per_night": 100, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "Pas de restauration", "kitchenette": 0, "hotel_rating": 7.1,"address": "500 W Madison Street, Chicago, IL 60661, USA",  "description": "L'hôtel Chicago Budget est parfait pour les voyageurs souhaitant explorer la ville à un prix abordable. Situé près de la gare Union, il permet un accès rapide aux quartiers emblématiques de Chicago. Ses chambres offrent un bon confort, et son restaurant sert une cuisine simple et délicieuse."},

               # Canada
                {"name": "Toronto Central", "city": "Toronto", "stars": 4, "rooms": 9, "adults_per_room": 3, "children_per_room": 1, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 0, "gym": 1, "price_per_night": 350, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "breakfast", "kitchenette": 0, "hotel_rating": 8.7, "address": "123 Queen St W, Toronto, ON M5H 2M9, Canada", "description": "Le Toronto Central est un hôtel 4 étoiles moderne situé en plein cœur du centre-ville. Il propose des chambres élégantes, un restaurant gastronomique et une piscine intérieure chauffée. Idéal pour les voyages d'affaires et les escapades en famille, à quelques pas de la Tour CN et du quartier financier."},
                {"name": "Hotel Ontario", "city": "Toronto", "stars": 3, "rooms": 8, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 0, "parking": 0, "restaurant": 1, "piscine": 0, "spa": 0, "gym": 0, "price_per_night": 180, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "Pas de restauration", "kitchenette": 0, "hotel_rating": 7.3, "address": "456 Bloor St W, Toronto, ON M5S 1X8, Canada", "description": "Situé dans le quartier universitaire de Toronto, l'Hotel Ontario est une option abordable avec un accès facile aux transports en commun et aux attractions locales comme le Royal Ontario Museum. Chambres confortables et ambiance conviviale."},
                {"name": "Vancouver View", "city": "Vancouver", "stars": 5, "rooms": 12, "adults_per_room": 3, "children_per_room": 2, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 500, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "half_board", "kitchenette": 0, "hotel_rating": 9.2, "address": "789 Burrard St, Vancouver, BC V6C 2M1, Canada", "description": "Le Vancouver View est un luxueux hôtel 5 étoiles offrant une vue imprenable sur les montagnes et l'océan Pacifique. Profitez d'un spa haut de gamme, d'une piscine panoramique et d'un restaurant gastronomique spécialisé en fruits de mer. À proximité du parc Stanley et du quartier historique de Gastown."},
                {"name": "Pacific Inn", "city": "Vancouver", "stars": 2, "rooms": 6, "adults_per_room": 4, "children_per_room": 0, "pets_allowed": 0, "parking": 0, "restaurant": 0, "piscine": 0, "spa": 0, "gym": 0, "price_per_night": 90, "free_wifi": 0, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "Pas de restauration", "kitchenette": 0, "hotel_rating": 6.5, "address": "234 Main St, Vancouver, BC V6A 2S7, Canada", "description": "Le Pacific Inn est un hôtel économique, idéal pour les voyageurs souhaitant explorer Vancouver avec un budget limité. Situé près des stations de SkyTrain, il offre un accès facile aux plages et aux quartiers culturels de la ville."},

                # Nigéria
                {"name": "Lagos Grand Hotel", "city": "Lagos", "stars": 4, "rooms": 10, "adults_per_room": 3, "children_per_room": 1, "pets_allowed": 0, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 350, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "breakfast", "kitchenette": 0, "hotel_rating": 8.8, "address": "123 Victoria Island, Lagos, Nigéria", "description": "Le Lagos Grand Hotel est un hôtel 4 étoiles élégant situé sur l'île Victoria. Il propose un spa de luxe, une piscine extérieure et un restaurant servant des plats locaux et internationaux. Idéal pour un séjour d'affaires ou de loisirs."},
                {"name": "Lagos Comfort Inn", "city": "Lagos", "stars": 2, "rooms": 5, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 0, "parking": 0, "restaurant": 0, "piscine": 0, "spa": 0, "gym": 0, "price_per_night": 90, "free_wifi": 0, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "Pas de restauration", "kitchenette": 0, "hotel_rating": 6.2, "address": "456 Ikoyi Road, Lagos, Nigéria", "description": "Lagos Comfort Inn est un hôtel économique situé à proximité des marchés locaux et des transports en commun. Il propose des chambres simples mais confortables pour les voyageurs en quête d’un séjour abordable."},
                {"name": "Kano Palace Hotel", "city": "Kano", "stars": 3, "rooms": 8, "adults_per_room": 4, "children_per_room": 1, "pets_allowed": 0, "parking": 1, "restaurant": 0, "piscine": 0, "spa": 0, "gym": 1, "price_per_night": 150, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "breakfast", "kitchenette": 0, "hotel_rating": 7.5, "address": "789 Zaria Road, Kano, Nigéria", "description": "Le Kano Palace Hotel offre un hébergement confortable dans le centre historique de Kano. Idéal pour découvrir la culture locale et les marchés traditionnels."},

                # Égypte
                {"name": "Cairo Luxury Inn", "city": "Le Caire", "stars": 5, "rooms": 15, "adults_per_room": 2, "children_per_room": 1, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 0, "price_per_night": 250, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "half_board", "kitchenette": 0, "hotel_rating": 9.2, "address": "456 Nile St, Le Caire, Égypte", "description": "Le Cairo Luxury Inn est un hôtel 5 étoiles offrant une vue imprenable sur le Nil et situé à proximité du Musée égyptien. Il propose un spa luxueux, une piscine sur le toit et un restaurant gastronomique."},
                {"name": "Alexandria Beach Resort", "city": "Alexandrie", "stars": 4, "rooms": 10, "adults_per_room": 3, "children_per_room": 2, "pets_allowed": 0, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 0, "gym": 1, "price_per_night": 180, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "breakfast", "kitchenette": 1, "hotel_rating": 8.0, "address": "789 Corniche Rd, Alexandrie, Égypte", "description": "L'Alexandria Beach Resort offre un accès direct à la plage et une vue panoramique sur la Méditerranée. Idéal pour les familles avec ses installations modernes et son restaurant de fruits de mer."},
                {"name": "Gizeh Boutique Hotel", "city": "Gizeh", "stars": 3, "rooms": 9, "adults_per_room": 2, "children_per_room": 1, "pets_allowed": 0, "parking": 1, "restaurant": 0, "piscine": 0, "spa": 0, "gym": 1, "price_per_night": 150, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "Pas de restauration", "kitchenette": 0, "hotel_rating": 7.5, "address": "321 Pyramids Rd, Gizeh, Égypte", "description": "Le Gizeh Boutique Hotel est un charmant établissement à quelques minutes des pyramides de Gizeh. Il offre des chambres confortables et une vue spectaculaire sur les monuments antiques."},

                # Afrique du Sud
                {"name": "Johannesburg City Lodge", "city": "Johannesburg", "stars": 4, "rooms": 10, "adults_per_room": 3, "children_per_room": 2, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 0, "gym": 1, "price_per_night": 220, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "Pas de restauration", "kitchenette": 0, "hotel_rating": 8.3, "address": "123 Main St, Johannesburg, Afrique du Sud", "description": "Le Johannesburg City Lodge est idéal pour les voyages d'affaires et les séjours touristiques. Il offre des chambres modernes, un accès facile aux attractions et une piscine relaxante."},
                {"name": "Cape Town Premium Hotel", "city": "Le Cap", "stars": 5, "rooms": 12, "adults_per_room": 2, "children_per_room": 1, "pets_allowed": 0, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 350, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 1, "meal_plan": "full_board", "kitchenette": 0, "hotel_rating": 9.5, "address": "456 Waterfront Rd, Le Cap, Afrique du Sud", "description": "Le Cape Town Premium Hotel est un établissement de luxe offrant une vue magnifique sur l'océan et la montagne de la Table. Idéal pour une escapade romantique ou un séjour de détente."},
                {"name": "Durban Beachfront Resort", "city": "Durban", "stars": 4, "rooms": 11, "adults_per_room": 3, "children_per_room": 2, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 0, "price_per_night": 220, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "breakfast", "kitchenette": 0, "hotel_rating": 9.0, "address": "789 Beach Rd, Durban, Afrique du Sud", "description": "Situé en bord de mer, le Durban Beachfront Resort propose des chambres modernes avec vue sur l'océan Indien, un spa relaxant et un accès direct aux plages de sable fin."},

                # Kenya
                {"name": "Nairobi Sky View Hotel", "city": "Nairobi", "stars": 4, "rooms": 9, "adults_per_room": 3, "children_per_room": 1, "pets_allowed": 0, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 280, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "breakfast", "kitchenette": 1, "hotel_rating": 8.7, "address": "123 Kenyatta Ave, Nairobi, Kenya", "description": "Le Nairobi Sky View Hotel est un hôtel élégant situé au cœur de la capitale, offrant une vue panoramique sur la ville et un accès facile aux sites touristiques."},
                {"name": "Mombasa Ocean Resort", "city": "Mombasa", "stars": 5, "rooms": 15, "adults_per_room": 2, "children_per_room": 1, "pets_allowed": 0, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 400, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 1, "meal_plan": "half_board", "kitchenette": 0, "hotel_rating": 9.0, "address": "456 Beach Rd, Mombasa, Kenya", "description": "Le Mombasa Ocean Resort est un hôtel de luxe en bord de mer, offrant des suites élégantes avec balcon, un spa de luxe et un accès privé à une plage paradisiaque."},
                {"name": "Kisumu Lakeside Hotel", "city": "Kisumu", "stars": 3, "rooms": 8, "adults_per_room": 3, "children_per_room": 2, "pets_allowed": 1, "parking": 1, "restaurant": 0, "piscine": 0, "spa": 0, "gym": 0, "price_per_night": 120, "free_wifi": 0, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "Pas de restauration", "kitchenette": 0, "hotel_rating": 6.5, "address": "789 Lake Victoria Rd, Kisumu, Kenya", "description": "Le Kisumu Lakeside Hotel est une option économique pour les voyageurs souhaitant explorer les rives du lac Victoria et la culture locale de l'ouest du Kenya."},

                # Algérie
                {"name": "Algerian Heritage Hotel", "city": "Alger", "stars": 4, "rooms": 10, "adults_per_room": 2, "children_per_room": 1, "pets_allowed": 0, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 0, "gym": 1, "price_per_night": 120, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "breakfast", "kitchenette": 0, "hotel_rating": 8.5, "address": "123 Rue Didouche Mourad, Alger, Algérie", "description": "L'Algerian Heritage Hotel est un établissement élégant situé en plein centre-ville d'Alger. Il offre une vue panoramique sur la baie, un restaurant traditionnel et un accès rapide aux sites historiques."},
                {"name": "Oran Sea View Hotel", "city": "Oran", "stars": 5, "rooms": 13, "adults_per_room": 3, "children_per_room": 1, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 180, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "half_board", "kitchenette": 0, "hotel_rating": 9.2, "address": "456 Boulevard Front de Mer, Oran, Algérie", "description": "Le Oran Sea View Hotel est un luxueux établissement en bord de mer avec des chambres spacieuses, un spa de luxe et une piscine à débordement offrant une vue imprenable sur la Méditerranée."},
                {"name": "Constantine Grand Hotel", "city": "Constantine", "stars": 3, "rooms": 7, "adults_per_room": 2, "children_per_room": 1, "pets_allowed": 0, "parking": 1, "restaurant": 0, "piscine": 0, "spa": 0, "gym": 1, "price_per_night": 90, "free_wifi": 0, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "Pas de restauration", "kitchenette": 0, "hotel_rating": 7.0, "address": "789 Pont Sidi M'Cid, Constantine, Algérie", "description": "Le Constantine Grand Hotel est un hôtel économique idéalement situé à proximité des célèbres ponts suspendus, parfait pour les voyageurs curieux de découvrir l'histoire locale."},

                # Chine
                {"name": "Beijing Sky Suites", "city": "Pékin", "stars": 5, "rooms": 15, "adults_per_room": 2, "children_per_room": 1, "pets_allowed": 0, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 0, "price_per_night": 250, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 1, "meal_plan": "breakfast", "kitchenette": 1, "hotel_rating": 9.0, "address": "123 Wangfujing St, Pékin, Chine", "description": "Le Beijing Sky Suites est un hôtel de luxe situé dans le quartier commerçant de Pékin, offrant une vue imprenable sur la Cité Interdite et un service cinq étoiles de classe mondiale."},
                {"name": "Shanghai Central Hotel", "city": "Shanghai", "stars": 4, "rooms": 10, "adults_per_room": 3, "children_per_room": 2, "pets_allowed": 0, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 0, "gym": 1, "price_per_night": 150, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "Pas de restauration", "kitchenette": 0, "hotel_rating": 8.0, "address": "456 Nanjing Rd, Shanghai, Chine", "description": "Le Shanghai Central Hotel est un établissement moderne situé au cœur de la ville, offrant un accès facile au Bund et aux quartiers d'affaires."},
                {"name": "Guangzhou Business Inn", "city": "Guangzhou", "stars": 1, "rooms": 9, "adults_per_room": 3, "children_per_room": 1, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 0, "spa": 0, "gym": 1, "price_per_night": 120, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "breakfast", "kitchenette": 0, "hotel_rating": 7.5, "address": "789 Tianhe Rd, Guangzhou, Chine", "description": "Idéal pour les voyageurs d'affaires, le Guangzhou Business Inn offre un hébergement simple et fonctionnel à proximité des centres de convention et des quartiers commerciaux."},

                # Inde
                {"name": "Delhi Plaza Hotel", "city": "New Delhi", "stars": 4, "rooms": 10, "adults_per_room": 1, "children_per_room": 0, "pets_allowed": 0, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 200, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 1, "meal_plan": "breakfast", "kitchenette": 0, "hotel_rating": 8.8, "address": "123 Connaught Place, New Delhi, Inde", "description": "Le Delhi Plaza Hotel est un établissement moderne situé en plein cœur de la capitale indienne, offrant un accès rapide aux monuments historiques et aux marchés animés."},
                {"name": "Mumbai Skyline Resort", "city": "Mumbai", "stars": 5, "rooms": 13, "adults_per_room": 3, "children_per_room": 2, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 300, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "half_board", "kitchenette": 0, "hotel_rating": 9.5, "address": "456 Marine Drive, Mumbai, Inde", "description": "Situé face à la mer d'Arabie, le Mumbai Skyline Resort propose un cadre luxueux avec un spa, des suites panoramiques et un restaurant gastronomique."},
                {"name": "Bangalore Boutique Suites", "city": "Bangalore", "stars": 3, "rooms": 8, "adults_per_room": 2, "children_per_room": 1, "pets_allowed": 0, "parking": 1, "restaurant": 0, "piscine": 0, "spa": 0, "gym": 1, "price_per_night": 95, "free_wifi": 0, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 1, "washing_machine": 1, "meal_plan": "Pas de restauration", "kitchenette": 1, "hotel_rating": 7.2, "address": "789 MG Road, Bangalore, Inde", "description": "Les Bangalore Boutique Suites offrent une expérience authentique avec un hébergement confortable et une proximité avec les principaux hubs technologiques et commerciaux de la ville."},

                # Indonésie
                {"name": "Jakarta Luxury", "city": "Jakarta", "stars": 5, "rooms": 10, "adults_per_room": 2, "children_per_room": 1, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 350.0, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "breakfast", "kitchenette": 0, "hotel_rating": 9.5, "address": "123 Jalan Sudirman, Jakarta, Indonésie", "description": "Le Jakarta Luxury est un hôtel cinq étoiles situé dans le quartier des affaires de Jakarta, offrant une vue panoramique sur la ville, un spa de luxe et une piscine à débordement."},
                {"name": "Surabaya Inn", "city": "Surabaya", "stars": 3, "rooms": 8, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 0, "parking": 0, "restaurant": 1, "piscine": 0, "spa": 0, "gym": 1, "price_per_night": 120.0, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "Pas de restauration", "kitchenette": 0, "hotel_rating": 7.5, "address": "456 Jalan Pemuda, Surabaya, Indonésie", "description": "Hôtel économique situé à proximité des marchés locaux et des sites historiques de Surabaya, parfait pour les voyageurs à budget limité."},
                {"name": "Bandung Paradise", "city": "Bandung", "stars": 4, "rooms": 6, "adults_per_room": 3, "children_per_room": 1, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 0, "price_per_night": 220.0, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 0, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "half_board", "kitchenette": 1, "hotel_rating": 8.0, "address": "789 Jalan Braga, Bandung, Indonésie", "description": "Situé au cœur de Bandung, le Bandung Paradise offre une ambiance chaleureuse avec une piscine extérieure et des chambres modernes."},

                # Pakistan
                {"name": "Karachi Heights", "city": "Karachi", "stars": 5, "rooms": 12, "adults_per_room": 3, "children_per_room": 2, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 450.0, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 1, "meal_plan": "full_board", "kitchenette": 0, "hotel_rating": 9.2, "address": "123 Clifton Road, Karachi, Pakistan", "description": "Hôtel de luxe avec vue sur la mer d'Arabie, offrant des suites élégantes et un service exceptionnel."},
                {"name": "Lahore Grand", "city": "Lahore", "stars": 4, "rooms": 10, "adults_per_room": 3, "children_per_room": 1, "pets_allowed": 0, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 0, "gym": 1, "price_per_night": 250.0, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "breakfast", "kitchenette": 0, "hotel_rating": 8.4, "address": "456 Mall Road, Lahore, Pakistan", "description": "Un hôtel moderne situé à proximité des attractions culturelles de Lahore, idéal pour les voyages d'affaires et les séjours en famille."},
                {"name": "Islamabad Vista", "city": "Islamabad", "stars": 3, "rooms": 8, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 0, "parking": 0, "restaurant": 1, "piscine": 0, "spa": 0, "gym": 0, "price_per_night": 100.0, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "Pas de restauration", "kitchenette": 0, "hotel_rating": 6.5, "address": "789 Jinnah Avenue, Islamabad, Pakistan", "description": "Hôtel confortable et abordable avec un accès facile aux quartiers administratifs et diplomatiques."},

                # Bangladesh
                {"name": "Dhaka Suites", "city": "Dhaka", "stars": 5, "rooms": 10, "adults_per_room": 2, "children_per_room": 1, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 400.0, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "half_board", "kitchenette": 0, "hotel_rating": 9.0, "address": "123 Gulshan Avenue, Dhaka, Bangladesh", "description": "Le Dhaka Suites est un hôtel de luxe situé dans le quartier branché de Gulshan, offrant une piscine sur le toit, un spa exclusif et un restaurant gastronomique."},
                {"name": "Chittagong Lodge", "city": "Chittagong", "stars": 3, "rooms": 6, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 0, "parking": 0, "restaurant": 1, "piscine": 0, "spa": 0, "gym": 0, "price_per_night": 90.0, "free_wifi": 0, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "Pas de restauration", "kitchenette": 0, "hotel_rating": 7.0, "address": "456 Agrabad Commercial Area, Chittagong, Bangladesh", "description": "Hôtel économique situé dans le quartier commercial d'Agrabad, offrant un accès facile aux marchés et aux restaurants locaux."},
                {"name": "Khulna Royal", "city": "Khulna", "stars": 4, "rooms": 8, "adults_per_room": 3, "children_per_room": 1, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 0, "gym": 1, "price_per_night": 200.0, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "breakfast", "kitchenette": 1, "hotel_rating": 8.5, "address": "789 Jessore Road, Khulna, Bangladesh", "description": "Situé au cœur de Khulna, le Khulna Royal offre un hébergement élégant avec une piscine extérieure et une cuisine raffinée aux influences locales."},

                # Mexique
                {"name": "Mexico City Grand", "city": "Mexico City", "stars": 5, "rooms": 12, "adults_per_room": 3, "children_per_room": 2, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 400, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 1, "meal_plan": "breakfast", "kitchenette": 0, "hotel_rating": 9.0, "address": "123 Paseo de la Reforma, Mexico City, Mexique", "description": "Hôtel luxueux avec une vue panoramique sur Mexico et un spa de classe mondiale."},
                {"name": "Guadalajara Inn", "city": "Guadalajara", "stars": 4, "rooms": 10, "adults_per_room": 3, "children_per_room": 1, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 0, "gym": 1, "price_per_night": 180, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "Pas de restauration", "kitchenette": 1, "hotel_rating": 7.5, "address": "456 Avenida Vallarta, Guadalajara, Mexique", "description": "Un hôtel moderne avec piscine et restaurant, parfait pour découvrir Guadalajara."},
                {"name": "Monterrey Elite", "city": "Monterrey", "stars": 3, "rooms": 8, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 0, "parking": 0, "restaurant": 1, "piscine": 0, "spa": 0, "gym": 1, "price_per_night": 120, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 0, "washing_machine": 0, "meal_plan": "half_board", "kitchenette": 0, "hotel_rating": 6.8, "address": "789 Calle Hidalgo, Monterrey, Mexique", "description": "Un hôtel abordable avec un accès facile aux centres commerciaux et aux attractions locales."},
                
                # Cuba
                {"name": "La Havane Suites", "city": "La Havane", "stars": 5, "rooms": 10, "adults_per_room": 3, "children_per_room": 1, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 500, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 1, "meal_plan": "full_board", "kitchenette": 1, "hotel_rating": 9.5, "address": "123 Calle Obispo, La Havane, Cuba", "description": "Un luxueux hôtel 5 étoiles au cœur de La Havane avec une vue imprenable sur le Malecón et un spa de renom."},
                {"name": "Santiago Paradis", "city": "Santiago", "stars": 4, "rooms": 8, "adults_per_room": 3, "children_per_room": 1, "pets_allowed": 0, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 0, "gym": 0, "price_per_night": 150, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 0, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "breakfast", "kitchenette": 0, "hotel_rating": 7.0, "address": "456 Avenida Manduley, Santiago, Cuba", "description": "Situé dans le centre historique, cet hôtel 4 étoiles offre une vue sur la Sierra Maestra et une ambiance tropicale unique."},
                {"name": "Camagüey Inn", "city": "Camagüey", "stars": 3, "rooms": 6, "adults_per_room": 1, "children_per_room": 2, "pets_allowed": 0, "parking": 0, "restaurant": 1, "piscine": 0, "spa": 0, "gym": 0, "price_per_night": 90, "free_wifi": 0, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 0, "washing_machine": 0, "meal_plan": "Pas de restauration", "kitchenette": 0, "hotel_rating": 6.2, "address": "789 Calle República, Camagüey, Cuba", "description": "Petit hôtel économique parfait pour les voyageurs à la recherche d’authenticité dans une ville coloniale préservée."},

                # Guatemala
                {"name": "Guatemala City Oasis", "city": "Guatemala City", "stars": 5, "rooms": 12, "adults_per_room": 3, "children_per_room": 2, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 420, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 1, "meal_plan": "half_board", "kitchenette": 1, "hotel_rating": 9.2, "address": "123 Zona 10, Guatemala City, Guatemala", "description": "Un havre de luxe au cœur de la capitale guatémaltèque, parfait pour les voyages d'affaires et de loisirs."},
                {"name": "Mixco View", "city": "Mixco", "stars": 4, "rooms": 9, "adults_per_room": 3, "children_per_room": 1, "pets_allowed": 1, "parking": 1, "restaurant": 0, "piscine": 1, "spa": 0, "gym": 1, "price_per_night": 160, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "breakfast", "kitchenette": 0, "hotel_rating": 7.8, "address": "456 Calle Mixco, Guatemala", "description": "Un hôtel moderne offrant une vue panoramique sur la vallée avec un accès facile aux randonnées et aux sites historiques."},
                {"name": "Villa Nueva Lodge", "city": "Villa Nueva", "stars": 1, "rooms": 8, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 0, "parking": 0, "restaurant": 1, "piscine": 0, "spa": 0, "gym": 0, "price_per_night": 110, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 0, "washing_machine": 0, "meal_plan": "Pas de restauration", "kitchenette": 1, "hotel_rating": 6.5, "address": "789 Avenida Reforma, Villa Nueva, Guatemala", "description": "Un hôtel abordable pour les voyageurs cherchant un hébergement simple près des sites culturels locaux."},

                # Brésil
                {"name": "São Paulo Palace", "city": "São Paulo", "stars": 5, "rooms": 10, "adults_per_room": 3, "children_per_room": 2, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 460, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 1, "meal_plan": "full_board", "kitchenette": 0, "hotel_rating": 9.4, "address": "123 Avenida Paulista, São Paulo, Brésil", "description": "Un hôtel 5 étoiles élégant offrant une vue imprenable sur São Paulo et des services de classe mondiale."},
                {"name": "Rio de Janeiro Comfort", "city": "Rio de Janeiro", "stars": 4, "rooms": 9, "adults_per_room": 3, "children_per_room": 1, "pets_allowed": 0, "parking": 0, "restaurant": 1, "piscine": 1, "spa": 0, "gym": 0, "price_per_night": 150, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "breakfast", "kitchenette": 0, "hotel_rating": 7.3, "address": "456 Copacabana, Rio de Janeiro, Brésil", "description": "Hôtel charmant situé à quelques minutes de la célèbre plage de Copacabana avec une piscine sur le toit."},
                {"name": "Brasília Grand", "city": "Brasília", "stars": 3, "rooms": 8, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 0, "parking": 0, "restaurant": 1, "piscine": 0, "spa": 0, "gym": 1, "price_per_night": 130, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 0, "washing_machine": 0, "meal_plan": "Pas de restauration", "kitchenette": 0, "hotel_rating": 6.7, "address": "789 Esplanada dos Ministérios, Brasília, Brésil", "description": "Hôtel pratique pour les voyageurs en déplacement, situé à proximité des institutions gouvernementales et des musées."},

                # Argentine
                {"name": "Buenos Aires Skyview Hotel", "city": "Buenos Aires", "stars": 3, "rooms": 40, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 0, "parking": 0, "restaurant": 1, "piscine": 0, "spa": 0, "gym": 1, "price_per_night": 120, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "breakfast", "kitchenette": 0, "hotel_rating": 7.5, "address": "123 Avenida Corrientes, Buenos Aires, Argentine", "description": "Hôtel central offrant une vue panoramique sur la ville, proche des théâtres et restaurants de Buenos Aires."},
                {"name": "Córdoba Plaza Hotel", "city": "Córdoba", "stars": 4, "rooms": 45, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 0, "gym": 1, "price_per_night": 180, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 0, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "half_board", "kitchenette": 1, "hotel_rating": 8.2, "address": "456 Plaza San Martín, Córdoba, Argentine", "description": "Un hôtel moderne offrant un accès rapide aux quartiers historiques et au centre commercial Patio Olmos."},
                {"name": "Rosario Riverside Hotel", "city": "Rosario", "stars": 4, "rooms": 35, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 0, "gym": 1, "price_per_night": 150, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "Pas de restauration", "kitchenette": 0, "hotel_rating": 8.0, "address": "789 Boulevard Oroño, Rosario, Argentine", "description": "Hôtel charmant situé sur les rives du Paraná, idéal pour les promenades en bord de fleuve."},

                # Colombie
                {"name": "Bogotá Colonial Suites", "city": "Bogotá", "stars": 3, "rooms": 40, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 0, "parking": 0, "restaurant": 1, "piscine": 0, "spa": 0, "gym": 1, "price_per_night": 100, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "breakfast", "kitchenette": 0, "hotel_rating": 7.0, "address": "123 Calle 10, Bogotá, Colombie", "description": "Hôtel colonial offrant un accès facile au quartier historique de La Candelaria et aux musées de la ville."},
                {"name": "Medellín Mountain View Hotel", "city": "Medellín", "stars": 4, "rooms": 50, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 0, "gym": 1, "price_per_night": 200, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "half_board", "kitchenette": 0, "hotel_rating": 8.5, "address": "456 Avenida El Poblado, Medellín, Colombie", "description": "Hôtel moderne avec vue sur les montagnes et un accès rapide au quartier branché de Poblado."},
                {"name": "Cali Palm Resort", "city": "Cali", "stars": 4, "rooms": 45, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 0, "gym": 1, "price_per_night": 175, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "breakfast", "kitchenette": 0, "hotel_rating": 8.0, "address": "789 Carrera 5, Cali, Colombie", "description": "Un magnifique complexe avec piscine entouré de palmiers, parfait pour les amateurs de salsa et de soleil."},

                # Chili
                {"name": "Hotel Santiago Plaza", "city": "Santiago", "stars": 4, "rooms": 50, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 0, "gym": 1, "price_per_night": 220, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "breakfast", "kitchenette": 0, "hotel_rating": 8.3, "address": "123 Alameda, Santiago, Chili", "description": "Un hôtel 4 étoiles idéalement situé dans le centre de Santiago, à proximité des sites culturels et des restaurants gastronomiques."},
                {"name": "Valparaíso Beachside Hotel", "city": "Valparaíso", "stars": 5, "rooms": 35, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 0, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 250, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "half_board", "kitchenette": 1, "hotel_rating": 9.0, "address": "456 Paseo Yugoslavo, Valparaíso, Chili", "description": "Un luxueux hôtel en bord de mer offrant une vue spectaculaire sur le Pacifique et une ambiance bohème unique."},
                {"name": "Concepción Central Hotel", "city": "Concepción", "stars": 3, "rooms": 40, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 0, "parking": 0, "restaurant": 1, "piscine": 0, "spa": 0, "gym": 1, "price_per_night": 130, "free_wifi": 0, "ev_charging": 0, "wheelchair_accessible": 1, "air_conditioning": 0, "washing_machine": 0, "meal_plan": "Pas de restauration", "kitchenette": 0, "hotel_rating": 7.3, "address": "789 Avenida Los Carrera, Concepción, Chili", "description": "Hôtel confortable et abordable en plein centre-ville, idéal pour les voyages d'affaires et les courts séjours."},
                
                # Pérou
                {"name": "Lima City View Suites", "city": "Lima", "stars": 4, "rooms": 55, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 0, "gym": 1, "price_per_night": 180, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "breakfast", "kitchenette": 1, "hotel_rating": 8.5, "address": "123 Av. Larco, Lima, Pérou", "description": "Un hôtel moderne avec vue panoramique sur Lima, idéalement situé à Miraflores, près du bord de mer."},
                {"name": "Arequipa Boutique Hotel", "city": "Arequipa", "stars": 5, "rooms": 25, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 0, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 220, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "breakfast", "kitchenette": 0, "hotel_rating": 9.0, "address": "456 Calle Santa Catalina, Arequipa, Pérou", "description": "Hôtel de luxe avec une architecture coloniale, situé à proximité du monastère de Santa Catalina."},
                {"name": "Trujillo Classic Hotel", "city": "Trujillo", "stars": 3, "rooms": 30, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 0, "parking": 0, "restaurant": 1, "piscine": 0, "spa": 0, "gym": 1, "price_per_night": 120, "free_wifi": 0, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "Pas de restauration", "kitchenette": 0, "hotel_rating": 7.2, "address": "789 Av. España, Trujillo, Pérou", "description": "Un hôtel confortable et abordable, proche des sites archéologiques de Chan Chan et Huaca del Sol."},

                # Allemagne
                {"name": "Berlin City Hotel", "city": "Berlin", "stars": 4, "rooms": 70, "adults_per_room": 1, "children_per_room": 0, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 0, "gym": 1, "price_per_night": 180, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "breakfast", "kitchenette": 0, "hotel_rating": 8.2, "address": "123 Friedrichstrasse, Berlin, Allemagne", "description": "Un hôtel élégant et moderne situé au cœur de Berlin, parfait pour explorer la Porte de Brandebourg."},
                {"name": "Hotel München Deluxe", "city": "Munich", "stars": 5, "rooms": 30, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 0, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 350, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "half_board", "kitchenette": 0, "hotel_rating": 9.0, "address": "456 Marienplatz, Munich, Allemagne", "description": "Un hôtel luxueux offrant une vue imprenable sur la ville et un accès rapide aux brasseries bavaroises."},
                {"name": "Hamburg Central Suites", "city": "Hambourg", "stars": 4, "rooms": 40, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 0, "gym": 1, "price_per_night": 150, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 0, "air_conditioning": 1, "washing_machine": 1, "meal_plan": "Pas de restauration", "kitchenette": 1, "hotel_rating": 7.8, "address": "789 Reeperbahn, Hambourg, Allemagne", "description": "Un hôtel chic en plein centre, parfait pour découvrir la vie nocturne et les musées du port."},

                # Royaume-Uni
                {"name": "The Big Ben Suites", "city": "Londres", "stars": 5, "rooms": 50, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 0, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 400, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "full_board", "kitchenette": 0, "hotel_rating": 9.2, "address": "123 Westminster, Londres, Royaume-Uni", "description": "Un hôtel prestigieux situé près de Big Ben et du Palais de Westminster."},
                {"name": "Manchester City Park Hotel", "city": "Manchester", "stars": 4, "rooms": 60, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 0, "gym": 1, "price_per_night": 250, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 0, "washing_machine": 1, "meal_plan": "breakfast", "kitchenette": 0, "hotel_rating": 8.0, "address": "456 Piccadilly, Manchester, Royaume-Uni", "description": "Un hôtel moderne proche des quartiers animés et des stades de football."},
                {"name": "Birmingham Luxury Tower", "city": "Birmingham", "stars": 5, "rooms": 30, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 0, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 450, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "half_board", "kitchenette": 0, "hotel_rating": 9.5, "address": "789 New Street, Birmingham, Royaume-Uni", "description": "Un hôtel raffiné avec spa et vue panoramique sur la ville."},

                # Australie
                {"name": "Sydney Opera House Hotel", "city": "Sydney", "stars": 5, "rooms": 50, "adults_per_room": 1, "children_per_room": 0, "pets_allowed": 0, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 500, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "full_board", "kitchenette": 0, "hotel_rating": 9.8, "address": "123 Circular Quay, Sydney, Australie", "description": "Un hôtel emblématique offrant une vue imprenable sur l'Opéra de Sydney et le Harbour Bridge."},
                {"name": "Melbourne Cityscape Suites", "city": "Melbourne", "stars": 5, "rooms": 30, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 0, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 400, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 1, "meal_plan": "breakfast", "kitchenette": 1, "hotel_rating": 9.3, "address": "123 Collins St, Melbourne, VIC 3000, Australie", "description": "Un hôtel 5 étoiles offrant une vue imprenable sur le centre-ville de Melbourne, avec un spa luxueux, une piscine intérieure et un accès direct aux meilleures boutiques et restaurants."},
                {"name": "Brisbane Tower Suites", "city": "Brisbane", "stars": 5, "rooms": 30, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 0, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 300, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 1, "meal_plan": "Pas de restauration", "kitchenette": 1, "hotel_rating": 8.7, "address": "456 Queen St, Brisbane, QLD 4000, Australie", "description": "Situé au cœur de Brisbane, cet hôtel moderne propose des suites élégantes avec kitchenette, une piscine panoramique et un centre de remise en forme haut de gamme."},

                # Nouvelle-Zélande
                {"name": "Auckland Waterfront Hotel", "city": "Auckland", "stars": 4, "rooms": 55, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 0, "gym": 1, "price_per_night": 180, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 0, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "breakfast", "kitchenette": 0, "hotel_rating": 8.1, "address": "123 Quay Street, Auckland, Nouvelle-Zélande", "description": "Hôtel avec vue sur le port d'Auckland, idéal pour les voyageurs en quête de détente et de découvertes urbaines."},
                {"name": "Wellington City View Suites", "city": "Wellington", "stars": 5, "rooms": 40, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 0, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 320, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 1, "meal_plan": "half_board", "kitchenette": 1, "hotel_rating": 9.1, "address": "456 Lambton Quay, Wellington, Nouvelle-Zélande", "description": "Un hôtel luxueux offrant une vue imprenable sur la ville et un accès rapide aux musées et restaurants locaux."},
                {"name": "Christchurch Luxury Suites", "city": "Christchurch", "stars": 4, "rooms": 50, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 0, "gym": 1, "price_per_night": 200, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 0, "air_conditioning": 0, "washing_machine": 1, "meal_plan": "Pas de restauration", "kitchenette": 1, "hotel_rating": 7.9, "address": "789 Cathedral Square, Christchurch, Nouvelle-Zélande", "description": "Un établissement raffiné, parfait pour explorer le jardin botanique et les vignobles environnants."},

                # Papouasie-Nouvelle-Guinée
                {"name": "Port Moresby International Hotel", "city": "Port Moresby", "stars": 4, "rooms": 40, "adults_per_room": 1, "children_per_room": 0, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 0, "gym": 1, "price_per_night": 200, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "breakfast", "kitchenette": 0, "hotel_rating": 8.5, "address": "123 Ela Beach Road, Port Moresby, Papouasie-Nouvelle-Guinée", "description": "Hôtel international avec piscine et centre d'affaires, parfait pour les séjours d'affaires et les explorations culturelles."},
                {"name": "Lae Lakeside Resort", "city": "Lae", "stars": 5, "rooms": 25, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 0, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 350, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "half_board", "kitchenette": 0, "hotel_rating": 9.0, "address": "456 Coronation Drive, Lae, Papouasie-Nouvelle-Guinée", "description": "Un hôtel au bord du lac avec des activités nautiques et un spa exclusif."},
                {"name": "Mount Hagen Mountain Resort", "city": "Mount Hagen", "stars": 3, "rooms": 30, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 0, "parking": 0, "restaurant": 1, "piscine": 0, "spa": 0, "gym": 0, "price_per_night": 120, "free_wifi": 0, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 0, "washing_machine": 0, "meal_plan": "Pas de restauration", "kitchenette": 0, "hotel_rating": 7.2, "address": "789 Highlands Highway, Mount Hagen, Papouasie-Nouvelle-Guinée", "description": "Un lodge rustique idéal pour les amateurs de randonnée et d’aventure en pleine nature."},

                # Fidji
                {"name": "Suva Beachfront Hotel", "city": "Suva", "stars": 4, "rooms": 45, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 0, "gym": 1, "price_per_night": 220, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "breakfast", "kitchenette": 0, "hotel_rating": 8.1, "address": "123 Queen Elizabeth Drive, Suva, Fidji", "description": "Un hôtel de luxe avec accès direct à la plage, idéal pour les amateurs de sports nautiques et de détente."},
                {"name": "Nadi Resort & Spa", "city": "Nadi", "stars": 5, "rooms": 30, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 0, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 400, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "half_board", "kitchenette": 0, "hotel_rating": 9.2, "address": "456 Wailoaloa Beach, Nadi, Fidji", "description": "Un complexe balnéaire exclusif avec spa et accès à des excursions en bateau."},
                {"name": "Lautoka Coastal Inn", "city": "Lautoka", "stars": 3, "rooms": 35, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 0, "parking": 0, "restaurant": 1, "piscine": 0, "spa": 0, "gym": 1, "price_per_night": 180, "free_wifi": 0, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 0, "washing_machine": 0, "meal_plan": "Pas de restauration", "kitchenette": 0, "hotel_rating": 7.8, "address": "789 Vitogo Parade, Lautoka, Fidji", "description": "Un hôtel abordable pour les voyageurs souhaitant découvrir la côte de Lautoka."},

                # Samoa
                {"name": "Apia Seaside Hotel", "city": "Apia", "stars": 4, "rooms": 40, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 1, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 0, "gym": 1, "price_per_night": 250, "free_wifi": 1, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "breakfast", "kitchenette": 1, "hotel_rating": 8.3, "address": "123 Beach Road, Apia, Samoa", "description": "Un hôtel en bord de mer avec un accès direct à la plage, parfait pour les voyageurs en quête de détente tropicale."},
                {"name": "Salelologa View Hotel", "city": "Salelologa", "stars": 5, "rooms": 25, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 0, "parking": 1, "restaurant": 1, "piscine": 1, "spa": 1, "gym": 1, "price_per_night": 450, "free_wifi": 1, "ev_charging": 1, "wheelchair_accessible": 1, "air_conditioning": 1, "washing_machine": 0, "meal_plan": "full_board", "kitchenette": 0, "hotel_rating": 9.4, "address": "456 Ocean View Road, Salelologa, Samoa", "description": "Un complexe de luxe offrant une vue panoramique sur l'océan, un spa de premier ordre et une cuisine gastronomique."},
                {"name": "Asau Pacific Inn", "city": "Asau", "stars": 3, "rooms": 35, "adults_per_room": 2, "children_per_room": 2, "pets_allowed": 0, "parking": 0, "restaurant": 1, "piscine": 0, "spa": 0, "gym": 0, "price_per_night": 100, "free_wifi": 0, "ev_charging": 0, "wheelchair_accessible": 0, "air_conditioning": 0, "washing_machine": 0, "meal_plan": "Pas de restauration", "kitchenette": 0, "hotel_rating": 6.9, "address": "789 Island Road, Asau, Samoa", "description": "Un hébergement économique situé au cœur de la nature samoane, idéal pour les aventuriers et les randonneurs."},
    ]

            for hotel in hotels_data:
                cursor.execute('SELECT id FROM cities WHERE name = ?', (hotel['city'],))
                city_row = cursor.fetchone()
                if city_row is None:
                    print(f"Erreur : La ville '{hotel['city']}' n'a pas été trouvée dans la base de données.")
                    continue  # Passer à l'hôtel suivant si la ville n'existe pas
                city_id = city_row['id']

                # Vérifie si les coordonnées existent déjà dans la base de données
                cursor.execute('SELECT latitude, longitude FROM hotels WHERE name = ? AND city_id = ?', 
                               (hotel['name'], city_id))
                existing_coords = cursor.fetchone()

                if existing_coords and existing_coords[0] is not None and existing_coords[1] is not None:
                    latitude, longitude = existing_coords
                else:
                    latitude, longitude = get_coordinates(hotel['address'])  # Appel API uniquement si nécessaire

                cursor.execute('''INSERT OR IGNORE INTO hotels (
                    name, city_id, stars, rooms, adults_per_room, children_per_room,
                    pets_allowed, parking, restaurant, piscine, spa, gym, price_per_night,
                    free_wifi, ev_charging, wheelchair_accessible, air_conditioning, washing_machine, meal_plan, kitchenette,
                    hotel_rating, address, description, latitude, longitude, available_from, available_to
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''', (
                    hotel['name'], city_id, hotel['stars'], hotel['rooms'], hotel['adults_per_room'],
                    hotel['children_per_room'], hotel['pets_allowed'], hotel['parking'],
                    hotel['restaurant'], hotel['piscine'], hotel['spa'], hotel['gym'], hotel['price_per_night'], hotel['free_wifi'],
                    hotel['ev_charging'], hotel['wheelchair_accessible'], hotel['air_conditioning'], hotel['washing_machine'],
                    hotel['meal_plan'], hotel['kitchenette'], hotel['hotel_rating'], hotel['address'], hotel['description'],
                    latitude, longitude, 
                    (datetime.now() + timedelta(days=random.randint(1, 30))).strftime('%Y-%m-%d'),
                    (datetime.now() + timedelta(days=random.randint(31, 60))).strftime('%Y-%m-%d'),
                ))

                # Pause pour éviter de dépasser la limite d'appels à l'API
                time.sleep(0.5)

            conn.commit()
        except sqlite3.Error as e:
            conn.rollback()
            logging.error(f"Erreur lors de l'insertion des données : {e}")
            
def ajouter_avis_fictifs():
    # Connexion à la BDD hotels.db
    conn_hotels = sqlite3.connect('hotels.db')
    cursor_hotels = conn_hotels.cursor()
    
    # Connexion à la BDD inscription.db pour récupérer les utilisateurs existants
    conn_clients = sqlite3.connect('inscription.db')
    cursor_clients = conn_clients.cursor()
    
    # Création de la table reviews si elle n'existe pas
    cursor_hotels.execute('''
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hotel_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
            comment TEXT,
            date_posted DATE DEFAULT CURRENT_DATE,
            FOREIGN KEY (hotel_id) REFERENCES hotels(id),
            FOREIGN KEY (user_id) REFERENCES Users(id_user)
        )
    ''')
    conn_hotels.commit()
    
    # Récupérer tous les utilisateurs de inscription.db
    cursor_clients.execute("SELECT id_user FROM Users")
    users = [row[0] for row in cursor_clients.fetchall()]
    
    # Vérifier s'il y a des utilisateurs dans la BDD
    if not users:
        print("⚠ Aucun utilisateur trouvé dans inscription.db. Ajoutez des utilisateurs avant d'insérer des avis.")
    else:
        # Récupérer tous les hôtels
        cursor_hotels.execute("SELECT id, hotel_rating FROM hotels")
        hotels = cursor_hotels.fetchall()
    
        for hotel in hotels:
            hotel_id, hotel_rating = hotel
            num_reviews = random.randint(1, 10)  # Nombre aléatoire d'avis par hôtel
    
            for _ in range(num_reviews):
                user_id = random.choice(users)  # Sélectionner un utilisateur aléatoire
                # Générer une note autour de hotel_rating
                rating = max(1, min(5, round(random.gauss(hotel_rating / 2, 1))))  # Distribution autour de la moyenne
                # Générer un commentaire fictif
                comments = [
                    "Excellent service et très bon emplacement.",
                    "Chambres propres et confortables.",
                    "Bonne expérience mais quelques points à améliorer.",
                    "Bruyant la nuit, mais personnel sympathique.",
                    "Le petit-déjeuner était incroyable !",
                    "Rapport qualité/prix correct.",
                    "Expérience décevante, je ne reviendrai pas.",
                    "Séjour parfait, je recommande cet hôtel !",
                    "Hôtel bien situé, mais un peu cher pour les prestations.",
                    "Piscine et spa exceptionnels, séjour très agréable."
                ]
                comment = random.choice(comments)
                date_posted = datetime.now().strftime('%Y-%m-%d')
    
                # Insérer l'avis dans la table reviews
                cursor_hotels.execute('''
                    INSERT INTO reviews (hotel_id, user_id, rating, comment, date_posted)
                    VALUES (?, ?, ?, ?, ?)
                ''', (hotel_id, user_id, rating, comment, date_posted))
    
        conn_hotels.commit()
        print("✅ Avis fictifs insérés avec succès.")

def update_hotel_coordinates():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, address FROM hotels WHERE latitude IS NULL OR longitude IS NULL")
        hotels = cursor.fetchall()

        for hotel in hotels:
            hotel_id, address = hotel
            lat, lng = get_coordinates(address)

            if lat is not None and lng is not None:
                cursor.execute("UPDATE hotels SET latitude = ?, longitude = ? WHERE id = ?", (lat, lng, hotel_id))
                conn.commit()
                print(f"✅ Coordonnées mises à jour pour {address} ({lat}, {lng})")
            else:
                print(f"❌ Impossible de trouver les coordonnées de {address}")

            # Pause pour éviter les limites de l'API
            time.sleep(0.5)

# Fonction pour assigner aléatoirement des images aux hôtels
def assign_hotel_images():
    images = ["hotel1.jpg", "hotel2.jpg", "hotel3.jpg", "hotel4.jpg", "hotel5.jpg","hotel6.jpg", "hotel7.jpg", "hotel8.jpg", "hotel9.jpg", "hotel10.jpg"]
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM hotels")
        hotels = cursor.fetchall()
        for hotel in hotels:
            image = random.choice(images)
            cursor.execute("UPDATE hotels SET image_url = ? WHERE id = ?", (image, hotel["id"]))
        conn.commit()

# Fonction pour récupérer les hôtels avec leurs images
@app.route('/hotels', methods=['GET'])
def get_hotels():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, city_id, image_url FROM hotels")
        hotels = [{"id": row["id"], "name": row["name"], "city_id": row["city_id"], "image": f"/static/Image/{row['image_url']}"} for row in cursor.fetchall()]
        return jsonify(hotels)

#Insertion des avis fictifs pour les hôtels
def insert_reviews():
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Insertion des avis pour chaque hôtel
        for hotel in hotels_data: # type: ignore
            # Récupérer l'ID de l'hôtel en fonction de son nom
            hotel_id = cursor.execute('SELECT id FROM hotels WHERE name = ?', (hotel["name"],)).fetchone()['id']

            for i in range(5):  # Créer 5 avis fictifs pour chaque hôtel
                # Générer un nom d'utilisateur aléatoire
                user_name = f"User{random.randint(1, 100)}"
                # Générer une note aléatoire entre 1 et 5
                rating = random.randint(1, 5)
                # Générer un commentaire aléatoire
                comment = f"Comment {i+1} for {hotel['name']}"

                # Insertion de l'avis dans la table reviews
                cursor.execute('''INSERT INTO reviews (hotel_id, user_name, rating, comment) 
                                VALUES (?, ?, ?, ?)''', (hotel_id, user_name, rating, comment))

    conn.commit()
    
# Fonction pour démarrer l'application Flask
if __name__ == '__main__':
    # Initialisations avant de démarrer le serveur
    with app.app_context():  # Créer un contexte d'application Flask
        print("📌 Création des tables...")
        #create_tables()  

        print("📌 Insertion des données...")
        #insert_data()

        print("📌 Insertion des avis fictifs...")

        print("📌 Mise à jour des coordonnées GPS...")
        update_hotel_coordinates()  

        print("📌 Attribution des images...")
        assign_hotel_images()

    print("🚀 Lancement du serveur Flask...")
    app.run(debug=True)