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
