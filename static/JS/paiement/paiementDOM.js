// =============================================================
// 📁 paiementDOM.js
// -------------------------------------------------------------
// Ce module gère l’affichage dynamique des **détails de réservation**
// sur la page `paiement.html`, juste avant que l’utilisateur procède
// au paiement (Stripe ou autre).
//
// 🎯 Objectif :
// Afficher un résumé clair et complet de la réservation en cours,
// en insérant les données du client et de l’hôtel dans le DOM.
//
// 🔧 Fonction principale :
// - `displayReservationDetails(data, numberOfNights, totalPrice)`
//   → Injecte dans le HTML :
//     • les dates de séjour (checkin / checkout),
//     • le nombre de personnes (adultes / enfants),
//     • le nombre de nuits,
//     • le prix total (arrondi à 2 décimales),
//     • les infos utilisateur (civilité, nom, email, téléphone),
//     • l’image de l’hôtel (avec fallback sur image par défaut)
//
// 📦 Données attendues :
// - `data` : objet contenant les infos utilisateur et réservation
// - `numberOfNights` : nombre total de nuits calculé en amont
// - `totalPrice` : montant total à afficher
//
// 🧩 Utilisé dans :
// - `paiement.js`, juste avant le lancement de la session Stripe
//
// ✅ Avantages :
// - Prépare visuellement la page de paiement
// - Offre une vérification pour l’utilisateur avant paiement
// - Empêche les erreurs visuelles grâce à un fallback d’image
//
// 📋 Dépendance HTML :
// - Des éléments avec les ID suivants doivent exister :
//   `#checkin`, `#checkout`, `#guests`, `#number-of-nights`,
//   `#total-price`, `#gender`, `#first_name`, `#user_name`,
//   `#email`, `#phone`, `#hotel-image`
//
// ⚠️ Assurez-vous que `data.imageUrl` est bien défini,
// sinon l’image de l’hôtel tombera sur celle par défaut.
// =============================================================


export function displayReservationDetails(data, numberOfNights, totalPrice) {
    const {
        checkin, checkout, guests, adults, children,
        gender, firstName, userName, email, phone, imageUrl
    } = data;

    document.getElementById("checkin").textContent = checkin;
    document.getElementById("checkout").textContent = checkout;
    document.getElementById("guests").textContent = `${guests} (Ad: ${adults}, Enf: ${children})`;
    document.getElementById("number-of-nights").textContent = `${numberOfNights} nuit(s)`;
    document.getElementById("total-price").textContent = totalPrice.toFixed(2) + " €";
    document.getElementById("gender").textContent = gender;
    document.getElementById("first_name").textContent = firstName;
    document.getElementById("user_name").textContent = userName;
    document.getElementById("email").textContent = email;
    document.getElementById("phone").textContent = phone;

    const imageElement = document.getElementById("hotel-image");
    if (imageElement) {
        imageElement.src = imageUrl;
        imageElement.onerror = () => imageElement.src = "/static/Image/default.jpg";
    }
}
