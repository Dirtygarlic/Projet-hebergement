// =============================================================
// 📁 formValidator.js
// -------------------------------------------------------------
// Ce fichier contient la fonction `validateEmailPhoneFields()`
// qui gère la validation en temps réel des champs email et téléphone
// dans le formulaire de réservation.
//
// 🎯 Objectif :
// Vérifier que l'utilisateur saisit une adresse email et un numéro
// de téléphone valides, afficher des messages d'erreur clairs si
// les champs sont vides ou incorrects, et activer/désactiver le
// bouton de soumission en conséquence.
//
// 🔧 Fonctionnalités :
// - Validation avec expressions régulières pour l'email et le téléphone.
// - Affichage dynamique de messages d'erreur en dessous des champs.
// - Gestion des classes CSS `valid` et `invalid` pour retour visuel.
// - Désactivation du bouton de soumission tant que les deux champs
//   ne sont pas valides.
//
// ⚠️ Affiche un avertissement dans la console si les éléments requis
//    ne sont pas trouvés dans le DOM.
// =============================================================


// ============================
// ✉️📞 formValidator.js
// ============================

export function validateEmailPhoneFields() {
    const emailField = document.getElementById("email");
    const phoneField = document.getElementById("phone");
    const submitBtn = document.getElementById("submit-btn");
    const emailError = document.getElementById("reservation-email-error");
    const phoneError = document.getElementById("reservation-phone-error");

    if (!emailField || !phoneField || !submitBtn) {
        console.warn("⚠️ Champs email, téléphone ou bouton manquant");
        return;
    }

    let emailTouched = emailField.value.trim() !== "";
    let phoneTouched = phoneField.value.trim() !== "";

    function validateEmailPhone() {
        const email = emailField.value.trim();
        const phone = phoneField.value.trim();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\+?[0-9\s\-()]{7,}$/;

        const emailValid = emailRegex.test(email);
        const phoneValid = phoneRegex.test(phone);

        const emailEmpty = email === "";
        const phoneEmpty = phone === "";

        // ✉️ Email
        if (emailTouched) {
            if (emailEmpty) {
                emailError.textContent = "❌ Le champ email est obligatoire.";
                emailError.classList.add("visible");
            } else if (!emailValid) {
                emailError.textContent = "❌ Veuillez entrer une adresse email valide.";
                emailError.classList.add("visible");
            } else {
                emailError.textContent = "";
                emailError.classList.remove("visible");
            }
        }

        // 📞 Téléphone
        if (phoneTouched) {
            if (phoneEmpty) {
                phoneError.textContent = "❌ Le champ téléphone est obligatoire.";
                phoneError.classList.add("visible");
            } else if (!phoneValid) {
                phoneError.textContent = "❌ Numéro invalide. Exemple : +33 6 12 34 56 78";
                phoneError.classList.add("visible");
            } else {
                phoneError.textContent = "";
                phoneError.classList.remove("visible");
            }
        }

        emailField.classList.toggle("invalid", emailTouched && (!emailValid || emailEmpty));
        phoneField.classList.toggle("invalid", phoneTouched && (!phoneValid || phoneEmpty));

        emailField.classList.toggle("valid", emailTouched && emailValid);
        phoneField.classList.toggle("valid", phoneTouched && phoneValid);

        submitBtn.disabled = !(emailValid && phoneValid);
    }

    emailField.addEventListener("input", () => {
        emailTouched = true;
        validateEmailPhone();
    });

    phoneField.addEventListener("input", () => {
        phoneTouched = true;
        validateEmailPhone();
    });

    // Lancer la validation immédiatement
    validateEmailPhone();
}
