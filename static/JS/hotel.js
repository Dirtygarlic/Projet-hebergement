let isGlobalSearchActive = false;

// Creation d un dictionnaire d icones pour les equipements
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

// 🔄 Initialisation de Flatpickr pour la sélection des dates
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

// 🔹 Variable pour éviter de recharger les hôtels après un filtrage
let isFiltering = false;

// 🎨 Fonction pour afficher les hôtels dans la page
function renderHotels(hotels) {
    const container = document.getElementById("hotels-list"); // L'élément qui contient les résultats
    container.innerHTML = '';

    // ✅ Gestion du compteur d'hôtels
    const countElement = document.getElementById("hotel-count"); // Assure-toi que cet élément existe
    if (countElement) {
        countElement.innerHTML = hotels.length > 0
            ? `<strong style="color: green;">Nombre d'hôtels trouvés : ${hotels.length}</strong>`
            : `<strong style="color: red;">Aucun hôtel trouvé</strong>`;
    }

    if (hotels.length === 0) {
        container.innerHTML = `
            <div class="alert text-center d-flex flex-column align-items-center justify-content-center" role="alert" 
                 style="color: red; font-weight: bold; min-height: 300px; display: flex; flex-direction: column; text-align: center;">
                <img src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExb3JmdTVrem5seG9iZTR3bnIzNDE1NjVnM2dzdnBlOWRlcXZnM3NibSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/UC0bLicVsCTnhtGaBq/giphy.gif" 
                     alt="Désolé" 
                     style="width: 500px; height: auto; margin-bottom: 10px;">
                <br>OUPS ! Veuillez modifier votre recherche.
            </div>`;
        return;
    }       

    hotels.forEach(hotel => {
        const hotelDiv = document.createElement('div');
        hotelDiv.className = 'hotel col-lg-12 d-flex align-items-center border p-3 mb-3';

         // 🔍 Ajout du log pour vérifier les valeurs avant redirection
        console.log("🔍 Hôtel sélectionné avant redirection :", {
            name: hotel.name,
            address: hotel.address,
            description: hotel.description
        });

        const reservationLink = `/reservations?name=${encodeURIComponent(hotel.name)}`
        + `&stars=${hotel.stars}`
        + `&rating=${encodeURIComponent(hotel.hotel_rating || "N/A")}`
        + `&equipments=${encodeURIComponent(hotel.equipments?.join(", ") || "Aucun équipement")}`
        + `&price=${hotel.price_per_night}`
        + `&image=${encodeURIComponent(hotel.image || "/static/Image/default.jpg")}`
        + `&address=${encodeURIComponent(hotel.address && hotel.address !== "null" ? hotel.address : "Adresse inconnue")}`
        + `&description=${encodeURIComponent(hotel.description && hotel.description !== "null" ? hotel.description : "Aucune description disponible")}`
        + `&lat=${hotel.latitude || ""}`  // 🔹 Ajout des coordonnées latitude
        + `&lng=${hotel.longitude || ""}`; // 🔹 Ajout des coordonnées longitude

        hotelDiv.innerHTML = `
            <div class="hotel-info">
                <h2>${hotel.name} <span>${'⭐'.repeat(hotel.stars)}</span></h2>
                <p><strong>Lieu :</strong> ${hotel.city}, ${hotel.country || ""}</p>
                <p><strong>Prix :</strong> <span style="color: #e74c3c; font-weight: bold;">${hotel.price_per_night} € / nuit</span></p>
                <p><strong>Note :</strong> <span style="color: #27ae60; font-weight: bold;">${hotel.hotel_rating || "N/A"}</span></p>
                <p><strong>Équipements :</strong> ${hotel.equipments?.join(", ") || "Aucun équipement"}</p>
            </div>
            <div class="hotel-img-container">
                <img src="${hotel.image || "/static/Image/default.jpg"}" 
                class="img-fluid rounded mb-2" 
                style="max-height: 200px; width: 100%; object-fit: cover;">
            </div>
            <div class="hotel-action">
                <a href="${reservationLink}" class="reserve-button" onclick="redirectToReservation(${hotel.id})">Réserver</a>
            </div>
        `;
        container.appendChild(hotelDiv);
    });
}

