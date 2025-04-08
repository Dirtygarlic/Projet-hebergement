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

