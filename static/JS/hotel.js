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
import { renderHotelsWithReviews, resetHotelCache, clearHotelFilterMode, getIsFilterMode, getHotelCache, renderAllFilteredHotels } from './filters/hotelRender.js';
import { autoComplete } from './filters/hotelAutoComplete.js';
import { checkLoginOnLoad } from './authentification/sessionManager.js';


// ============================s
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
    .then(async hotels => {
        renderAllFilteredHotels(hotels);  // ⬅️ Important pour tout afficher d’un coup
        try {
            const response = await fetch("/api/hotels/count");
            const total = (await response.json()).total;
            updateDisplayedHotelCount(hotels.length, total, true);
        } catch (e) {
        }
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
    await fetchFilteredHotels(filters, async (hotels) => {
        renderAllFilteredHotels(hotels);
    
        try {
            const response = await fetch("/api/hotels/count");
            const total = (await response.json()).total;
            updateDisplayedHotelCount(hotels.length, total, true);
        } catch (e) {
            console.error("❌ Erreur récupération total dans fetchFilteredHotelsFromURL :", e);
            updateHotelCountDisplay(hotels.length);
        }
    });   
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

    await fetchHotels(filters, async (hotels) => {
        renderAllFilteredHotels(hotels);
        try {
            const response = await fetch("/api/hotels/count");
            const total = (await response.json()).total;
            updateDisplayedHotelCount(hotels.length, total, true);
        } catch (e) {
            console.error("❌ Erreur récupération total après filtres :", e);
            updateHotelCountDisplay(hotels.length);
        }
    });

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
    offset = 0;

    clearHotelFilterMode(); // ⬅️ remet le mode normal (chargement via API)

    const filterForm = document.getElementById('filterForm');
    if (filterForm) filterForm.reset();

    const cityInput = document.getElementById('cityInput');
    if (cityInput) cityInput.value = "";

    if (fetchAllHotelsTimeout) {
        clearTimeout(fetchAllHotelsTimeout);
        fetchAllHotelsTimeout = null;
    }

    const container = document.getElementById("hotels-list");
    if (container) container.innerHTML = "";

    const countDisplay = document.getElementById("hotel-count");
    if (countDisplay) countDisplay.textContent = "";

    loadMoreHotels(); // ✅ recharge à partir de offset=0 avec limit=10

    fetch("/api/hotels/count")
        .then(res => res.json())
        .then(data => updateDisplayedHotelCount(10, data.total)) // ← on affiche 10/106
        .catch(err => console.error("❌ Erreur mise à jour compteur après reset :", err));
}

function updateHotelCountDisplay(count) {
    const countDisplay = document.getElementById("hotel-count");
    if (countDisplay) {
        countDisplay.textContent = `${count} hôtels trouvés`;
    }
}

function updateDisplayedHotelCount(displayed, total, isFilter = false) {
    const countDisplay = document.getElementById("hotel-count");
    if (countDisplay) {
        countDisplay.innerHTML = isFilter
            ? `<strong style="color: green;">Résultat : ${displayed} hôtel(s) trouvés sur ${total}</strong>`
            : `Affichage : ${displayed} hôtels sur ${total}`;
    }
}


// ============================
// 8. 🚀 Initialisation DOM
// ============================
let offset = 0;
const limit = 10;
let isLoading = false;

async function loadMoreHotels() {
    if (isLoading) return;
    isLoading = true;

    if (getIsFilterMode()) {
        renderHotelsWithReviews(getHotelCache(), true); 
        isLoading = false;
        return;
    }

    try {
        const response = await fetch(`/api/hotels?offset=${offset}&limit=${limit}`);
        const hotels = await response.json();

        if (hotels.length > 0) {
            renderHotelsWithReviews(hotels, false);
            document.getElementById("load-more-btn").style.display = "block";
            offset += hotels.length;

            // Appel pour récupérer le nombre total d’hôtels
            const countResponse = await fetch("/api/hotels/count");
            const countData = await countResponse.json();
            const total = countData.total;

            updateDisplayedHotelCount(offset, total);
        } else {
            document.getElementById("load-more-btn").style.display = "none";
        }
    } catch (error) {
        console.error("❌ Erreur lors du chargement paginé :", error);
    } finally {
        isLoading = false;
    }
}


document.addEventListener("DOMContentLoaded", () => {
    checkLoginOnLoad();

    function displayTotalHotelCount() {
        fetch("/api/hotels/count")
            .then(res => res.json())
            .then(data => {
                const countDisplay = document.getElementById("hotel-count");
                if (countDisplay) {
                    countDisplay.textContent = `${data.total} hôtels trouvés`;
                }
            })
            .catch(err => console.error("❌ Erreur comptage total hôtels :", err));
    }

    const filters = getURLParams();
    if (filters.destination || filters.start_date) {
        fetchFilteredHotelsFromURL();
    } else {
        displayTotalHotelCount();
        loadMoreHotels(); // ✅ Appel unique pour lazy loading
    }

    document.getElementById("load-more-btn").addEventListener("click", loadMoreHotels);

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

