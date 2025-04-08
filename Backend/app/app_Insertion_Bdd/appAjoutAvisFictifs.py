# FONCTION PERMETTANT D'AJOUTER DES AVIS FACTICES DANS LA BASE DE DONNEES HOTELS.DB

import sqlite3
import random
from datetime import datetime, timedelta

def ajouter_avis_fictifs():
    # Connexion unique à la base de données
    conn = sqlite3.connect('hotels.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Récupérer tous les utilisateurs
    cursor.execute("SELECT id_user FROM User")
    users = [row[0] for row in cursor.fetchall()]
    
    if not users:
        print("⚠ Aucun utilisateur trouvé dans la table User.")
        conn.close()
        return

    # Récupérer tous les hôtels
    cursor.execute("SELECT id FROM hotels")
    hotels = [row[0] for row in cursor.fetchall()]

    if not hotels:
        print("⚠ Aucun hôtel trouvé dans la table hotels.")
        conn.close()
        return

    # Liste d'avis possibles
    comments = [
        "Excellent séjour, personnel aux petits soins !",
        "Bon rapport qualité-prix, je reviendrai.",
        "La chambre était propre et bien équipée.",
        "Très bruyant la nuit, difficile de dormir.",
        "Le service était parfait, je recommande fortement !",
        "Hôtel bien situé, proche du centre-ville.",
        "Le petit-déjeuner était délicieux et varié.",
        "Piscine magnifique, mais eau un peu froide.",
        "Salle de sport bien équipée, un vrai plus.",
        "Chambres spacieuses et très confortables.",
        "Accueil chaleureux, personnel très aimable.",
        "La connexion Wi-Fi était instable.",
        "Le spa est incroyable, très relaxant.",
        "Très bon séjour, mais un peu cher.",
        "La climatisation ne fonctionnait pas bien.",
        "Très bon restaurant dans l'hôtel, plats excellents.",
        "Vue superbe depuis la chambre !",
        "Manque de prises électriques près du lit.",
        "Hôtel moderne et très propre.",
        "Parking un peu cher, mais pratique."
    ]

    # Ajouter des avis pour chaque hôtel
    for hotel_id in hotels:
        num_reviews = random.randint(1, 10)  # Nombre d'avis par hôtel

        for _ in range(num_reviews):
            user_id = random.choice(users)
            rating = random.randint(7, 10)
            comment = random.choice(comments)

            # 📅 Générer une date aléatoire entre 1 et 180 jours dans le passé
            days_ago = random.randint(1, 180)
            date_posted = (datetime.now() - timedelta(days=days_ago)).strftime('%Y-%m-%d')

            # Insérer l'avis dans la table reviews
            cursor.execute('''
                INSERT INTO reviews (hotel_id, user_id, rating, comment, date_posted)
                VALUES (?, ?, ?, ?, ?)
            ''', (hotel_id, user_id, rating, comment, date_posted))

    # Valider les changements et fermer la connexion
    conn.commit()
    conn.close()
    
    print("✅ Avis fictifs insérés avec succès.")

if __name__ == '__main__':
    print("📌 ajout des avis fictifs...")
    ajouter_avis_fictifs()