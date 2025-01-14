import sqlite3
from flask import Flask, request, jsonify, g
import re

app = Flask(__name__)

# Fonction pour gérer la connexion à la base de données
def get_db_connection():
    if not hasattr(g, 'sqlite_db'):
        g.sqlite_db = sqlite3.connect('calendrier.db')  # Remplace 'calendrier.db' par ton nom de fichier de base de données
        g.sqlite_db.row_factory = sqlite3.Row  # Retourne les résultats en format dictionnaire
    return g.sqlite_db

# Fermeture de la connexion à la base de données
@app.teardown_appcontext
def close_db_connection(exception):
    if hasattr(g, 'sqlite_db'):
        g.sqlite_db.close()

# Fonction pour initialiser la base de données
def create_tables():
    conn = get_db_connection()  # Créer une nouvelle connexion pour cette fonction
    cursor = conn.cursor()
    # Création de la table 'hotels' par exemple (ajuste les champs selon tes besoins)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS hotels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            address TEXT NOT NULL,
            available_from DATE NOT NULL,
            available_to DATE NOT NULL,
            price_per_night REAL NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

# Fonction pour insérer des données de test
def insert_data():
    conn = sqlite3.connect('calendrier.db')  # Ouvre une nouvelle connexion à la base de données
    cursor = conn.cursor()
    # Exemple de données de test
    cursor.execute('''
        INSERT INTO hotels (name, address, available_from, available_to, price_per_night)
        VALUES (?, ?, ?, ?, ?)
    ''', ('Hotel 1', 'Paris, France', '2025-01-01', '2025-01-10', 100.0))
    cursor.execute('''
        INSERT INTO hotels (name, address, available_from, available_to, price_per_night)
        VALUES (?, ?, ?, ?, ?)
    ''', ('Hotel 2', 'Lyon, France', '2025-02-01', '2025-02-10', 120.0))
    conn.commit()
    conn.close()

# Fonction de recherche et de validation des dates
@app.route('/recherche', methods=['POST'])
def search():
    date_range = request.form.get('date_range')  # Obtenir les dates sélectionnées
    
    # Vérification du format des dates (jour-mois-année)
    if date_range:
        # Expression régulière pour valider le format des dates
        date_pattern = r'(\d{2}-\d{2}-\d{4})'
        dates = re.findall(date_pattern, date_range)
        
        if len(dates) == 2:  # Si on a bien deux dates
            start_date, end_date = dates
            # Ici, tu peux utiliser ces dates pour une recherche réelle dans ta base de données
            response = {
                "status": "success",
                "message": "Recherche en cours...",
                "dates": [start_date, end_date]
            }
            return jsonify(response), 200
        else:
            # Si le format des dates est incorrect, renvoi d'un message d'erreur
            response = {
                "status": "error",
                "message": "Format de date invalide. Utilisez le format : jour-mois-année."
            }
            return jsonify(response), 400
    else:
        # Si aucune date n'est fournie
        response = {
            "status": "error",
            "message": "Aucune date spécifiée."
        }
        return jsonify(response), 400

# Fonction de recherche pour l'autocomplétion
@app.route('/api/search', methods=['GET'])
def api_search():
    query = request.args.get('query')  # Récupérer la valeur du paramètre 'query' dans l'URL
    if query:
        # Logique de recherche dans la base de données
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT name FROM hotels WHERE name LIKE ?', ('%' + query + '%',))
        suggestions = cursor.fetchall()
        conn.close()

        # Formater les suggestions sous forme de liste de dictionnaires
        result = [{'type': 'hotel', 'name': row['name']} for row in suggestions]
        
        # Retourner les suggestions sous format JSON
        return jsonify(result)

    # Si aucune requête 'query' n'est fournie, retourner une liste vide
    return jsonify([])

if __name__ == '__main__':
    with app.app_context():  # Crée un contexte d'application Flask pour exécuter ces fonctions
        create_tables()  # Crée la table 'hotels' si elle n'existe pas
        insert_data()    # Insère des données de test dans la table 'hotels'
    app.run(debug=True, port=5002)
