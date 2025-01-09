from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_mail import Mail, Message
from sqlalchemy.exc import IntegrityError
from dotenv import load_dotenv
import logging
import os
import re

# Charger les variables d'environnement
load_dotenv(dotenv_path='securite_mdp.env')

# Initialiser Flask
app = Flask(__name__)

# Activer CORS pour l'application entière
CORS(app)

# Configuration de la base de données SQLite
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///reservations.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configuration de Flask-Mail
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_USERNAME')

print("Mail username est : " + (os.getenv('MAIL_USERNAME') or "Non défini"))
print("Mail password est : " + (os.getenv('MAIL_PASSWORD') or "Non défini"))

# Initialiser les extensions
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
mail = Mail(app)

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

        # Envoi de l'e-mail de bienvenue
        try:
            msg = Message(
                subject="Bienvenue sur notre plateforme !",
                recipients=[email],
                body=f"Bonjour {first_name} {name},\n\n"
                     f"Votre compte a été créé avec succès. Nous sommes ravis de vous compter parmi nous !\n\n"
                     f"À bientôt,\nL'équipe de réservation."
            )
            mail.send(msg)
            logging.info("E-mail de bienvenue envoyé avec succès.")
        except Exception as e:
            logging.error(f"Erreur lors de l'envoi de l'e-mail : {e}")

        # Renvoi des informations nécessaires après la création de l'utilisateur
        return jsonify({
            'message': 'Utilisateur enregistré avec succès !',
            'user_id': new_user.id_user,
            'name': new_user.name,
            'first_name': new_user.first_name,
        }), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Un utilisateur avec cet e-mail existe déjà.'}), 400
    except Exception as e:
        logging.error(f"Erreur : {str(e)}")
        return jsonify({'error': 'Une erreur est survenue, veuillez réessayer.'}), 500

# Route de test pour l'envoi d'e-mail
@app.route('/send_email')
def send_test_email():
    try:
        msg = Message(
            subject="Sujet de test",
            recipients=["justdreams06@gmail.com"],  # Remplacez par une adresse email valide
            body="Ceci est un email de test envoyé depuis votre application Flask."
        )
        mail.send(msg)
        return 'Email envoyé avec succès !', 200
    except Exception as e:
        logging.error(f"Erreur lors de l'envoi de l'e-mail de test : {e}")
        return f"Erreur : {str(e)}", 500

 # Route pour delete un id_user 
 # commande dans le terminal : curl -X DELETE http://127.0.0.1:5000/delete_user/3 
@app.route('/delete_user/<int:id_user>', methods=['DELETE'])
def delete_user(id_user):
    user_to_delete = User.query.get(id_user)
    
    if user_to_delete:
        try:
            db.session.delete(user_to_delete)
            db.session.commit()
            return jsonify({'message': f"Utilisateur avec l'ID {id_user} supprimé avec succès."}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f"Erreur lors de la suppression de l'utilisateur : {e}"}), 500
    else:
        return jsonify({'error': "Utilisateur non trouvé"}), 404
    


# Point d'entrée de l'application Flask
if __name__ == '__main__':
    app.run(debug=True)
