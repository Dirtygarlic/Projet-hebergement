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
