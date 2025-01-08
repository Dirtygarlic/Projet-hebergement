import sqlite3

# Connexion à la base de données SQLite source
conn = sqlite3.connect('reservations.db')
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print(tables)  # Affiche les tables existantes dans la base de données

conn.close()
