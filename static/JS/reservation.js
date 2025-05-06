// ============================
// 📑 reservations.js – Point d’entrée page réservation
// ============================
// Ce fichier orchestre :
// - la récupération des données de l’hôtel via l’URL,
// - le chargement des avis (API),
// - l’affichage de la carte et des marqueurs,
// - le formulaire de réservation (avec validation),
// - l'affichage paginé + trié des avis clients,
// - la gestion de la session utilisateur.
//
// Chaque responsabilité est déléguée à un module JS dédié. 🧩

/*
JS/
├── reservations.js             # Point d'entrée principal
└── reservations/               # Modules organisés
    ├── urlUtils.js             # 🔍 Lecture des paramètres URL
    ├── reviewManager.js        # ⭐ Affichage + pagination des avis
    ├── reviewSorter.js         # 🔃 Tri pur
    ├── reservationReview.js    # 🧠 Listeners des tris
    ├── reviewLoader.js         # 📡 Appel API /get_reviews
    ├── reservationMap.js       # 🗺️ Carte + hôtel sélectionné
    ├── mapLoader.js            # 🏨 Chargement des autres hôtels
    ├── reservationForm.js      # 🧾 Réservation + redirection paiement
    ├── reservationDateLogic.js # 📅 Logique checkin/checkout
    ├── formValidator.js        # ✉️📞 Validation email/téléphone
    ├── sessionManager.js       # 🔒 Session utilisateur
    └── reservationInit.js      # 🧭 Init carte + markers initiaux
*/

/* 🧭 Table des matières :
0. 🔍 Importation des modules
1. 🔗 Update URL dynamique
2. 🚀 DOMContentLoaded async
    2.1 Préremplissage formulaire
    2.2 Validation email/téléphone
    2.3 Chargement des avis (API)
    2.4 Chargement hôtel + carte
    2.5 Formulaire + date
    2.6 Initialisation carte + autres hôtels
    2.7 Sécurité : empêche zoom Leaflet
*/

// ============================
// 0. 🔍 Importation des modules
// ============================

import { getParamsAndReviews } from './reservations/urlUtils.js';
import { initReservations } from './reservations/reservationInit.js';
import { displayReviews } from './reservations/reviewManager.js';
import { setupReviewSorting } from './reservations/reservationReview.js';
import { loadReviews } from './reservations/reviewLoader.js';
import {
    createMap,
    addHotelMarker,
    updateHotelInfo,
    getHotelData
} from './reservations/reservationMap.js';
import { initReservationMap } from './reservations/mapLoader.js';
import { setupReservationForm } from './reservations/reservationForm.js';
import { setupDateValidation } from './reservations/reservationDateLogic.js';
import { validateEmailPhoneFields } from './reservations/formValidator.js';
import { checkLoginOnLoad } from './authentification/sessionManager.js';

// ============================
// 1. 🔗 Met à jour dynamiquement l’URL
// ============================
export function updateHotelInURL(hotel) {
    const url = new URL(window.location);

    url.searchParams.set("hotel_id", hotel.id);
    url.searchParams.set("name", hotel.name);
    url.searchParams.set("stars", hotel.stars);
    url.searchParams.set("rating", hotel.rating);
    url.searchParams.set("equipments", hotel.equipments.join(","));
    url.searchParams.set("price", hotel.price);
    url.searchParams.set("image", hotel.image);
    url.searchParams.set("address", hotel.address);
    url.searchParams.set("description", hotel.description);
    url.searchParams.set("lat", hotel.latitude);
    url.searchParams.set("lng", hotel.longitude);

    console.log("🔗 URL mise à jour :", url.href);
    window.history.pushState({}, "", url);
}

// ============================
// 2. 🚀 Chargement principal
// ============================
document.addEventListener("DOMContentLoaded", async () => {
    checkLoginOnLoad();
    console.log("🚀 reservations.js chargé");

    const { params } = getParamsAndReviews();

    // 🔁 Si aucun hôtel, charger celui par défaut
    if (!params.get("hotel_id")) {
        console.log("📭 Aucun hôtel dans l'URL, chargement par défaut...");
        try {
            const response = await fetch("/api/default-hotel");
            const defaultHotel = await response.json();

            updateHotelInfo(defaultHotel);
            addHotelMarker(defaultHotel, updateHotelInURL);
            displayReviews(defaultHotel.reviews || []);
            createMap(defaultHotel.latitude, defaultHotel.longitude);
            initReservations(defaultHotel);
            initReservationMap(updateHotelInfo, loadReviews);
        } catch (error) {
            console.error("❌ Erreur lors du chargement de l'hôtel par défaut :", error);
        }
        return;
    }

    console.log("🔍 Paramètres URL :", Object.fromEntries(params.entries()));

    // 2.1 📋 Préremplissage formulaire
    const fieldMapping = {
        "first-name": "first_name",
        "user_name": "name",
        "email": "email",
        "phone": "phone"
    };

    Object.entries(fieldMapping).forEach(([fieldId, storageKey]) => {
        const field = document.getElementById(fieldId);
        const value = localStorage.getItem(storageKey);
        if (field && value) {
            field.value = storageKey === "phone" ? value.replace(/\D/g, "") : value;
        }
    });

    // 2.2 ✉️ Validation email / téléphone
    validateEmailPhoneFields();

    // 2.3 📝 Avis (API) triés par note
    const hotelId = params.get("hotel_id");
    if (hotelId) {
        const apiReviews = await loadReviews(hotelId, "rating");
        displayReviews(apiReviews);
        setupReviewSorting(apiReviews);
    }

    // 2.4 🏨 Hôtel + Carte
    const hotel = getHotelData(params);
    updateHotelInfo(hotel);

    if (!window.map) {
        createMap(hotel.latitude, hotel.longitude);
    } else {
        window.map.setView([hotel.latitude, hotel.longitude], 12);
    }

    initReservations(hotel);

    // 2.5 📋 Formulaire + 📅 dates
    setupReservationForm();
    setupDateValidation();
    
    // 2.6 🗺️ Autres hôtels (carte)
    initReservationMap(updateHotelInfo, loadReviews);

    // 2.7 🔒 Empêche zoom carte pendant saisie
    document.addEventListener("keydown", function (event) {
        const el = document.activeElement;
        const isFormInput = el && (
            el.tagName === "INPUT" || el.tagName === "TEXTAREA" ||
            el.tagName === "SELECT" || el.isContentEditable
        );
        if (isFormInput) event.stopPropagation();
    }, true);
});
