# Lancer le serveur  python3  -m http.server 8000
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

@app.route('/reservation')
def reservation():
    return render_template('reservations.html')

if __name__ == '__main__':
    app.run(debug=True)