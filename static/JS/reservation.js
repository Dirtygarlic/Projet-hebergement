// ============================
// 📑 reservations.js (modulaire)
// ============================
// Ce fichier est le point d'entrée principal pour la page de réservation.
// Il orchestre :
// - la récupération des données d'hôtel et avis via l'URL,
// - le rendu de la carte et des marqueurs,
// - le formulaire de réservation et sa validation,
// - l'affichage paginé des avis clients,
// - les tris dynamiques,
// - les appels API pour récupérer les autres hôtels et les avis.
//
// Chaque logique métier est déléguée à un module JS propre et clair. 🧩


/*
JS/
├── reservations.js             # Point d'entrée principal
└── reservations/               # Modules organisés
    ├── urlUtils.js             # 🔍 Récupération des paramètres URL + reviews
    ├── reviewManager.js        # ⭐ Affichage + pagination des avis
    ├── reviewSorter.js         # 🔃 Tri pur et réutilisable des avis
    ├── reservationReview.js    # 🧠 Écouteurs DOM des tris dynamiques
    ├── reviewLoader.js         # 📡 Appel API /get_reviews
    ├── reservationMap.js       # 🗺️ Carte, marqueurs, update info hôtel
    ├── mapLoader.js            # 🏨 Chargement des autres hôtels (carte)
    ├── reservationForm.js      # 📋 Formulaire réservation + paiement
    ├── reservationDateLogic.js # 📅 Logique checkin/checkout
    ├── datePickerValidator.js  # 📆 Validation native du champ date HTML
    ├── formValidator.js        # ✉️📞 Validation email/téléphone
*/

/* 🧭 Table des matières du fichier reservations.js :
1. 🔍 Récupération des données URL + avis
2. 📋 Préremplissage formulaire
3. ✉️ Validation email / téléphone
4. 📝 Affichage initial des avis (triés par note dès le départ)
5. 🏨 Construction de l’objet hôtel
6. 🗺️ Carte interactive
7. 📡 Chargement des avis depuis API
8. 🏨 Chargement des autres hôtels (carte)
9. 📊 Ajout des écouteurs de tri
10. 🧾 Réservation + redirection paiement
11. 📅 Gestion des dates checkin/checkout
12. 🔒 Empêche le zoom carte pendant la saisie dans un champ
*/


// ============================
// 0. 🔍 Importation des modules
// ============================

// 🔍 Données URL + reviews
import { getParamsAndReviews } from './reservations/urlUtils.js';

// ⭐ Affichage + tri des avis
import { displayReviews } from './reservations/reviewManager.js';
import { sortReviewsOnly } from './reservations/reviewSorter.js'; // ✅ pour tri séparé
import { setupReviewSorting } from './reservations/reservationReview.js';

// 📡 API
import { loadReviews } from './reservations/reviewLoader.js';

// 🗺️ Carte et données hôtel
import {
  createMap,
  addHotelMarker,
  updateHotelInfo,
  getHotelData
} from './reservations/reservationMap.js';
import { initReservationMap } from './reservations/mapLoader.js';

// 📋 Formulaire réservation
import { setupReservationForm } from './reservations/reservationForm.js';

// 📅 Dates + validation
import { setupDateValidation } from './reservations/reservationDateLogic.js';
import { setupCheckinCheckoutValidation } from './reservations/datePickerValidator.js';
import { validateEmailPhoneFields } from './reservations/formValidator.js';

// Session gardee
import { checkLoginOnLoad } from './authentification/sessionManager.js';


document.addEventListener("DOMContentLoaded", () => {
    checkLoginOnLoad();
    
    console.log("🚀 reservations.js chargé et DOM prêt !");

    // ============================
    // 1. 🔍 Récupération des données URL + avis
    // ============================
    const { params, reviews } = getParamsAndReviews();
    console.log("🔍 Paramètres récupérés :", Object.fromEntries(params.entries()));
    console.log("🔍 Reviews après décodage :", reviews);

    // ============================
    // 2. 📋 Préremplissage formulaire
    // ============================
    const fieldMapping = {
        "first-name": "first_name",
        "user_name": "name", // 🧠 correspondance propre
        "email": "email",
        "phone": "phone"
    };
    
    Object.entries(fieldMapping).forEach(([fieldId, storageKey]) => {
        const field = document.getElementById(fieldId);
        const value = localStorage.getItem(storageKey);
        if (field && value) {
            field.value = storageKey === "phone" ? value.replace(/[^0-9]/g, "") : value;
        }
    });

    // ============================
    // 3. ✉️ Validation email / téléphone
    // ============================
    validateEmailPhoneFields();

    // ============================
    // 4. 📝 Affichage initial des avis (triés par note dès le départ)
    // ============================
    const sortedByRating = sortReviewsOnly(reviews, "rating");
    displayReviews(sortedByRating);

    // ============================
    // 5. 🏨 Construction de l’objet hôtel
    // ============================
    const hotel = getHotelData(params);
    console.log("✅ Hôtel chargé :", hotel);
    updateHotelInfo(hotel);

    // ============================
    // 6. 🗺️ Carte interactive
    // ============================
    if (!window.map) {
        console.log("🗺️ Création de la carte...");
        createMap(hotel.latitude, hotel.longitude);
    } else {
        window.map.setView([hotel.latitude, hotel.longitude], 12);
    }

    addHotelMarker(hotel, updateHotelInfo, loadReviews);

    // ============================
    // 7. 📡 Chargement des avis depuis API si absents
    // ============================
    const hotelId = params.get("hotel_id");
    if (!reviews.length && hotelId) {
        loadReviews(hotelId, "date");
    }

    // ============================
    // 8. 🏨 Chargement des autres hôtels pour la carte
    // ============================
    initReservationMap(updateHotelInfo, loadReviews);

    // ============================
    // 9. 📊 Ajout des écouteurs de tri (après chargement du DOM)
    // ============================
    setTimeout(() => {
        setupReviewSorting(reviews);
    }, 1000);

    // ============================
    // 10. 🧾 Réservation + redirection paiement
    // ============================
    setupReservationForm();

    // ============================
    // 11. 📅 Gestion des dates checkin/checkout
    // ============================
    setupDateValidation();
    setupCheckinCheckoutValidation();

    // ============================
    // 12. 🔒 Empêche le zoom carte pendant la saisie dans un champ
    // ============================
    document.addEventListener("keydown", function (event) {
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (
            activeElement.tagName === "INPUT" ||
            activeElement.tagName === "TEXTAREA" ||
            activeElement.tagName === "SELECT" ||
            activeElement.isContentEditable
        );

        if (isInputFocused) {
            event.stopPropagation(); // Empêche Leaflet de capter la touche
        }
    }, true);
});

