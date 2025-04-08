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