// 📡 Récupération de tous les hôtels au chargement de la page
async function fetchAllHotels() {
    if (isFiltering) return;

    console.log("🔄 Chargement de tous les hôtels...");

    try {
        const response = await fetch('/hotels');
        if (!response.ok) throw new Error(`Erreur: ${response.statusText}`);

        const hotels = await response.json();
        console.log("✅ Hôtels chargés :", hotels);
        renderHotels(hotels);
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des hôtels :', error);
    }
}

// 📡 Récupération des hôtels filtrés
async function fetchHotels(filters = {}) {
    console.log("🔍 Appel API avec filtres :", filters);
    try {
        console.log("📡 Envoi de la requête à filter_hotels...");
        const response = await fetch('/filter_hotels', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(filters)
        });

        if (!response.ok) throw new Error(`Erreur: ${response.statusText}`);

        const hotels = await response.json();
        console.log("✅ Réponse complète des hôtels après filtrage :", hotels);
        renderHotels(hotels);
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des hôtels :', error);
        isFiltering = false;  // ✅ Permet de refaire une requête après une erreur
        isGlobalSearchActive = false;  // ✅ Assurer que la recherche globale ne bloque pas le filtrage
    }
}

document.getElementById("search-form").addEventListener("submit", function (event) {
    event.preventDefault(); // 🔥 Empêche la soumission classique

    isGlobalSearchActive = true; // 🚀 Active l'état de recherche globale

    // 🔍 Récupère les valeurs du formulaire
    const dateRange = document.getElementById("date-range").value.trim().split(" au ");
    const filters = {
        destination: document.getElementById("city").value.trim(),
        start_date: dateRange.length === 2 ? dateRange[0] : null,
        end_date: dateRange.length === 2 ? dateRange[1] : null,
        adults: parseInt(document.getElementById("adults").value, 10),
        children: parseInt(document.getElementById("children").value, 10),
        pets: document.getElementById("pets").checked ? 1 : 0
    };

    if (!filters.start_date || !filters.end_date) {
        alert("Veuillez sélectionner une période de séjour.");
        isGlobalSearchActive = false; // ❌ Désactive la recherche globale si annulation
        return; 
    }

    console.log("📌 Recherche globale envoyée :", filters);

    fetch("/recherche", {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // ✅ JSON obligatoire
        body: JSON.stringify(filters)
    })
    .then(response => {
        if (!response.ok) throw new Error(`Erreur: ${response.statusText}`);
        return response.json();
    })
    .then(hotels => {
        console.log("✅ Hôtels trouvés via recherche générale :", hotels);
        renderHotels(hotels);
        isGlobalSearchActive = false; // ✅ Désactive la recherche globale après succès
    })
    .catch(error => {
        console.error("❌ Erreur lors de l'appel à l'API recherche :", error);
        isGlobalSearchActive = false; // ❌ Désactive en cas d’erreur
    });
});

// 🏨 Application des filtres pour la recherche d'hôtels
function applyFilters() {
        console.log("🚀 applyFilters() appelé !");
    // if (document.activeElement.form && document.activeElement.form.id === "search-form") {
        if (isGlobalSearchActive) {
            console.warn("⚠️ Filtrage bloqué : Une recherche globale est en cours.");
            return;
        }        

    isFiltering = true;

    const filters = {
        stars: [...document.querySelectorAll('input[name="stars"]:checked')].map(i => parseInt(i.value, 10)),
        max_price: parseInt(document.getElementById('maxPrice')?.value || "500", 10),
        max_rooms: parseInt(document.getElementById('maxRooms')?.value || "70", 10),
        hotel_name: document.getElementById('hotelName')?.value.trim() || null,
        city_name: document.getElementById('cityInput')?.value.trim() || null
    };

    // ✅ Regroupement des équipements sous un seul objet
    const equipements = ["parking", "restaurant", "piscine", "pets_allowed", "washing_machine", "wheelchair_accessible", "gym", "spa", "free_wifi", "air_conditioning", "ev_charging", "kitchenette"];
    equipements.forEach(equip => {
        filters[equip] = document.getElementById(equip)?.checked ? 1 : null;
    });

    // ✅ Gestion filtre note des clients
    const ratingCheckboxes = document.querySelectorAll('input[name="hotel_rating"]:checked');
    const hotelRatings = Array.from(ratingCheckboxes).map(input => parseFloat(input.value));
    if (hotelRatings.length > 0) {
        filters.hotel_rating = hotelRatings;
    }

    // ✅ Gestion filtre restauration
    filters.meal_plan = Array.from(document.querySelectorAll('input[name="meal_plan"]:checked')).map(input => input.value);

    // ✅ Nettoyage des filtres vides
    Object.keys(filters).forEach(key => {
        if (filters[key] === null || (Array.isArray(filters[key]) && filters[key].length === 0) || filters[key] === '') {
            delete filters[key];
        }
    });

    console.log("📌 Filtres envoyés après nettoyage :", filters);
    fetchHotels(filters).then(() => {
        isFiltering = false;
    });
}

