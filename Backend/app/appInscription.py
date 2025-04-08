# ============================
# 🚀 Initialisation de l'application Flask et des extensions
# ============================
import logging
import os
import re
from flask import Blueprint, request, jsonify, current_app
from flask_sqlalchemy import SQLAlchemy
from itsdangerous import URLSafeTimedSerializer
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_mail import Mail, Message
from sqlalchemy.exc import IntegrityError
from dotenv import load_dotenv


# ============================
# 🧩 Initialisation des Blueprint
# ============================
inscription_bp = Blueprint('inscription', __name__)
reset_password_bp = Blueprint('reset_password', __name__)

# ============================
# 🧱 Initialisation différée des extensions Flask
# ============================
db = SQLAlchemy()
bcrypt = Bcrypt()
mail = Mail()


# ============================
# 🔐 Chargement des variables d'environnement
# ============================
load_dotenv(dotenv_path='securite_mdp.env')


# Vérification de la présence de SECRET_KEY
secret_key = os.environ.get('SECRET_KEY')
if not secret_key:
    raise RuntimeError("La variable d'environnement SECRET_KEY est manquante. Vérifiez le fichier .env.")

# Initialisation du serializer sécurisé
serializer = URLSafeTimedSerializer(secret_key)


# ============================
# 📝 Configuration du logging
# ============================
logging.basicConfig(level=logging.INFO)

# ============================
# 📦 Modèle de la table Users
# ============================
class User(db.Model):
    id_user = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(15), nullable=True)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    stripe_customer_id = db.Column(db.String(255), nullable=True)

# ============================
# 🔧 Initialisation des extensions (appelée depuis appRoute.py)
# ============================
def init_inscription_extensions(app):
    CORS(app, supports_credentials=True)
    db.init_app(app)
    bcrypt.init_app(app)
    mail.init_app(app)

    with app.app_context():
        db.create_all()

# ============================
# 📞 Validation du numéro de téléphone
# ============================
def is_valid_phone(phone):
    return re.match(r'^\+\d{1,4}\d{6,15}$', phone) is not None if phone else True

# ============================
# 🔐 Route de connexion utilisateur
# ============================
@inscription_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Requête invalide : données JSON manquantes ou incorrectes.'}), 400

    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()
    logging.info(f"Email reçu : {email}")

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password, password):
        return jsonify({'error': 'Email ou mot de passe incorrect'}), 401

    return jsonify({
        'message': 'Connexion réussie !',
        'id': user.id_user,
        'name': user.name,
        'first_name': user.first_name,
        'email': user.email,
        'phone': user.phone
    }), 200

# ============================
# 📝 Route d'inscription utilisateur
# ============================
@inscription_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Requête invalide : données JSON manquantes ou incorrectes.'}), 400

    name = data.get('name', '').strip()
    first_name = data.get('firstname', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()
    phone = data.get('phone', '').strip()

    if not first_name or not name or not email or not password:
        return jsonify({'error': 'Nom, prénom, email et mot de passe sont obligatoires !'}), 400

    if phone and not is_valid_phone(phone):
        return jsonify({'error': 'Numéro de téléphone invalide !'}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({'error': 'L\'email est déjà associé à un compte existant.'}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    try:
        new_user = User(name=name, first_name=first_name, email=email, password=hashed_password, phone=phone)
        db.session.add(new_user)
        db.session.commit()
        logging.info(f"Utilisateur créé avec l'ID : {new_user.id_user}")

        try:
            msg = Message(
                subject="Bienvenue sur notre plateforme !",
                recipients=[email],
                body=f"Bonjour {first_name} {name},\n\nVotre compte a été créé avec succès.\n\nÀ bientôt,\nL'équipe de réservation."
            )
            mail.send(msg)
        except Exception as e:
            logging.error(f"Erreur d'envoi de l'e-mail : {e}")

        return jsonify({
            'success': True,
            'id': new_user.id_user,  # <- Cette clé DOIT s'appeler "id"
            'name': new_user.name,
            'first_name': new_user.first_name,
            'email': new_user.email,
            'phone': new_user.phone
        }), 201

    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Un utilisateur avec cet e-mail existe déjà.'}), 400
    except Exception as e:
        logging.error(f"Erreur : {str(e)}")
        return jsonify({'error': 'Une erreur est survenue, veuillez réessayer.'}), 500

# ============================
# ✉️ Route de test d'envoi de mail
# ============================
@inscription_bp.route('/send_email')
def send_test_email():
    try:
        msg = Message(
            subject="Sujet de test",
            recipients=["justdreams06@gmail.com"],
            body="Ceci est un email de test envoyé depuis votre application Flask."
        )
        mail.send(msg)
        return 'Email envoyé avec succès !', 200
    except Exception as e:
        logging.error(f"Erreur lors de l'envoi de l'e-mail de test : {e}")
        return f"Erreur : {str(e)}", 500

# ============================
# 🗑️ Suppression d'un utilisateur
# ============================
@inscription_bp.route('/delete_user/<int:id_user>', methods=['DELETE'])
def delete_user(id_user):
    user_to_delete = User.query.get(id_user)
    if user_to_delete:
        try:
            db.session.delete(user_to_delete)
            db.session.commit()
            return jsonify({'message': f"Utilisateur {id_user} supprimé."}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f"Erreur lors de la suppression : {e}"}), 500
    else:
        return jsonify({'error': "Utilisateur non trouvé"}), 404

# ============================
# ♻️ Réinitialisation du mot de passe
# ============================

# 🔐 Générateur de token sécurisé
def generate_reset_token(email):
    return serializer.dumps(email, salt='resetPassword')

# 🧪 Vérificateur de token sécurisé
def verify_reset_token(token, expiration=1800):
    try:
        email = serializer.loads(token, salt='resetPassword', max_age=expiration)
        return email
    except Exception:
        return None

# 📬 Envoi du mail de réinitialisation
@inscription_bp.route('/request-password-reset', methods=['POST'])
def request_password_reset():
    data = request.get_json()
    email = data.get('email', '').strip().lower()

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': "Aucun utilisateur trouvé avec cet e-mail."}), 404

    token = generate_reset_token(email)
    reset_link = f"http://127.0.0.1:5003/resetPassword?token={token}"

    try:
        msg = Message(
            subject="Réinitialisation de votre mot de passe",
            recipients=[email],
            body=f"Bonjour {user.first_name},\n\nVoici le lien pour réinitialiser votre mot de passe : {reset_link}\n\nCe lien est valable 30 minutes."
        )
        mail.send(msg)
        return jsonify({'message': "Un email de réinitialisation a été envoyé."}), 200
    except Exception as e:
        return jsonify({'error': f"Erreur lors de l'envoi de l'email : {e}"}), 500

# ✅ Soumission du nouveau mot de passe
@inscription_bp.route('/submit-new-password', methods=['POST'])
def submit_new_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('new_password')

    email = verify_reset_token(token)
    if not email:
        return jsonify({'error': 'Lien expiré ou invalide.'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': "Utilisateur non trouvé."}), 404

    user.password = bcrypt.generate_password_hash(new_password).decode('utf-8')
    db.session.commit()
    return jsonify({'message': "Mot de passe mis à jour avec succès."}), 200
