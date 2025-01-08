import sqlite3
from pysqlcipher3 import dbapi2 as sqlite
import os

def secure_database():
    """
    Fonction pour copier la base de données SQLite vers une base chiffrée avec SQLCipher.
    """
    mot_de_passe = os.environ.get("DB_PASSWORD", "mot_de_passe_par_defaut")  # Récupère le mot de passe depuis la variable d'environnement

    if not mot_de_passe:
        raise ValueError("Le mot de passe n'est pas défini dans les variables d'environnement.")
    
    try:
        # Connexion à la base de données SQLite source
        print("Connexion à la base de données source...")
        source_conn = sqlite.connect("reservations.db")
        source_cursor = source_conn.cursor()

        # Vérifier les tables dans la base source
        source_cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = source_cursor.fetchall()
        print(f"Tables dans la base de données source : {tables}")

        # Connexion à la base de données chiffrée
        print("Connexion à la base de données sécurisée...")
        destination_conn = sqlite.connect("secure_database.db")
        destination_conn.execute(f"PRAGMA key = '{mot_de_passe}';")

        # Copier les tables et données, mais ignorer sqlite_sequence
        for table in tables:
            table_name = table[0]

            if table_name == "sqlite_sequence":  # Ignorer la table sqlite_sequence
                print("Table sqlite_sequence ignorée.")
                continue

            print(f"Copie de la table {table_name}...")

            # Copier la structure de la table
            source_cursor.execute(f"SELECT sql FROM sqlite_master WHERE type='table' AND name='{table_name}';")
            create_table_sql = source_cursor.fetchone()[0]
            destination_conn.execute(create_table_sql)

            # Copier les données
            source_cursor.execute(f"SELECT * FROM {table_name};")
            rows = source_cursor.fetchall()

            for row in rows:
                placeholders = ', '.join(['?'] * len(row))
                destination_conn.execute(f"INSERT INTO {table_name} VALUES ({placeholders});", row)

        # Validation des changements
        destination_conn.commit()
        print("Base de données sécurisée avec succès dans 'secure_database.db'.")
    except Exception as e:
        print(f"Erreur lors de la sécurisation de la base de données : {e}")
    finally:
        source_conn.close()
        destination_conn.close()

# Tester la fonction
if __name__ == "__main__":
    secure_database()
