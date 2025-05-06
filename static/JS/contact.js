// =============================================================
// 📁 contactValidation.js
// -------------------------------------------------------------
// Ce script assure la **validation côté client** du formulaire
// de contact avant soumission, afin d’éviter des erreurs simples
// et améliorer l’expérience utilisateur.
//
// 🎯 Objectif :
// Empêcher l’envoi du formulaire si le téléphone ou l’email
// est mal formaté, en affichant une alerte immédiate.
//
// 🔧 Fonctionnalités :
// - Intercepte la soumission du formulaire `#contact-form`
// - Vérifie que le champ téléphone contient **uniquement des chiffres**
// - Vérifie que l’adresse email est au **format valide standard**
// - Affiche un message d’alerte en cas d’erreur et **bloque l’envoi**
//
// 🧩 À utiliser sur :
// - Toute page contenant un formulaire avec l’ID `contact-form`
//   et des champs `#phone` et `#email`
//
// ✅ Avantages :
// - Évite des erreurs serveur inutiles
// - Améliore la clarté et la réactivité pour l’utilisateur
// - Peut être combiné avec une validation côté serveur pour plus de sécurité
//
// ⚠️ Remarque : ne remplace pas la validation côté back-end,
// mais la complète côté front pour fluidifier l'expérience.
// =============================================================


document.getElementById("contact-form").addEventListener("submit", function(event) {
    const phoneInput = document.getElementById("phone");
    const emailInput = document.getElementById("email");
    const phoneValue = phoneInput.value;
    const emailValue = emailInput.value;

    // Vérification du format du téléphone (seulement des chiffres)
    if (!/^\d+$/.test(phoneValue)) {
        alert("Le numéro de téléphone doit contenir uniquement des chiffres.");
        event.preventDefault();
        return;
    }

    // Vérification du format de l'email
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(emailValue)) {
        alert("L'email n'est pas valide.");
        event.preventDefault();
        return;
    }
});