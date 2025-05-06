// =============================================================
// 📁 mapLoader.js
// -------------------------------------------------------------
// Ce fichier gère le chargement dynamique de tous les hôtels
// depuis l'API `/hotels` et leur affichage sur la carte à l’aide
// de la fonction `addHotelMarker()` provenant de `reservationMap.js`.
//
// 🎯 Objectif :
// Afficher automatiquement tous les hôtels disponibles sur la carte
// avec une animation progressive pour éviter une surcharge visuelle,
// et connecter chaque marqueur à deux fonctions externes :
// `updateHotelInfo` (mise à jour des infos) et `loadReviews` (chargement des avis).
//
// 🔧 Fonctionnalités :
// - Requête `fetch` vers l’API `/hotels`.
// - Filtrage des hôtels valides (avec latitude/longitude).
// - Ajout progressif des marqueurs avec `setTimeout` pour fluidifier le rendu.
// - Affichage de logs utiles et gestion des erreurs en console.
//
// 🧩 Dépendance :
// - `addHotelMarker()` (depuis `reservationMap.js`)
// =============================================================


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
