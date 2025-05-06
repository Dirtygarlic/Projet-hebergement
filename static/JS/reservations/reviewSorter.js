// =============================================================
// 📁 reviewSorter.js
// -------------------------------------------------------------
// Ce fichier contient une fonction utilitaire dédiée au tri
// d’un tableau d’avis clients selon un critère donné,
// **sans effectuer l’affichage** (logique pure).
//
// 🎯 Objectif :
// Séparer la logique de tri de celle d’affichage pour garder
// un code plus modulaire, réutilisable et testable.
//
// 🔧 Fonctionnalité :
// - `sortReviewsOnly(reviews, criterion)` :
//   → Trie un tableau d’avis en fonction du critère fourni :
//      • "date" : du plus récent au plus ancien,
//      • "rating" : du mieux noté au moins bien noté,
//      • "name" : ordre alphabétique des prénoms.
//   → Ne modifie **pas** le tableau original (`.sort()` est fait sur une copie).
//   → Retourne un nouveau tableau trié.
//
// ✅ Ce fichier est utilisé par d’autres modules comme
// `reservationReview.js` pour déléguer le tri des avis,
// tout en conservant l’affichage dans `reviewManager.js`.
//
// 🧩 Avantage : rend la logique de tri indépendante de l’interface.
// =============================================================



// ============================
// 🧮 reviewSorter.js
// ============================

/**
 * Trie un tableau d'avis selon un critère (sans l'afficher)
 * @param {Array} reviews - Liste des avis à trier
 * @param {string} criterion - "date", "rating" ou "name"
 * @returns {Array} - Liste triée
 */
export function sortReviewsOnly(reviews, criterion) {
    if (!Array.isArray(reviews)) return [];

    const sorted = [...reviews]; // On copie pour ne pas muter l’original

    if (criterion === "date") {
        sorted.sort((a, b) => new Date(b.date_posted) - new Date(a.date_posted));
    } else if (criterion === "rating") {
        sorted.sort((a, b) => b.rating - a.rating);
    } else if (criterion === "name") {
        sorted.sort((a, b) => a.first_name.localeCompare(b.first_name));
    }

    return sorted;
}
