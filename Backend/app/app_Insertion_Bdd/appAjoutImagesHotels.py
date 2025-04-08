# FONCTION PERMETTANT D'AJOUTER DES IMAGES POUR CHAQUE HOTELS DANS LA BASE DE DONNEES HOTELS.DB
# LES IMAGES SERONT AJOUTEES ALEATORIEMENT DANS LA TABLE HOTELS COLONNE IMAGE_URL

import sqlite3
import random

def assign_hotel_images():
    images = ["hotel1.jpg", "hotel2.jpg", "hotel3.jpg", "hotel4.jpg", "hotel5.jpg",
              "hotel6.jpg", "hotel7.jpg", "hotel8.jpg", "hotel9.jpg", "hotel10.jpg"]

    conn = sqlite3.connect("hotels.db")
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM hotels")
    hotels = cursor.fetchall()

    for hotel in hotels:
        image = random.choice(images)
        cursor.execute("UPDATE hotels SET image_url = ? WHERE id = ?", (image, hotel["id"]))

    conn.commit()
    conn.close()
    print("✅ Images assignées aléatoirement aux hôtels.")

if __name__ == '__main__':
    print("📌 Attribution des images aux hôtels...")
    assign_hotel_images()
