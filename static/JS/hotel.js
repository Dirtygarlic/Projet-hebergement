// =======================================
// 📑 hotel.js - Gestion des hôtels, filtres, et recherche
// =======================================
// Ce fichier est le point d’entrée principal pour la page d’exploration des hôtels.
// Il orchestre :
// - le chargement initial des hôtels,
// - la recherche via la barre globale,
// - l’application de filtres spécifiques,
// - l’affichage dynamique des résultats,
// - le reset des filtres,
// - et l’autocomplétion du champ destination.
//
// Toutes les responsabilités sont réparties dans des modules spécialisés du dossier `filters/`. 🧩

/*
JS/
├── hotel.js                   # Point d’entrée de la page Hôtels
└── filters/                   # Modules spécialisés pour filtrage et affichage
    ├── hotelApi.js            # 📡 Appels API (fetchHotels, fetchFilteredHotels)
    ├── hotelAutoComplete.js   # 🔠 Autocomplétion sur la ville
    ├── hotelCleanFilters.js   # 🧼 Nettoyage & validation des filtres
    ├── hotelGlobalFilters.js  # 📋 Extraction des champs du formulaire principal
    ├── hotelSpecificFilters.js# 🔍 Extraction des champs dans les filtres spécifiques
    ├── hotelRender.js         # 🏨 Rendu des hôtels dans la page (HTML)
    └── hotelReview.js         # ⭐ (facultatif) Gestion des avis si nécessaire
*/

/*
📚 Table des matières :
1. 📦 Importations des modules
2. 🔧 Variables globales
3. 🧩 Icônes équipements
4. 📅 Initialisation du calendrier
5. 📡 Soumission du formulaire de recherche
6. 🔎 Filtres spécifiques / URL
7. 🧼 Réinitialisation des filtres
8. 🚀 Initialisation DOM
*/


// ============================
// 1. 📦 Importations des modules
// ============================
import { getSpecificFilters } from './filters/hotelSpecificFilters.js';
import { getGlobalFiltersFromForm } from './filters/hotelGlobalFilters.js';
import { cleanFilters } from './filters/hotelCleanFilters.js';
import { fetchHotels, fetchFilteredHotels, fetchAllHotels } from './filters/hotelApi.js';
import { renderHotelsWithReviews } from './filters/hotelRender.js';
import { autoComplete } from './filters/hotelAutoComplete.js';
import { checkLoginOnLoad } from './authentification/sessionManager.js';


// ============================
// 2. 🔧 Variables globales
// ============================
let isGlobalSearchActive = false;
let isFilterProcessing = false;
let fetchAllHotelsTimeout = null;
let isFiltering = false;


// ============================
// 3. 🧩 Icônes pour les équipements
// ============================
const equipmentIcons = {
    "Parking": "🚗",
    "Restaurant": "🍽️",
    "Piscine": "🏊",
    "Animaux admis": "🐾",
    "Salle de sport": "🏋️",
    "Spa": "💆",
    "Wi-Fi gratuit": "📶",
    "Climatisation": "❄️",
    "Borne recharge": "⚡",
    "Accès PMR": "♿",
    "Machine à laver": "🧺",
    "Kitchenette": "🍳"
};


// ============================
// 4. 📅 Initialisation du calendrier
// ============================
flatpickr.localize(flatpickr.l10ns.fr);

if (typeof flatpickr !== "undefined") {
    flatpickr("#date-range, #dateRange", {
        mode: "range",
        dateFormat: "Y-m-d",
        minDate: "today",
        locale: "fr",
    });
} else {
    console.error("Flatpickr n'est pas chargé correctement.");
}


// ============================
// 5. 📡 Soumission du formulaire de recherche
// ============================
document.getElementById("search-form").addEventListener("submit", function (event) {
    event.preventDefault();

    isGlobalSearchActive = true;
    setTimeout(() => { isGlobalSearchActive = false; }, 1000);

    let filters = cleanFilters(getGlobalFiltersFromForm());

    if (!filters.start_date || !filters.end_date) {
        alert("Veuillez sélectionner une période de séjour.");
        isGlobalSearchActive = false;
        return;
    }

    console.log("📌 Recherche globale envoyée :", filters);

    fetch("/recherche", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters)
    })
    .then(response => {
        if (!response.ok) throw new Error(`Erreur: ${response.statusText}`);
        return response.json();
    })
    .then(hotels => {
        console.log("✅ Hôtels trouvés via recherche générale :", hotels);
        renderHotelsWithReviews(hotels);
        isGlobalSearchActive = false;
    })
    .catch(error => {
        console.error("❌ Erreur lors de l'appel à l'API recherche :", error);
        isGlobalSearchActive = false;
    });
});


