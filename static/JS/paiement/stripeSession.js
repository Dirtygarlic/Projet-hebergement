// =============================================================
// 📁 stripeSession.js
// -------------------------------------------------------------
// Ce module contient la logique de création d’une session
// de paiement Stripe à partir des données de réservation.
//
// 🎯 Objectif :
// Permettre à l’utilisateur de lancer un paiement sécurisé
// en créant une session Stripe côté serveur, puis rediriger
// automatiquement vers l’interface de paiement Stripe.
//
// 🔧 Fonction principale :
// - `createStripeSession(data)`
//   → Envoie une requête `POST` à `/create-checkout-session`
//   → Inclut toutes les infos de réservation nécessaires
//   → Attend une réponse contenant `session.url`
//   → Redirige automatiquement l’utilisateur vers Stripe
//   → Affiche une alerte en cas d’échec ou absence d’URL
//
// 📦 Données attendues (exemple dans `data`) :
// - hotel_id, user_id, stripe_customer_id, checkin, checkout,
//   total_price, email, prénom, etc. (à définir côté back)
//
// ✅ Avantages :
// - Centralise la logique Stripe côté front
// - Gère les erreurs et affiche des messages clairs
// - Désactive le bouton "Payer" pendant la redirection
//
// 🧩 Utilisé dans :
// - `paiement.js`, au clic sur le bouton de paiement
//
// ⚠️ Nécessite un endpoint Flask `/create-checkout-session`
// bien configuré pour renvoyer un objet JSON contenant `{ url: ... }`
// =============================================================


export async function createStripeSession(data) {
    try {
        console.log("💳 Données envoyées à Stripe :", data);

        console.log("🧪 Métadonnées envoyées :", data);

        const response = await fetch("/create-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status} : ${response.statusText}`);
        }

        const session = await response.json();

        if (session.url) {
            const payBtn = document.getElementById("pay-button");
            payBtn.disabled = true;
            payBtn.textContent = "Redirection en cours...";
            setTimeout(() => {
                window.open(session.url, "_self");
            }, 100);
        } else {
            alert("❌ Erreur de session Stripe (pas d’URL)");
        }

    } catch (error) {
        console.error("❌ Erreur Stripe :", error);
        alert("❌ Impossible de créer une session Stripe.\n" + error.message);
    }
}
