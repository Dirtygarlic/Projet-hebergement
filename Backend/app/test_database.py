# Tests pour valider la création et l'insertion :
# Créer un fichier dédié pour les tests, par exemple test_database.py.
# Vérifier que :
# Les tables sont bien créées avec les bonnes colonnes.
# Les données insérées respectent les contraintes définies (unicité, types de données, etc.).

import unittest
import sqlite3

class TestDatabase(unittest.TestCase):
    def setUp(self):
        self.connection = sqlite3.connect(":memory:")
        self.cursor = self.connection.cursor()
        # Créer les tables pour le test
        self.cursor.execute("CREATE TABLE countries (country_id INTEGER PRIMARY KEY, country_name TEXT UNIQUE)")

    def test_insert_country(self):
        self.cursor.execute("INSERT INTO countries (country_name) VALUES ('France')")
        self.connection.commit()
        self.cursor.execute("SELECT COUNT(*) FROM countries")
        count = self.cursor.fetchone()[0]
        self.assertEqual(count, 1)

    def tearDown(self):
        self.connection.close()
