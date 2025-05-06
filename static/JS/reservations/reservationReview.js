// =============================================================
// 📁 reservationReview.js
// -------------------------------------------------------------
// Ce fichier gère la logique d'interaction entre les boutons de tri
// des avis clients et leur affichage sur la page de réservation.
//
// 🎯 Objectif :
// Permettre aux utilisateurs de trier dynamiquement les avis selon
// différents critères (date, note, nom) en cliquant sur les boutons
// correspondants, et afficher le résultat immédiatement.
//
// 🔧 Fonctionnalités :
// - Attache des écouteurs d'événements aux boutons de tri
//   (par date, note, nom).
// - Utilise la fonction `sortReviewsOnly()` pour trier les avis.
// - Utilise la fonction `displayReviews()` pour afficher la liste
//   des avis triés.
//
// 🧩 Dépendances :
// - `sortReviewsOnly` (depuis `reviewSorter.js`)
// - `displayReviews` (depuis `reviewManager.js`)
//
// ⚠️ Les éléments HTML correspondants aux boutons doivent avoir
//    les IDs : `sort-by-date`, `sort-by-rating`, `sort-by-name`.
// =============================================================


// ============================
// ⭐ reservationReview.js
// ============================

import { sortReviewsOnly } from './reviewSorter.js';
import { displayReviews } from './reviewManager.js';

/**
 * Attache les écouteurs de tri sur les boutons "Trier par ..."
 * @param {Array} reviews 
 */
export function setupReviewSorting(reviews) {
    document.getElementById("sort-by-date")?.addEventListener("click", () => {
        const sorted = sortReviewsOnly(reviews, "date");
        displayReviews(sorted);
    });

    document.getElementById("sort-by-rating")?.addEventListener("click", () => {
        const sorted = sortReviewsOnly(reviews, "rating");
        displayReviews(sorted);
    });

    document.getElementById("sort-by-name")?.addEventListener("click", () => {
        const sorted = sortReviewsOnly(reviews, "name");
        displayReviews(sorted);
    });
}
