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
