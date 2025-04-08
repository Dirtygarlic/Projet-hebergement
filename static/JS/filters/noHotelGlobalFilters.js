console.log("🧠 Script indexFiltreHotel.js bien chargé !");

// ============================
// 📦 Importations des modules
// ============================
import { autoComplete } from './hotelAutoComplete.js';
import { renderHotelsWithReviews } from './hotelRender.js';
import { fetchFilteredHotels } from './hotelApi.js';
import { getGlobalFiltersFromForm } from './hotelGlobalFilters.js';


// ============================
// 📅 Initialisation de Flatpickr
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
// 🌍 Récupérer les paramètres GET de l'URL
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


// ============================
// 🚀 Initialisation globale
// ============================
document.addEventListener("DOMContentLoaded", function () {
    const path = window.location.pathname;
    const allowedPages = ["/", "/index", "/reservations", "/paiement", "index.html", "reservations.html", "paiement.html"];

    const isAllowedPage = allowedPages.some(page => path.endsWith(page) || path === page);

    if (!isAllowedPage) {
        console.log("❌ Pas sur une page autorisée, on stoppe noHotelGlobalFilters.js");
        return;
    }

    console.log("🧠 Script noHotelGlobalFilters.js bien chargé !");
    console.log("🚀 DOM chargé, gestion de la recherche globale...");

    // ✏️ Autocomplétion sur le champ "city"
    const cityInput = document.getElementById("city");
    if (cityInput) {
        cityInput.addEventListener("keyup", (e) => {
            autoComplete(e.target.value, "city", "suggestions-global");
        });
        cityInput.value = new URLSearchParams(window.location.search).get("destination") || "";
    }

    const params = new URLSearchParams(window.location.search);

    const dateRangeInput = document.getElementById("date-range");
    if (dateRangeInput) {
        const startDate = params.get("start_date");
        const endDate = params.get("end_date");
        dateRangeInput.value = (startDate && endDate) ? `${startDate} au ${endDate}` : "";
    }

    const adultsInput = document.getElementById("adults");
    if (adultsInput) adultsInput.value = params.get("adults") || "1";

    const childrenInput = document.getElementById("children");
    if (childrenInput) childrenInput.value = params.get("children") || "0";

    const petsCheckbox = document.getElementById("pets");
    if (petsCheckbox) petsCheckbox.checked = params.get("pets") === "1";

    const searchForm = document.getElementById("search-form");
    if (searchForm) {
        searchForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const filters = getGlobalFiltersFromForm();

            if (!filters.start_date || !filters.end_date) {
                alert("Veuillez sélectionner une période de séjour.");
                return;
            }

            console.log("📌 Redirection vers `hotel.html` avec :", filters);
            const params = new URLSearchParams(filters).toString();
            window.location.href = `/hotel?${params}`;
        });
    } else {
        console.log("✅ Vérification si nous sommes sur `hotel.html`...");
        if (window.location.pathname.includes("hotel")) {
            const filters = getURLParams();
            console.log("🔍 Filtres récupérés depuis l’URL :", filters);
            fetchFilteredHotels(filters, renderHotelsWithReviews);
        }
    }

    // 👥 Dropdown voyageurs
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