// ============================
// 6. 🔎 Filtres spécifiques / URL
// ============================
function getURLParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        destination: params.get("destination") || "",
        start_date: params.get("start_date") || "",
        end_date: params.get("end_date") || "",
        adults: params.get("adults") || "1",
        children: params.get("children") || "0",
        pets: params.get("pets") || "0"
    };
}

async function fetchFilteredHotelsFromURL() {
    let filters = cleanFilters(getURLParams());

    if (!filters.start_date || !filters.end_date) {
        console.warn("⚠️ Les dates ne sont pas fournies, chargement de tous les hôtels.");
        fetchAllHotels(renderHotelsWithReviews);
        return;
    }

    console.log("🔍 Recherche avec filtres (depuis URL) :", filters);
    await fetchFilteredHotels(filters, renderHotelsWithReviews);
}

async function applyFilters() {
    console.log("🚀 applyFilters() appelé !");
    if (isFiltering || isFilterProcessing) {
        console.warn("⚠️ Filtrage bloqué : Un filtrage est déjà en cours.");
        return;
    }

    isFilterProcessing = true;
    isFiltering = true;
    isGlobalSearchActive = true;

    if (fetchAllHotelsTimeout) {
        clearTimeout(fetchAllHotelsTimeout);
        fetchAllHotelsTimeout = null;
    }

    let filters = cleanFilters(getSpecificFilters());

    await fetchHotels(filters, renderHotelsWithReviews);

    setTimeout(() => {
        isGlobalSearchActive = false;
        isFiltering = false;
        isFilterProcessing = false;
    }, 5000);

    if (!isFiltering && !isFilterProcessing) {
        isGlobalSearchActive = false;
    }
}


// ============================
// 7. 🧼 Réinitialisation des filtres
// ============================
function resetFilters() {
    isFiltering = false;
    isFilterProcessing = false;
    isGlobalSearchActive = false;

    const filterForm = document.getElementById('filterForm');
    if (filterForm) filterForm.reset();

    const cityInput = document.getElementById('cityInput');
    if (cityInput) cityInput.value = "";

    if (fetchAllHotelsTimeout) {
        clearTimeout(fetchAllHotelsTimeout);
        fetchAllHotelsTimeout = null;
    }

    fetchAllHotels(renderHotelsWithReviews);
}


// ============================
// 8. 🚀 Initialisation DOM
// ============================
document.addEventListener("DOMContentLoaded", () => {
    checkLoginOnLoad();

    const filters = getURLParams();
    if (filters.destination || filters.start_date) {
        fetchFilteredHotelsFromURL();
    } else {
        fetchAllHotels(renderHotelsWithReviews);
    }
    isGlobalSearchActive = false;

    const searchFiltersButton = document.getElementById("search-filters");
    const resetFiltersButton = document.getElementById('reset-filters');

    if (searchFiltersButton) {
        searchFiltersButton.addEventListener("click", (event) => {
            event.preventDefault();
            applyFilters();
        });
    }

    if (resetFiltersButton) {
        resetFiltersButton.addEventListener("click", (event) => {
            event.preventDefault();
            resetFilters();
        });
    }

    const dropdown = document.getElementById("peopleDropdown");
    const inputField = document.getElementById("peopleInput");

    if (inputField && dropdown) {
        inputField.addEventListener("click", function (event) {
            event.stopPropagation();
            dropdown.classList.toggle("show");
        });

        document.addEventListener("click", function (event) {
            if (!dropdown.contains(event.target) && event.target !== inputField) {
                dropdown.classList.remove("show");
            }
        });

        function updatePeopleInput() {
            const adults = document.getElementById("adults").value;
            const children = document.getElementById("children").value;
            const pets = document.getElementById("pets").checked ? " - Animal ✅" : "";
            inputField.value = `${adults} adulte(s) - ${children} enfant(s)${pets}`;
        }

        document.getElementById("adults").addEventListener("change", updatePeopleInput);
        document.getElementById("children").addEventListener("change", updatePeopleInput);
        document.getElementById("pets").addEventListener("change", updatePeopleInput);
    } else {
        console.error("❌ Problème avec le champ peopleInput ou peopleDropdown !");
    }
});

