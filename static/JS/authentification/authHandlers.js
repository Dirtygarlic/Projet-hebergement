// =============================================================
// 📁 authHandlers.js
// -------------------------------------------------------------
// Ce fichier gère la logique de soumission des formulaires de
// connexion et d’inscription dans ton application front-end.
//
// 🎯 Objectif :
// Permettre aux utilisateurs de se connecter ou de s’inscrire
// en toute sécurité, avec retour visuel et validation des champs,
// puis déclencher l’affichage dynamique de leur session.
//
// 🔐 Fonctions principales :
// 1. `submitLogin(event)`
//    → Récupère les champs `email` et `password`
//    → Envoie les données à l’endpoint `/login`
//    → Affiche une alerte si erreur, ou connecte l'utilisateur
//    → Met à jour l’interface avec `showUserInfo()`
// 
// 2. `submitRegister(event)`
//    → Vérifie les champs (mot de passe, téléphone, correspondance)
//    → Envoie les données à l’endpoint `/register`
//    → Affiche une alerte de succès ou d’erreur
//    → Met à jour l’interface avec `showUserInfo()`
//    → Recharge la page si succès
//
// 🔧 Validation front-end :
// - Vérifie la correspondance des mots de passe
// - Vérifie que le téléphone contient uniquement des chiffres
// - Vérifie la force du mot de passe via `isStrongPassword()`
// - Bloque le bouton pendant le traitement (UX améliorée)
//
// 📦 Dépendances internes :
// - `formValidation.js` → `isStrongPassword()`
// - `sessionManager.js` → `showUserInfo()`
// - `uiManager.js` → `toggleLoginForm()`
//
// ✅ Avantages :
// - UX fluide et contrôlée
// - Gestion claire des erreurs
// - Affichage conditionnel des données utilisateur
//
// 📌 À connecter à des listeners comme :
//   `form.addEventListener("submit", submitLogin)`
//   ou  `form.addEventListener("submit", submitRegister)`
//
// ⚠️ Les éléments HTML doivent avoir les bons IDs :
// - `#login-email`, `#login-password`, `#register-name`, etc.
// =============================================================


// ============================
// 📦 Importations des modules
// ============================
import { isStrongPassword } from './formValidation.js';
import { showUserInfo } from './sessionManager.js';
import { toggleLoginForm } from './uiManager.js';


// ============================
// 🔐 Soumission du formulaire de connexion
// ============================
export async function submitLogin(event) {
    event.preventDefault();

    // 📤 Préparation des données
    const formData = {
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value,
    };

    const loginButton = document.querySelector('#loginFields .btn-submit');
    loginButton.textContent = "Connexion...";
    loginButton.disabled = true;
    
    // ⚠️ Vérification des champs
    if (!formData.email || !formData.password) {
        alert("Email et mot de passe sont obligatoires !");
        loginButton.textContent = "Se connecter";
        loginButton.disabled = false;
        return;
    }

    // 📡 Envoi au backend
    try {
        const response = await fetch('http://127.0.0.1:5003/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        if (response.ok) {
            const userData = await response.json();
            alert('Connexion réussie !');

            // ✅ Affichage des infos utilisateur
            if (userData.first_name && userData.name) {
                showUserInfo(userData.first_name, userData.name, userData.email, userData.phone, userData.id);
              

                toggleLoginForm();
            } else {
                alert("Erreur : Informations utilisateur incomplètes.");
            }
        } else {
            const error = await response.json();
            alert('Erreur : ' + (error.error || error.message || 'Erreur inconnue'));
        }

    } catch (error) {
        console.error("Erreur lors de la connexion :", error);
        alert('Une erreur est survenue.');
    } finally {
        loginButton.textContent = "Se connecter";
        loginButton.disabled = false;
    }
}


// ============================
// ✍️ Soumission du formulaire d'inscription
// ============================
export async function submitRegister(event) {
    event.preventDefault();

    // 📋 Récupération des données
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const phoneInput = document.getElementById("register-phone").value;
    const phoneError = document.getElementById("phone-error");
    const registerButton = document.querySelector('#registerFields .btn-submit');

    registerButton.textContent = "Création en cours...";
    registerButton.disabled = true;

    // ✅ Vérifications préalables
    if (password !== confirmPassword) {
        alert("Les mots de passe ne correspondent pas !");
        registerButton.textContent = "Valider";
        registerButton.disabled = false;
        return;
    }

    if (!/^\d+$/.test(phoneInput)) {
        phoneError.style.display = "block";
        registerButton.textContent = "Valider";
        registerButton.disabled = false;
        return;
    }

    if (!isStrongPassword(password)) {
        alert("Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.");
        registerButton.textContent = "Valider";
        registerButton.disabled = false;
        return;
    }

    const formData = {
        name: document.getElementById('register-name').value,
        firstname: document.getElementById('register-firstname').value,
        email: document.getElementById('register-email').value,
        password: password,
        phone: document.getElementById('register-phone-indicative').value + phoneInput,
    };

    if (!formData.name || !formData.firstname || !formData.email || !formData.password) {
        alert("Tous les champs sont obligatoires !");
        registerButton.textContent = "Valider";
        registerButton.disabled = false;
        return;
    }

    // 📡 Envoi au backend
    try {
        const response = await fetch('http://127.0.0.1:5003/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        if (response.ok) {
            const userData = await response.json();
            alert('Inscription réussie ! Un e-mail de bienvenue a été envoyé à ' + formData.email);

            // ✅ Affichage des infos utilisateur
            if (userData.first_name && userData.name) {
                showUserInfo(userData.first_name, userData.name, userData.email, userData.phone, userData.id);
                toggleLoginForm();
                window.location.reload();
            } else {
                alert("Erreur lors de l'inscription, nom non trouvé.");
            }
        } else {
            const error = await response.json();
            alert('Erreur : ' + (error.error || error.message || 'Erreur inconnue'));
        }

    } catch (error) {
        console.error("Erreur lors de l’inscription :", error);
        alert('Une erreur est survenue.');
    } finally {
        registerButton.textContent = "Valider";
        registerButton.disabled = false;
    }
}
