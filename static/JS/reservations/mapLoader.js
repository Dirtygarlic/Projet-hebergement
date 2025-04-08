// ============================
// 🧭 mapLoader.js
// ============================

import { addHotelMarker } from './reservationMap.js';

/**
 * Charge dynamiquement tous les hôtels depuis l'API et les affiche sur la carte.
 * @param {Function} updateHotelInfo - Fonction à appeler au clic sur un marqueur.
 * @param {Function} loadReviews - Fonction à appeler pour charger les avis.
 */
export function initReservationMap(updateHotelInfo, loadReviews) {
    fetch("/hotels")
        .then(response => response.json())
        .then(hotels => {
            console.log("📌 Hôtels récupérés :", hotels);
            if (!hotels.length) return console.warn("⚠️ Aucun hôtel trouvé.");

            hotels.forEach((hotel, index) => {
                setTimeout(() => {
                    if (hotel.latitude && hotel.longitude) {
                        addHotelMarker(hotel, updateHotelInfo, loadReviews);
                    }
                }, index * 50); // ⏳ Évite surcharge de la carte
            });
        })
        .catch(error => {
            console.error("❌ Erreur lors du chargement des hôtels :", error);
        });
}
