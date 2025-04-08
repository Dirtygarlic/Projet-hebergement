import sqlite3
import random
import uuid
from datetime import datetime, timedelta

def ajouter_reservations_fictives(nombre=500):
    db_path = "hotels.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("PRAGMA foreign_keys = ON;")

    # Récupération des utilisateurs
    cursor.execute("SELECT id_user, name, first_name, email, phone FROM user")
    users = cursor.fetchall()

    # Récupération des hôtels avec leurs prix
    cursor.execute("SELECT id, price_per_night FROM hotels")
    hotels = cursor.fetchall()

    if not users or not hotels:
        print("🚫 Aucun utilisateur ou hôtel trouvé.")
        conn.close()
        return

    today = datetime.today()
    max_date = datetime(2026, 9, 30)
    delta_days = (max_date - today).days

    reservations_to_insert = []

    for _ in range(nombre):
        user = random.choice(users)
        hotel = random.choice(hotels)
        hotel_id = hotel[0]
        price_per_night = hotel[1]

        checkin_date = today + timedelta(days=random.randint(1, delta_days))
        stay_length = random.randint(3, 10)
        checkout_date = checkin_date + timedelta(days=stay_length)

        adults = random.randint(1, 4)
        children = random.randint(0, 2)
        guests = adults + children
        gender = random.choice(["Male", "Female", "Other"])
        status = random.choice(["pending", "confirmed", "cancelled"])
        phone = user[4] if user[4] else "0000000000"
        stripe_customer_id = str(uuid.uuid4())
        created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # 💰 Calcul du total_price
        total_price = round(price_per_night * stay_length, 2)

        # 🕒 Date d'annulation si applicable
        cancelled_at = created_at if status == "cancelled" else None

        reservations_to_insert.append((
            hotel_id, user[0], checkin_date.strftime("%Y-%m-%d"), checkout_date.strftime("%Y-%m-%d"),
            guests, adults, children, gender,
            user[2], user[1], user[3], phone,
            status, stripe_customer_id, created_at, total_price, cancelled_at
        ))

    cursor.executemany("""
        INSERT INTO reservations (
            hotel_id, user_id, checkin, checkout, guests, adults, children, gender,
            first_name, user_name, email, phone, status, stripe_customer_id, created_at, total_price, cancelled_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, reservations_to_insert)

    conn.commit()
    conn.close()

    print(f"✅ {nombre} réservations factices ont été ajoutées avec succès.")

if __name__ == '__main__':
    print("📌 Ajout des réservations factices en cours...")
    ajouter_reservations_fictives()
    print("✅ Réservations factices ajoutées avec succès.")
