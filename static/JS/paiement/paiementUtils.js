// =============================================================
// 📁 paiementUtils.js
// -------------------------------------------------------------
// Ce module regroupe des fonctions utilitaires pour la page
// `paiement.html`, liées à la gestion des prix et du calcul
// de la durée du séjour.
//
// 🎯 Objectif :
// Fournir des outils simples et réutilisables pour :
// - récupérer le prix par nuit d’un hôtel,
// - calculer le nombre de nuits entre deux dates.
//
// 🔧 Fonctions :
//
// 1. `getPricePerNight(hotelId)`
//    → Fait une requête API `/get_price_per_night/<hotel_id>`
//    → Retourne le prix par nuit (ou 100 € par défaut en fallback)
//
// 2. `calculateNumberOfNights(checkin, checkout)`
//    → Prend deux chaînes de date (`YYYY-MM-DD`)
//    → Calcule le nombre total de nuits entre les deux dates
//
// 📦 Utilisé dans :
// - `paiement.js`, pour calculer le prix total avant d’envoyer
//   la session de paiement Stripe
//
// ✅ Avantages :
// - Encapsule la logique de calcul du prix et de la durée,
// - Sépare clairement les responsabilités de la page paiement,
// - Peut être réutilisé dans d’autres pages si besoin.
//
// ⚠️ Le backend `/get_price_per_night/<id>` doit renvoyer :
// `{ "price_per_night": 150 }` pour que cela fonctionne correctement.
// =============================================================


export async function getPricePerNight(hotelId) {
    const response = await fetch(`/get_price_per_night/${hotelId}`);
    const data = await response.json();
    return data.price_per_night || 100;
}

export function calculateNumberOfNights(checkin, checkout) {
    const date1 = new Date(checkin);
    const date2 = new Date(checkout);
    const diffTime = date2 - date1;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
