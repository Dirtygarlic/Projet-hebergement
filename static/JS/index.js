//mettre la langue + ancien code a virer si tout marche bien

// ============================
// 📦 Importations des modules
// ============================
import { validatePhoneInput, validateEmailInput } from './authentification/formValidation.js';
import { submitRegister, submitLogin } from './authentification/authHandlers.js';
import { resetPassword } from './authentification/resetPassword.js';
import { checkLoginOnLoad } from './authentification/sessionManager.js';
import { switchToCreateAccount, toggleLoginForm, togglePasswordVisibility, switchToLogin } from './authentification/uiManager.js';


// ============================
// 📝 Écouteurs pour chaque formulaire
// ============================
document.querySelector('#loginForm').addEventListener('submit', submitLogin);
document.querySelector('#registerForm').addEventListener('submit', submitRegister);


// ============================
// 📞 Validation en temps réel des champs téléphone & email
// ============================
document.getElementById('register-phone').addEventListener('input', validatePhoneInput);
document.getElementById('register-email').addEventListener('input', validateEmailInput);


// ============================
// 🔐 Réinitialisation du mot de passe
// ============================
const forgotPasswordBtn = document.getElementById("forgot-password-button");
if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener("click", resetPassword);
}


// ============================
// ♻️ Connexion persistante après rechargement
// ============================
document.addEventListener("DOMContentLoaded", () => {
    console.log("🌐 DOM prêt, on vérifie la session utilisateur...");
    checkLoginOnLoad();
});

// ============================
// 🌍 Fonctions accessibles depuis le HTML
// ============================
window.toggleLoginForm = toggleLoginForm;
window.switchToCreateAccount = switchToCreateAccount;
window.togglePasswordVisibility = togglePasswordVisibility;
window.switchToLogin = switchToLogin;
window.resetPassword = resetPassword;