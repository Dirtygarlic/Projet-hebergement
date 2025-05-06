// =============================================================
// 📁 reservationInit.js
// -------------------------------------------------------------
// Ce fichier contient la fonction `initReservations()` qui orchestre
// l’affichage initial de la carte, la gestion des marqueurs d’hôtels
// et le chargement dynamique des avis lorsque l’utilisateur clique
// sur un hôtel.
//
// 🎯 Objectif :
// Centraliser l’initialisation de la carte et de l’interface lorsqu’un
// hôtel est chargé ou sélectionné, y compris les avis et les infos à afficher.
//
// 🔧 Fonctionnalités :
// - Vérifie si la carte (`window.map`) existe déjà ; sinon, elle est créée.
// - Ajoute un marqueur pour l’hôtel passé en paramètre.
// - Attache une fonction au clic sur ce marqueur :
//     → Charge les avis de l’hôtel (`loadReviews`)
//     → Met à jour l’objet `hotel` avec ses avis
//     → Met à jour dynamiquement l’URL (`updateHotelInURL`)
//     → Met à jour l’affichage des infos (`updateHotelInfo`)
//     → Affiche les avis (`displayReviews`) et active le tri (`setupReviewSorting`)
//
// 🧩 Dépendances :
// - `updateHotelInURL` depuis `reservation.js`
// - `createMap`, `addHotelMarker`, `updateHotelInfo` depuis `reservationMap.js`
// - `loadReviews` depuis `reviewLoader.js`
// - `displayReviews` depuis `reviewManager.js`
// - `setupReviewSorting` depuis `reservationReview.js`
//
// ✅ Utilisé pour initialiser la vue complète d’un hôtel (carte + infos + avis)
// =============================================================



import { updateHotelInURL } from '../reservation.js';
import { createMap, addHotelMarker, updateHotelInfo } from './reservationMap.js'; 
import { loadReviews } from "./reviewLoader.js";
import { displayReviews } from './reviewManager.js';
import { setupReviewSorting } from './reservationReview.js';


export function initReservations(hotel) {
    // Si la carte est déjà créée, il n'est pas nécessaire de la recréer
    if (!window.map) {
        createMap(hotel.latitude, hotel.longitude);
    }
    addHotelMarker(hotel, async (selectedHotel) => {
        const reviews = await loadReviews(selectedHotel.id, "note");
        selectedHotel.reviews = reviews;                     
        updateHotelInURL(selectedHotel);                          
        updateHotelInfo(selectedHotel);
        displayReviews(reviews); 
        setupReviewSorting(reviews); 
        //location.reload();  // recharge propre avec les bons paramètres
    });
}