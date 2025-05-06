// =============================================================
// 📁 resetRegisterForm.js
// -------------------------------------------------------------
// Ce fichier contient une fonction unique qui réinitialise
// complètement le formulaire d'inscription utilisateur.
//
// 🎯 Objectif :
// Fournir un moyen propre et centralisé de réinitialiser tous
// les champs et les états visuels associés au formulaire
// d'inscription après soumission réussie, changement d'utilisateur,
// ou fermeture de la modale.
//
// 🔧 Fonctionnalités :
// - Vide tous les champs texte : nom, prénom, téléphone, email, mot de passe.
// - Cache les messages d'erreur (email et téléphone).
// - Réinitialise la zone d'affichage de robustesse du mot de passe.
// - Désactive le bouton "Valider" du formulaire.
// - Supprime les couleurs de style sur le champ mot de passe.
// - Remet à zéro les critères de validation (longueur, majuscule, etc.).
//
// ✅ Appelé automatiquement après une inscription réussie
// ou manuellement lors d’un reset utilisateur.
//
// 🧩 Utilisé dans :
// - Le module `authHandlers.js`
// - La gestion de l’interface utilisateur (`uiManager.js`)
// - Tout contexte où le formulaire d'inscription doit être vidé.
//
// ⚠️ Ce fichier suppose que les éléments HTML suivants sont présents :
// - Champs `register-name`, `register-email`, etc.
// - `#password-criteria`, `#password-strength-text`
// - `#register-submit`, `#phone-error`, `#email-error`, etc.
//
// =============================================================


// ============================
// 🧼 Réinitialisation du formulaire d'inscription
// ============================
export function resetRegisterForm() {
    // 🔄 Réinitialise les champs texte
    document.getElementById("register-name").value = "";
    document.getElementById("register-firstname").value = "";
    document.getElementById("register-phone").value = "";
    document.getElementById("register-email").value = "";
    document.getElementById("register-password").value = "";
    document.getElementById("confirm-password").value = "";

    // 🔒 Désactive le bouton de validation
    const submitBtn = document.getElementById("register-submit");
    if (submitBtn) submitBtn.disabled = true;

    // ❌ Cache les erreurs visuelles
    const phoneError = document.getElementById("phone-error");
    if (phoneError) phoneError.style.display = "none";

    const emailError = document.getElementById("email-error");
    if (emailError) emailError.style.display = "none";

    // 🧹 Nettoie les critères de mot de passe
    const strengthText = document.getElementById("password-strength-text");
    if (strengthText) {
        strengthText.textContent = "";
        strengthText.classList.add("hidden");
    }

    const criteriaList = document.getElementById("password-criteria");
    if (criteriaList) criteriaList.classList.add("hidden");

    const criteriaIds = ["length", "uppercase", "lowercase", "digit", "special"];
    criteriaIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = `❌ ${el.textContent.replace(/^✅ |^❌ /, '')}`;
            el.classList.add("invalid");
            el.classList.remove("valid");
        }
    });

    // 💅 Supprime les classes de couleur éventuelles sur le champ
    const passwordInput = document.getElementById("register-password");
    if (passwordInput) {
        passwordInput.classList.remove("password-weak", "password-medium", "password-strong");
    }
}
