import sqlite3
import hashlib
import os

# Fonction pour effacer une table
'''
def drop_users_table():
    # Connexion à la base de données SQLite
    connection = sqlite3.connect("reservations.db")
    cursor = connection.cursor()

    # Supprimer la table Users
    cursor.execute("DROP TABLE IF EXISTS <nom de la table>")

    # Commit et fermeture
    connection.commit()
    connection.close()
    print("Table <nom de la table> supprimée avec succès.")

if __name__ == "__main__":
    drop_users_table()

'''

def create_database_and_tables():
    # Connexion à la base de données SQLite
    connection = sqlite3.connect("reservations.db")
    cursor = connection.cursor()

    # Création des tables
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Users (
        id_user INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        first_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Reservations (
        id_reservation INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        service_id INTEGER NOT NULL,
        date_reservation DATETIME NOT NULL,
        status TEXT DEFAULT 'pending',
        FOREIGN KEY (user_id) REFERENCES Users(id_user),
        FOREIGN KEY (service_id) REFERENCES Services(id_service)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Services (
        id_service INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        price_per_unit REAL NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Payments (
        id_payment INTEGER PRIMARY KEY AUTOINCREMENT,
        reservation_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'success',
        FOREIGN KEY (reservation_id) REFERENCES Reservations(id_reservation)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Notifications (
        id_notification INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES Users(id_user)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Availability (
        id_availability INTEGER PRIMARY KEY AUTOINCREMENT,
        service_id INTEGER NOT NULL,
        date DATETIME NOT NULL,
        available_slots INTEGER NOT NULL,
        FOREIGN KEY (service_id) REFERENCES Services(id_service)
    )
    """)

    # Validation et fermeture de la connexion
    connection.commit()
    connection.close()
    print("Base de données et tables créées avec succès.")

if __name__ == "__main__":
    create_database_and_tables()

