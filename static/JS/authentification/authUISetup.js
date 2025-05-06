// =============================================================
// 📁 authUISetup.js (authentification)
// -------------------------------------------------------------
// Ce fichier initialise tous les comportements liés à
// l’interface d’authentification utilisateur dès que le DOM est chargé.
//
// 🎯 Objectif :
// Orchestrer la logique front-end des formulaires de connexion,
// d’inscription, de validation en temps réel et de mot de passe oublié.
//
// 🔧 Fonctionnalités :
// - `checkLoginOnLoad()` : vérifie si l’utilisateur est déjà connecté
// - Gère la soumission du formulaire de connexion (`submitLogin`)
// - Gère la soumission du formulaire d’inscription (`submitRegister`)
// - Active la validation en temps réel des champs email et téléphone
// - Active la réinitialisation de mot de passe (`resetPassword`)
// - Rend accessibles globalement certaines fonctions pour l’UI (modales)
//
// 📦 Dépendances :
// - `formValidation.js` : validation live du téléphone et de l’email
// - `authHandlers.js` : logique de connexion et inscription
// - `resetPassword.js` : déclenche le flux de mot de passe oublié
// - `sessionManager.js` : vérifie et affiche l’état de session
// - `uiManager.js` : gère les actions de l’interface utilisateur (changement de formulaire, visibilité du mot de passe, etc.)
//
// ✅ Avantages :
// - Centralise toute l’initialisation du système d’authentification
// - Code propre, modulaire et réutilisable
// - Expérience utilisateur fluide (pas de rechargement de page)
//
// 🧩 À utiliser dans :
// - `index.html`, `login.html`, ou n’importe quelle page avec modale ou section de connexion
//
// ⚠️ Les IDs suivants doivent exister dans le HTML :
// - `#loginForm`, `#registerForm`, `#register-phone`, `#register-email`, `#forgot-password-button`
// =============================================================



// ============================
// 📦 Importation des modules
// ============================
import { validatePhoneInput, validateEmailInput } from './formValidation.js';
import { submitRegister, submitLogin } from './authHandlers.js';
import { resetPassword } from './resetPassword.js';
import { checkLoginOnLoad } from './sessionManager.js';
import {
    switchToCreateAccount,
    toggleLoginForm,
    togglePasswordVisibility,
    switchToLogin
} from './uiManager.js';


// ============================
// 🚀 Initialisation globale après chargement du DOM
// ============================
document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ DOM prêt, initialisation de l'interface utilisateur...");

    // ♻️ Connexion persistante (si utilisateur déjà connecté)
    checkLoginOnLoad();

    // 📤 Écouteurs pour les soumissions des formulaires login/register
    const loginForm = document.querySelector('#loginForm');
    const registerForm = document.querySelector('#registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', submitLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', submitRegister);

        // 📞 Validation en temps réel (uniquement pour inscription)
        const phoneInput = document.getElementById('register-phone');
        const emailInput = document.getElementById('register-email');

        if (phoneInput) phoneInput.addEventListener('input', validatePhoneInput);
        if (emailInput) emailInput.addEventListener('input', validateEmailInput);
    }

    // 🔐 Réinitialisation mot de passe
    const forgotPasswordBtn = document.getElementById("forgot-password-button");
    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener("click", resetPassword);
    }
});


// ============================
// 🌍 Fonctions globales accessibles dans le HTML
// ============================
window.toggleLoginForm = toggleLoginForm;
window.switchToCreateAccount = switchToCreateAccount;
window.togglePasswordVisibility = togglePasswordVisibility;
window.switchToLogin = switchToLogin;
window.resetPassword = resetPassword;

