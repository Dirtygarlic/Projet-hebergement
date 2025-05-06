// =============================================================
// 📁 formValidation.js
// -------------------------------------------------------------
// Ce fichier centralise toutes les fonctions JavaScript liées à
// la validation des champs de formulaire côté client : téléphone,
// email et mot de passe. Il est utilisé notamment lors de l'inscription.
//
// 🎯 Objectif :
// Fournir une validation instantanée et intuitive aux utilisateurs
// pour garantir que les données saisies sont correctes et sécurisées.
//
// 🔧 Fonctions principales :
//
// ✅ Téléphone
// - `validatePhoneInput()` : vérifie que le champ contient uniquement des chiffres.
//
// ✅ Email
// - `validateEmailInput()` : vérifie que l'email est au bon format,
//   affiche ou masque une erreur, et active/désactive le bouton de soumission
//   selon la force du mot de passe.
//
// ✅ Mot de passe
// - `isStrongPassword(password)` : vérifie que le mot de passe respecte
//   les critères de sécurité (majuscule, minuscule, chiffre, spécial, etc.).
// - `getPasswordStrength(password)` : retourne un score de robustesse (0 à 5).
// - `updateStrengthDisplay(strength, element)` : affiche un message et une couleur
//   selon la robustesse calculée.
// - `updatePasswordCriteria(password)` : coche ou décoche dynamiquement les critères visibles.
// - `updatePasswordInputStyle(inputElement, strength)` : colore le champ selon la robustesse.
// - `toggleRegisterButton(password)` : désactive le bouton si le mot de passe est trop faible.
//
// ✅ Avantages :
// - Validation instantanée sans requête serveur.
// - UX améliorée avec feedback visuel clair.
// - Sécurité renforcée côté front.
//
// 🧩 Dépendances :
// - Utilisé dans `index.js`, `authHandlers.js`, et les pages d’inscription/connexion.
//
// 📦 Requiert certains éléments HTML avec les IDs :
// - `#phone-error`, `#email-error`, `#register-password`, `#register-submit`, etc.
//
// =============================================================


// ============================
// 🧪 Validation des champs de formulaire (téléphone, email)
// ============================

// ✅ export la fonction validation du telephone
export function validatePhoneInput() {
    const phoneInput = this;
    const phoneError = document.getElementById("phone-error");
    const regex = /^\d*$/;

    phoneError.style.display = regex.test(phoneInput.value) ? "none" : "block";
}

// ✅ export la fonction validation de l email
export function validateEmailInput() {
    const emailInput = document.getElementById("register-email");
    const emailError = document.getElementById("email-error");
    const submitBtn = document.getElementById("register-submit");
    const password = document.getElementById("register-password").value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

     // Vérifie le format de l'email
     if (!emailRegex.test(emailInput.value)) {
        emailInput.classList.add("invalid");
        emailError.style.display = "block";
        submitBtn.disabled = true;
    } else {
        emailInput.classList.remove("invalid");
        emailError.style.display = "none";

        // Active le bouton seulement si le mot de passe est fort
        submitBtn.disabled = !isStrongPassword(password);
    }
}


// ============================
// 🔐 Gestion du mot de passe : robustesse, critères, style, validation
// ============================

// ✅ Vérifie si un mot de passe est considéré comme fort
export function isStrongPassword(password) {
    const minLength = 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return password.length >= minLength && hasUpper && hasLower && hasDigit && hasSpecial;
}

// ✅ Calcule la robustesse du mot de passe (score de 0 à 5)
export function getPasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    return strength;
}

// ✅ Met à jour l'affichage du texte de robustesse
export function updateStrengthDisplay(strength, element) {
    const messages = [
        "Trop faible ❌",
        "Faible ⚠️",
        "Moyen 🟡",
        "Correct 🟢",
        "Bon ✅",
        "Excellent 🔐"
    ];

    const colors = [
        "darkred",
        "orangered",
        "orange",
        "goldenrod",
        "green",
        "darkgreen"
    ];

    element.textContent = "Robustesse : " + messages[strength];
    element.style.color = colors[strength];
}

// ✅ Met à jour les critères de validation affichés sous le champ mot de passe
export function updatePasswordCriteria(password) {
    const criteria = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        digit: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    for (const key in criteria) {
        const element = document.getElementById(key);
        if (criteria[key]) {
            element.textContent = `✅ ${element.textContent.replace(/^❌ |✅ /, '')}`;
            element.classList.add("valid");
            element.classList.remove("invalid");
        } else {
            element.textContent = `❌ ${element.textContent.replace(/^❌ |✅ /, '')}`;
            element.classList.add("invalid");
            element.classList.remove("valid");
        }
    }
}

// ✅ Applique une couleur au champ mot de passe selon sa robustesse
export function updatePasswordInputStyle(inputElement, strength) {
    inputElement.classList.remove("password-weak", "password-medium", "password-strong");

    if (strength <= 2) {
        inputElement.classList.add("password-weak");
    } else if (strength <= 4) {
        inputElement.classList.add("password-medium");
    } else {
        inputElement.classList.add("password-strong");
    }
}

// ✅ Active ou désactive le bouton d'inscription selon les critères de mot de passe
export function toggleRegisterButton(password, targetButtonId = "register-submit") {
    const submitBtn = document.getElementById(targetButtonId);
    if (submitBtn) {
        submitBtn.disabled = !isStrongPassword(password);
    }
}
