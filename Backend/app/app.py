from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from sqlalchemy.exc import IntegrityError
import logging
import os
import re

# Initialiser Flask
app = Flask(__name__)

# Activer CORS pour l'application entière
CORS(app)

# Configuration de la base de données SQLite
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///reservations.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialiser les extensions
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)

# Configurer le logging
logging.basicConfig(level=logging.INFO)

# Modèle de la table Users
class User(db.Model):
    id_user = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(15), nullable=True)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

# Crée les tables si elles n'existent pas
with app.app_context():
    db.create_all()

# Fonction pour valider le téléphone
def is_valid_phone(phone):
    return re.match(r'^\+\d{1,4}\d{6,15}$', phone) is not None if phone else True

# Route pour la connexion
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Requête invalide : données JSON manquantes ou incorrectes.'}), 400

    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()

    # Logs pour le débogage
    logging.info(f"Email reçu : {email}")

    # Vérifier si l'email existe dans la base de données
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'Email ou mot de passe incorrect'}), 401

    # Vérifier le mot de passe
    if not bcrypt.check_password_hash(user.password, password):
        return jsonify({'error': 'Email ou mot de passe incorrect'}), 401

    # Si tout est bon, retourner les données de l'utilisateur
    return jsonify({
        'message': 'Connexion réussie !',
        'name': user.name,
        'first_name': user.first_name,
        'email': user.email,
    }), 200

# Route pour enregistrer un utilisateur
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Requête invalide : données JSON manquantes ou incorrectes.'}), 400

    # Extraction des champs
    name = data.get('name', '').strip()
    first_name = data.get('firstname', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()
    phone = data.get('phone', '').strip()

    # Validation des champs
    if not first_name or not name or not email or not password:
        return jsonify({'error': 'Nom, prénom, email et mot de passe sont obligatoires !'}), 400

    if phone and not is_valid_phone(phone):
        return jsonify({'error': 'Numéro de téléphone invalide !'}), 400

    # Vérification si l'utilisateur existe déjà
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({'error': 'L\'email est déjà associé à un compte existant. Veuillez utiliser un autre email.'}), 400

    # Hachage du mot de passe
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    # Création de l'utilisateur
    try:
        new_user = User(
            name=name,
            first_name=first_name,
            email=email,
            password=hashed_password,
            phone=phone,
        )
        db.session.add(new_user)
        db.session.commit()
        logging.info(f"Utilisateur créé avec l'ID : {new_user.id_user}")
        # Renvoi des informations nécessaires après la création de l'utilisateur
        return jsonify({
            'message': 'Utilisateur enregistré avec succès !',
            'user_id': new_user.id_user,
            'name': new_user.name,
            'first_name': new_user.first_name,
        }), 201
    except IntegrityError:
        return jsonify({'error': 'Erreur d\'intégrité dans la base de données.'}), 400
    except Exception as e:
        logging.error(f"Erreur : {str(e)}")
        return jsonify({'error': 'Une erreur est survenue, veuillez réessayer.'}), 500

# Route de test
@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({'message': 'API opérationnelle !'}), 200

# Point d'entrée de l'application Flask
if __name__ == '__main__':
    app.run(debug=True)
