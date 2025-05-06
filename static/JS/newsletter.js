// =============================================================
// 📁 newsletter.js (ou newsletterSignup.js)
// -------------------------------------------------------------
// Ce fichier gère le formulaire d’inscription à la newsletter
// présent sur le site (généralement dans le footer ou en bas
// des pages publiques).
//
// 🎯 Objectif :
// Permettre à l’utilisateur de s’abonner à la newsletter en
// saisissant son email et en envoyant la demande au serveur.
//
// 🔧 Fonctionnement principal :
// - Attend le chargement complet du DOM (`DOMContentLoaded`)
// - Cible le formulaire `#newsletter-form`, le champ `#newsletter-email`,
//   et la div d’affichage de message `#newsletter-message`
// - Intercepte la soumission du formulaire (`submit`)
// - Envoie une requête `POST` à `/subscribe-newsletter` avec le champ email
// - Affiche un message de confirmation ou d’erreur selon la réponse du serveur
//
// ✅ Avantages :
// - UX fluide : pas de rechargement de page
// - Gestion d’erreur utilisateur claire (email invalide, serveur indisponible, etc.)
// - Utilisation asynchrone moderne (`fetch` + `async/await`)
//
// 🧩 À utiliser sur :
// - Toutes les pages publiques du site avec une section newsletter
//
// 📦 Dépendances HTML :
// - Un formulaire avec l’ID `newsletter-form`
// - Un champ email avec l’ID `newsletter-email`
// - Une div de retour utilisateur avec l’ID `newsletter-message`
//
// 🛠️ Backend : nécessite un endpoint POST `/subscribe-newsletter`
// =============================================================


document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("newsletter-form");
    const emailInput = document.getElementById("newsletter-email");
    const messageDiv = document.getElementById("newsletter-message");

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = emailInput.value;

            try {
                const res = await fetch("/subscribe-newsletter", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email })
                });

                const data = await res.json();
                if (res.ok) {
                    messageDiv.textContent = "📩 Merci ! Un email de confirmation vous a été envoyé.";
                    emailInput.value = "";
                } else {
                    messageDiv.textContent = data.error || "❌ Une erreur est survenue.";
                }
            } catch (err) {
                console.error("Erreur d’inscription :", err);
                messageDiv.textContent = "❌ Une erreur est survenue.";
            }
        });
    }
});
