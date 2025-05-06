// =============================================================
// 📁 resetPassword.js
// -------------------------------------------------------------
// Ce fichier gère l'ensemble de la logique de réinitialisation
// de mot de passe dans l'application.
//
// Il prend en charge :
// - la demande de lien de réinitialisation (à partir de l'email),
// - la validation de la robustesse du nouveau mot de passe,
// - la soumission sécurisée du mot de passe via un token,
// - le feedback visuel sur les critères de sécurité,
// - le masquage/affichage dynamique des champs de mot de passe.
//
// 🎯 Objectif :
// Offrir une expérience fluide et sécurisée pour réinitialiser
// un mot de passe oublié, tout en appliquant des règles strictes
// de robustesse et de sécurité.
//
// 🔐 Fonctionnalités principales :
// - `resetPassword()`
//   → Envoie l'email au backend pour générer un lien sécurisé.
// - Masque/affiche les mots de passe (`togglePasswordVisibility()`).
// - Vérifie le token présent dans l'URL.
// - Analyse et affiche la force du mot de passe (avec couleurs, critères...).
// - Valide la correspondance entre les deux champs.
// - Envoie la nouvelle valeur au backend (`/submit-new-password`).
//
// ✅ Utilise des fonctions de `formValidation.js` pour :
// - Calculer la robustesse (`getPasswordStrength()`),
// - Afficher un message dynamique (`updateStrengthDisplay()`),
// - Colorer le champ (`updatePasswordInputStyle()`),
// - Activer/désactiver le bouton (`toggleRegisterButton()`),
// - Mettre à jour les critères (majuscule, chiffre, etc.).
//
// 🧩 Utilisé dans :
// - La page `reset-password.html`
// - Via le bouton "Mot de passe oublié ?" du formulaire de connexion.
//
// ⚠️ Dépend de l'ID `resetForm` dans le HTML
// ⚠️ Nécessite un token dans l'URL pour fonctionner.
//
// =============================================================


// ============================
// 📦 Importations des modules
// ============================
import {
    getPasswordStrength,
    updateStrengthDisplay,
    updatePasswordCriteria,
    updatePasswordInputStyle,
    isStrongPassword,
    toggleRegisterButton
} from './formValidation.js';


// ============================
// 🔑 Lien de réinitialisation du mot de passe
// ============================
export function resetPassword() {
    const email = document.getElementById("login-email").value;

    if (!email) {
        alert("Veuillez entrer votre email pour réinitialiser votre mot de passe.");
        return;
    }

    fetch("http://127.0.0.1:5003/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
    })
        .then(res => res.json())
        .then(data => {
            alert(data.message || data.error || "Une erreur est survenue.");

            // Si la réponse indique un succès (optionnel selon ton back-end)
            if (data.message) {
                // Efface le champ email (si succès confirmé par message)
                document.getElementById("login-email").value = "";
            }
        })
        .catch(error => {
            console.error("Erreur:", error);
            alert("Une erreur est survenue lors de la demande de réinitialisation.");
        });
}


// ============================
// 🧠 Initialisation du formulaire de réinitialisation
// ============================

//👁️ Gestion de l'affichage/masquage des mots de passe
function togglePasswordVisibility(toggleId, inputId) {
    const toggle = document.getElementById(toggleId);
    const input = document.getElementById(inputId);

    if (toggle && input) {
        toggle.addEventListener("click", function () {
            input.type = input.type === "password" ? "text" : "password";
            this.textContent = input.type === "password" ? "🧿" : "🙈";
        });
    }
}

document.addEventListener("DOMContentLoaded", function () {
    togglePasswordVisibility("toggle-new-password", "new-password");
    togglePasswordVisibility("toggle-confirm-password", "confirm-password");

    const form = document.getElementById("resetForm");
    const message = document.getElementById("reset-message");

    if (!form || !message) return;

    const newPasswordInput = document.getElementById("new-password");
    const confirmPasswordInput = document.getElementById("confirm-password");
    const strengthText = document.getElementById("password-strength-text");
    const criteriaList = document.getElementById("password-criteria");

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
        message.textContent = "Lien de réinitialisation invalide ou expiré.";
        form.style.display = "none";
        return;
    }


    // ============================
    // 🔐 Gestion de la robustesse du mot de passe
    // ============================
    newPasswordInput.addEventListener("input", () => {
        const password = newPasswordInput.value;
        const strength = getPasswordStrength(password);


        updateStrengthDisplay(strength, strengthText);
        updatePasswordCriteria(password);
        updatePasswordInputStyle(newPasswordInput, strength);
        toggleRegisterButton(password, "reset-button");
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


    // ============================
    // 📤 Soumission du nouveau mot de passe
    // ============================
    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (newPassword !== confirmPassword) {
            message.textContent = "❌ Les mots de passe ne correspondent pas.";
            return;
        }

        if (!isStrongPassword(newPassword)) {
            message.textContent = "❌ Le mot de passe est trop faible.";
            return;
        }

        fetch("http://127.0.0.1:5003/submit-new-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: token, new_password: newPassword })
        })
            .then(res => res.json())
            .then(data => {
                if (data.message) {
                    message.classList.remove("error");
                    message.classList.add("success");
                    message.textContent = data.message + " Redirection en cours...";
                    form.reset();

                    setTimeout(() => {
                        window.location.href = "/";
                    }, 3000);
                } else {
                    message.classList.remove("success");
                    message.classList.add("error");
                    message.textContent = data.error || "Une erreur est survenue.";
                }
            })
            .catch(error => {
                console.error("Erreur:", error);
                message.textContent = "Une erreur réseau est survenue.";
            });
    });
});
