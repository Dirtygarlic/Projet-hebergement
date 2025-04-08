// ============================
// 📦 Importations des modules
// ============================
import {
    getPasswordStrength,
    updateStrengthDisplay,
    updatePasswordCriteria,
    updatePasswordInputStyle,
    toggleRegisterButton
} from './formValidation.js';

import { showUserInfo } from './sessionManager.js';
import { resetRegisterForm } from './resetRegisterForm.js';


// ============================
// 🔁 Passage en mode inscription
// ============================
export function switchToCreateAccount() {
    document.getElementById("form-title").textContent = "Créer un compte";

    // Cacher le formulaire de connexion
    document.getElementById("loginForm").style.display = "none";
    document.querySelectorAll("#loginForm input").forEach(input => input.disabled = true);

    // Réinitialiser les champs de connexion
    document.getElementById("login-email").value = "";
    document.getElementById("login-password").value = "";

    // Afficher le formulaire d'inscription
    document.getElementById("registerForm").style.display = "block";
    document.getElementById("registerFields").classList.add("active"); 
    document.getElementById("registerFields").style.display = "block";
    document.querySelectorAll("#registerFields input, #registerFields select").forEach(input => input.disabled = false);

    resetRegisterForm(); // ✅ Réinitialise les champs

    // Réinitialise les comportements du champ mot de passe
    const passwordInput = document.getElementById("register-password");
    const strengthText = document.getElementById("password-strength-text");
    const criteriaList = document.getElementById("password-criteria");

    if (passwordInput && strengthText && criteriaList) {
        const newPasswordInput = passwordInput.cloneNode(true);
        newPasswordInput.id = "register-password";
        passwordInput.parentNode.replaceChild(newPasswordInput, passwordInput);

        newPasswordInput.addEventListener("input", function () {
            const password = newPasswordInput.value;
            const strength = getPasswordStrength(password);
            updateStrengthDisplay(strength, strengthText);
            updatePasswordCriteria(password);
            updatePasswordInputStyle(newPasswordInput, strength);
            toggleRegisterButton(password);
        });

        newPasswordInput.addEventListener("focus", () => {
            strengthText.classList.remove("hidden");
            criteriaList.classList.remove("hidden");
        });

        newPasswordInput.addEventListener("blur", () => {
            setTimeout(() => {
                strengthText.classList.add("hidden");
                criteriaList.classList.add("hidden");
            }, 200);
        });
    }
}


// ============================
// 🔁 Passage en mode connexion
// ============================
export function switchToLogin() {
    document.getElementById("form-title").textContent = "Se connecter";

    // Cacher le formulaire d'inscription
    document.getElementById("registerForm").style.display = "none";
    document.getElementById("registerFields").classList.remove("active"); 
    document.getElementById("registerFields").style.display = "none";
    document.querySelectorAll("#registerForm input, #registerForm select").forEach(input => input.disabled = true);

    // Réinitialiser les champs d'inscription au cas où
    resetRegisterForm();

    // Afficher le formulaire de connexion
    document.getElementById("loginForm").style.display = "block";
    document.querySelectorAll("#loginForm input").forEach(input => input.disabled = false);

    // Réinitialiser les champs de login
    document.getElementById("login-email").value = "";
    document.getElementById("login-password").value = "";
}


// ============================
// 👁 Basculer l’affichage du mot de passe
// ============================
export function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.type = input.type === "password" ? "text" : "password";
    }
}


// ============================
// 🪄 Affichage ou masquage du formulaire de connexion
// ============================
export function toggleLoginForm() {
    const modal = document.getElementById("loginModal");
    const overlay = document.getElementById("overlay");

    modal.classList.toggle("active");
    overlay.classList.toggle("active");
}
