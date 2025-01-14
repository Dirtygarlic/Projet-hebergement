import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Autorise les requêtes CORS

# Connexion à la base de données
def get_db_connection():
    conn = sqlite3.connect('localisation.db')
    conn.row_factory = sqlite3.Row  # Accès par nom de colonne
    return conn

# Création des tables si elles n'existent pas
def create_tables():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Continents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Countries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        continent_id INTEGER,
        FOREIGN KEY (continent_id) REFERENCES Continents(id)
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Cities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        country_id INTEGER,
        FOREIGN KEY (country_id) REFERENCES Countries(id)
    )
    ''')

    conn.commit()
    conn.close()

# Insérer les données dans la base
def insert_data():
    continents_data = ['Europe', 'Asia', 'Africa', 'North America', 'South America', 'Oceania', 'Antarctica']
    countries_data = {
        'Europe': ['France', 'Germany', 'Spain', 'Italy', 'United Kingdom', 'Poland', 'Netherlands'],
        'Asia': ['China', 'India', 'Japan', 'South Korea', 'Thailand', 'Indonesia', 'Vietnam'],
        'Africa': ['Nigeria', 'South Africa', 'Egypt', 'Kenya', 'Morocco', 'Ethiopia', 'Algeria'],
        'North America': ['United States', 'Canada', 'Mexico', 'Cuba', 'Guatemala'],
        'South America': ['Brazil', 'Argentina', 'Colombia', 'Chile', 'Peru'],
        'Oceania': ['Australia', 'New Zealand', 'Fiji', 'Papua New Guinea'],
        'Antarctica': []
    }
    cities_data = {
        'France': ['Paris', 'Marseille', 'Lyon'],
        'Germany': ['Berlin', 'Munich', 'Hamburg'],
        'China': ['Beijing', 'Shanghai', 'Hong Kong'],
        'India': ['New Delhi', 'Mumbai', 'Bangalore'],
        'Spain': ['Madrid', 'Barcelona', 'Seville'],
        'Italy': ['Rome', 'Milan', 'Florence'],
        'United Kingdom': ['London', 'Manchester', 'Birmingham'],
        'Poland': ['Warsaw', 'Krakow'],
        'United States': ['New York', 'Los Angeles', 'Chicago'],
        'Australia': ['Sydney', 'Melbourne']
    }

    conn = get_db_connection()
    cursor = conn.cursor()

    # Insertion des continents
    for continent in continents_data:
        cursor.execute('INSERT INTO Continents (name) VALUES (?)', (continent,))

    # Insertion des pays et villes
    for continent, countries in countries_data.items():
        continent_id = cursor.execute('SELECT id FROM Continents WHERE name = ?', (continent,)).fetchone()[0]
        for country in countries:
            cursor.execute('INSERT INTO Countries (name, continent_id) VALUES (?, ?)', (country, continent_id))
            country_id = cursor.lastrowid
            for city in cities_data.get(country, []):
                cursor.execute('INSERT INTO Cities (name, country_id) VALUES (?, ?)', (city, country_id))

    conn.commit()
    conn.close()

# API pour la recherche
@app.route('/api/search', methods=['GET'])
def search():
    query = request.args.get('query')
    
    if not query or len(query) < 3:
        return jsonify([])  # Retourne une liste vide si la requête est trop courte

    conn = get_db_connection()
    cursor = conn.cursor()

    # Recherche des continents
    cursor.execute('''
    SELECT DISTINCT name FROM Continents WHERE name LIKE ? LIMIT 5
    ''', (f'%{query}%',))
    continent_suggestions = cursor.fetchall()

    # Recherche des pays d'un continent ou par nom
    cursor.execute('''
    SELECT DISTINCT Countries.name FROM Countries
    JOIN Continents ON Countries.continent_id = Continents.id
    WHERE Continents.name LIKE ? OR Countries.name LIKE ? LIMIT 5
    ''', (f'%{query}%', f'%{query}%'))
    country_suggestions = cursor.fetchall()

    # Recherche des villes d'un pays ou par nom
    cursor.execute('''
    SELECT DISTINCT Cities.name FROM Cities
    JOIN Countries ON Cities.country_id = Countries.id
    WHERE Countries.name LIKE ? OR Cities.name LIKE ? LIMIT 5
    ''', (f'%{query}%', f'%{query}%'))
    city_suggestions = cursor.fetchall()

    conn.close()

    # Combine les résultats et ajoute des types
    suggestions = []
    for suggestion in continent_suggestions:
        suggestions.append({'type': 'continent', 'name': suggestion['name']})
    for suggestion in country_suggestions:
        suggestions.append({'type': 'country', 'name': suggestion['name']})
    for suggestion in city_suggestions:
        suggestions.append({'type': 'city', 'name': suggestion['name']})
    
    return jsonify(suggestions)

if __name__ == '__main__':
    create_tables()
    insert_data()
    app.run(debug=True, port=5001)
