# =========================================
# 📚 SOMMAIRE DU FICHIER appInscription.py (SQLite only)
# =========================================

# 1. 🔧 Initialisation
# 2. 📞 Validation téléphone
# 3. 🔐 Connexion utilisateur
# 4. 📝 Inscription utilisateur
# 5. ✉️ Envoi de mail de test
# 6. 🗑️ Suppression utilisateur
# 7. ♻️ Réinitialisation mot de passe

# =========================================
# 1. 🔧 Initialisation
# =========================================

import os
import re
import logging
import sqlite3
from flask import Blueprint, request, jsonify, current_app, render_template
from flask_bcrypt import Bcrypt
from flask_mail import Message
from itsdangerous import URLSafeTimedSerializer
from dotenv import load_dotenv

bcrypt = Bcrypt()
inscription_bp = Blueprint('inscription', __name__)
load_dotenv("securite_mdp.env")

serializer = URLSafeTimedSerializer(os.getenv("SECRET_KEY"))
mail = None  # sera injecté par appRoute


def init_inscription_extensions(app):
    bcrypt.init_app(app)
    global mail
    mail = app.extensions['mail']


# =========================================
# 2. 📞 Validation téléphone
# =========================================
def is_valid_phone(phone):
    return re.match(r'^\+\d{1,4}\d{6,15}$', phone) is not None if phone else True


# =========================================
# 3. 🔐 Connexion utilisateur
# =========================================
@inscription_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Requête invalide'}), 400

    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()

    conn = sqlite3.connect('hotels.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM user WHERE email = ?", (email,))
    user = cursor.fetchone()

    if not user or not bcrypt.check_password_hash(user['password'], password):
        return jsonify({'error': 'Email ou mot de passe incorrect'}), 401

    return jsonify({
        'message': 'Connexion réussie !',
        'id': user['id_user'],
        'name': user['name'],
        'first_name': user['first_name'],
        'email': user['email'],
        'phone': user['phone']
    }), 200


# =========================================
# 4. 📝 Inscription utilisateur
# =========================================
@inscription_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Requête invalide'}), 400

    name = data.get('name', '').strip()
    first_name = data.get('firstname', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()
    phone = data.get('phone', '').strip()

    if not all([name, first_name, email, password]):
        return jsonify({'error': 'Champs obligatoires manquants'}), 400
    if phone and not is_valid_phone(phone):
        return jsonify({'error': 'Téléphone invalide'}), 400

    conn = sqlite3.connect('hotels.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id_user FROM user WHERE email = ?", (email,))
    if cursor.fetchone():
        return jsonify({'error': "L'email existe déjà"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    cursor.execute("""
        INSERT INTO user (name, first_name, email, password, phone)
        VALUES (?, ?, ?, ?, ?)
    """, (name, first_name, email, hashed_password, phone))
    conn.commit()
    user_id = cursor.lastrowid

    try:
        msg = Message(
            subject="Bienvenue sur notre plateforme !",
            recipients=[email],
            body=f"Bonjour {first_name} {name},\nVotre compte a été créé avec succès."
        )
        mail.send(msg)
    except Exception as e:
        logging.warning(f"Email non envoyé : {e}")

    return jsonify({
        'success': True,
        'id': user_id,
        'name': name,
        'first_name': first_name,
        'email': email,
        'phone': phone
    }), 201


# =========================================
# 5. ✉️ Envoi de mail de test
# =========================================
@inscription_bp.route('/send_email')
def send_test_email():
    try:
        msg = Message(
            subject="Test",
            recipients=["justdreams06@gmail.com"],
            body="Test email depuis Flask."
        )
        mail.send(msg)
        return 'Email envoyé !', 200
    except Exception as e:
        return f"Erreur : {e}", 500


# =========================================
# 6. 🗑️ Suppression utilisateur
# =========================================
@inscription_bp.route('/delete_user/<int:id_user>', methods=['DELETE'])
def delete_user(id_user):
    conn = sqlite3.connect('hotels.db')
    cursor = conn.cursor()
    cursor.execute("DELETE FROM user WHERE id_user = ?", (id_user,))
    conn.commit()
    if cursor.rowcount:
        return jsonify({'message': f'Utilisateur {id_user} supprimé.'}), 200
    return jsonify({'error': 'Utilisateur non trouvé'}), 404


# =========================================
# 7. ♻️ Réinitialisation mot de passe
# =========================================
def generate_reset_token(email):
    return serializer.dumps(email, salt='resetPassword')

def verify_reset_token(token, expiration=1800):
    try:
        return serializer.loads(token, salt='resetPassword', max_age=expiration)
    except Exception:
        return None

@inscription_bp.route('/request-password-reset', methods=['POST'])
def request_password_reset():
    data = request.get_json()
    email = data.get('email', '').strip().lower()

    conn = sqlite3.connect('hotels.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM user WHERE email = ?", (email,))
    user = cursor.fetchone()

    if not user:
        return jsonify({'error': 'Utilisateur introuvable'}), 404

    token = generate_reset_token(email)
    link = f"http://127.0.0.1:5003/resetPassword?token={token}"

    try:
        msg = Message(
            subject="Réinitialisation de votre mot de passe",
            recipients=[email],
            body=f"Bonjour {user['first_name']},\nVoici le lien : {link}"
        )
        mail.send(msg)
        return jsonify({'message': 'Email envoyé'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@inscription_bp.route('/submit-new-password', methods=['POST'])
def submit_new_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('new_password')

    email = verify_reset_token(token)
    if not email:
        return jsonify({'error': 'Lien expiré ou invalide.'}), 400

    hashed = bcrypt.generate_password_hash(new_password).decode('utf-8')

    conn = sqlite3.connect('hotels.db')
    cursor = conn.cursor()
    cursor.execute("UPDATE user SET password = ? WHERE email = ?", (hashed, email))
    conn.commit()
    return jsonify({'message': 'Mot de passe mis à jour.'}), 200
