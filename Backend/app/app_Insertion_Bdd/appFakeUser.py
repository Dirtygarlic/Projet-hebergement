# ============================
# 🧪 Insertion d'utilisateurs fictifs dans la base hotels.db
# ============================
# Ce fichier est lié à appInscription.py
# Il doit être lancé après que l'app Flask a été définie dans appInscription.py


# ============================
# 📦 Imports nécessaires
# ============================
import random
from appInscription import app, db, User, bcrypt
from faker import Faker
from datetime import datetime


# ============================
# 🛠️ Initialisation de Faker
# ============================
fake = Faker()


# ============================
# 👥 Fonction principale d'ajout d'utilisateurs fictifs
# ============================
def ajouter_utilisateurs_fictifs(nombre=200):
    with app.app_context():
        try:
            # Démarrer une transaction
            for _ in range(nombre):
                name = fake.last_name()
                first_name = fake.first_name()
                email = fake.email()
                password = bcrypt.generate_password_hash("password123").decode('utf-8')  # Hash du mot de passe
                phone = fake.phone_number() if random.choice([True, False]) else None
                created_at = datetime.now()
                stripe_customer_id = None  # Pas de client Stripe pour les utilisateurs fictifs

                new_user = User(
                    name=name,
                    first_name=first_name,
                    email=email,
                    password=password,
                    phone=phone,
                    created_at=created_at,
                    stripe_customer_id=stripe_customer_id
                )
                db.session.add(new_user)

            # Valider la transaction
            db.session.commit()
            print(f"✅ {nombre} utilisateurs fictifs ajoutés avec succès !")
        
        except Exception as e:
            db.session.rollback()
            print(f"❌ Erreur lors de l'ajout des utilisateurs : {e}")

# ============================
# 🚀 Lancement du script (si exécuté directement)
# ============================
if __name__ == '__main__':
    print("📌 Ajout des utilisateurs fictifs...")
    ajouter_utilisateurs_fictifs()