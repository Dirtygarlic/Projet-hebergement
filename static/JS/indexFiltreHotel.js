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

// 🚀 Ajout de l'événement pour la recherche globale
document.addEventListener("DOMContentLoaded", function () {
    console.log("🚀 DOM chargé, gestion de la recherche globale...");

    // ✅ Récupération des paramètres URL pour préremplir les champs
    const params = new URLSearchParams(window.location.search);

    const cityInput = document.getElementById("city");
    if (cityInput) cityInput.value = params.get("destination") || "";

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

    console.log("✅ Champs préremplis avec les valeurs de l'URL.");

    const searchForm = document.getElementById("search-form");

    if (searchForm) {
        searchForm.addEventListener("submit", function (event) {
            event.preventDefault(); // 🔥 Empêche la soumission classique

            // 🔍 Récupère les valeurs du formulaire
            const dateRange = document.getElementById("date-range").value.trim().split(" au ");
            const filters = {
                destination: document.getElementById("city").value.trim(),
                start_date: dateRange.length === 2 ? dateRange[0] : "",
                end_date: dateRange.length === 2 ? dateRange[1] : "",
                adults: document.getElementById("adults").value,
                children: document.getElementById("children").value,
                pets: document.getElementById("pets").checked ? "1" : "0"
            };

            // 🔄 Vérification des dates
            if (!filters.start_date || !filters.end_date) {
                alert("Veuillez sélectionner une période de séjour.");
                return;
            }

            console.log("📌 Redirection vers `hotel.html` avec :", filters);

            // 🚀 Transformation des paramètres en URL et redirection vers `hotel.html`
            const params = new URLSearchParams(filters).toString();
            window.location.href = `/hotel?${params}`;
        });
    } else {
        console.log("✅ Vérification si nous sommes sur `hotel.html`...");
        // 🔥 Si nous sommes sur `hotel.html`, appliquer les filtres
        if (window.location.pathname.includes("hotel")) {
            fetchFilteredHotels();
        }
    }

    // ✅ Gestion de l'affichage du dropdown "nb adultes / nb enfants"
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