// ♻️ Réinitialisation des filtres
function resetFilters() {
    console.log("♻️ Réinitialisation des filtres...");
    
    isGlobalSearchActive = false; // ✅ Réactive les filtres spécifiques
    document.getElementById('filterForm').reset();
    const cityInput = document.getElementById('cityInput');
    if (cityInput) cityInput.value = ""; 

    if (!isFiltering) {
        fetchAllHotels();
    }
}

// ✈️ Gère l'autocomplétion pour la destination (continent, pays, ville)
function autoComplete(query) {
    if (query.length < 3) {
        document.getElementById("suggestions").innerHTML = "";
        return;
    }

    fetch(`/autocomplete?query=${query}`)
        .then(response => response.json())
        .then(data => {
            let suggestionsList = document.getElementById("suggestions");
            suggestionsList.innerHTML = "";

            data.forEach(item => {
                let listItem = document.createElement("li");
                listItem.textContent = item;
                listItem.onclick = function () {
                    document.getElementById("city").value = item;
                    suggestionsList.innerHTML = "";
                };
                suggestionsList.appendChild(listItem);
            });
        })
        .catch(error => console.error("Erreur d'autocomplétion :", error));
}

// 📌 Récupérer les paramètres GET de l'URL
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

// 📡 Appliquer les filtres reçus depuis `index.html` dans `hotel.html`
async function fetchFilteredHotels() {
    const filters = getURLParams(); // Récupération des filtres

    // 🚨 Vérification que les dates sont bien présentes
    if (!filters.start_date || !filters.end_date) {
        console.warn("⚠️ Les dates ne sont pas fournies, chargement de tous les hôtels.");
        fetchAllHotels(); // Charger tous les hôtels si pas de filtre
        return;
    }

    console.log("🔍 Recherche avec filtres :", filters);

    try {
        const response = await fetch("/recherche", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(filters)
        });

        if (!response.ok) throw new Error(`Erreur: ${response.statusText}`);

        const hotels = await response.json();
        console.log("✅ Hôtels trouvés :", hotels);
        renderHotels(hotels);
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des hôtels :", error);
    }
}

// ✅ Gestion des événements au chargement
document.addEventListener("DOMContentLoaded", function () {
    console.log("🚀 Page chargée, récupération des hôtels...");

    const filters = getURLParams(); // Récupère les filtres envoyés depuis index.html
    if (filters.destination || filters.start_date) {
        console.log("🎯 Filtres détectés, lancement de la recherche filtrée...");
        fetchFilteredHotels(); // 🔍 Applique les filtres si présents
    } else {
        console.log("📌 Aucun filtre détecté, chargement de tous les hôtels.");
        fetchAllHotels(); // 🏨 Charge tous les hôtels par défaut
    }

    // ✅ Vérifie que le formulaire de filtrage existe avant d'ajouter l'événement
    const filterForm = document.getElementById('filterForm');
    if (filterForm) {
        console.log("✅ Formulaire de filtrage trouvé !");
        filterForm.addEventListener('submit', (event) => {
            event.preventDefault();
            applyFilters();
        });
    } else {
        console.error("⚠️ Le formulaire de filtrage 'filterForm' n'a pas été trouvé !");
    }

    document.getElementById('reset-filters').addEventListener('click', resetFilters);

    // ✅ Gestion du dropdown "nb adultes / nb enfants"
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

function redirectToReservation(hotelId) {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set("hotel_id", hotelId); // Ajoute l'ID de l'hôtel aux paramètres

    // 🔄 Redirige vers la page de réservation avec les paramètres
    window.location.href = reservationLink;
}
