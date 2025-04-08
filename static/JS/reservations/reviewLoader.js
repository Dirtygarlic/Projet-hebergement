// ============================
// 📡 reviewLoader.js
// ============================

import { displayReviews } from './reviewManager.js';

export function loadReviews(hotelId, sortBy = "date") {
    console.log(`📡 Chargement des avis pour l'hôtel ID: ${hotelId} avec tri: ${sortBy}`);

    fetch(`/get_reviews?hotel_id=${hotelId}&sort_by=${sortBy}`)
        .then(response => {
            if (!response.ok) throw new Error("Erreur HTTP : " + response.status);
            return response.json();
        })
        .then(reviews => {
            console.log("✅ Avis récupérés depuis l'API :", reviews);
            displayReviews(reviews);
        })
        .catch(error => {
            console.error("❌ Erreur lors du chargement des avis :", error);
        });
}
