console.log("📦 Module hotelAutoComplete.js chargé !");

export function autoComplete(query, targetInputId, suggestionListId) {
    const suggestionList = document.getElementById(suggestionListId);
    if (!suggestionList) {
        console.warn(`❗️ Élément introuvable : #${suggestionListId}`);
        return;
    }

    suggestionList.innerHTML = "";

    if (query.length < 3) {
        return;
    }

    fetch(`/autocomplete?query=${query}`)
        .then(response => response.json())
        .then(data => {
            let suggestionsList = document.getElementById(suggestionListId);
            suggestionsList.innerHTML = "";

            // 🔎 Filtrage spécifique pour n'afficher que les villes dans les filtres latéraux
            if (targetInputId === "cityInput") {
                data = data.filter(item => isLikelyACity(item));
            }

            data.forEach(item => {
                let listItem = document.createElement("li");
                listItem.textContent = item;
                listItem.onclick = function () {
                    document.getElementById(targetInputId).value = item;
                    suggestionsList.innerHTML = "";
                };
                suggestionsList.appendChild(listItem);
            });
        })
        .catch(error => console.error("Erreur d'autocomplétion :", error));
}

function isLikelyACity(item) {
    const excludedLocations = [
        // Afrique
        "Nigéria", "Égypte", "Afrique du Sud", "Kenya", "Algérie",
        // Asie
        "Chine", "Inde", "Indonésie", "Pakistan", "Bangladesh",
        // Amérique du Nord
        "États-Unis", "Canada", "Mexique", "Cuba", "Guatemala",
        // Amérique du Sud
        "Brésil", "Argentine", "Colombie", "Chili", "Pérou",
        // Europe
        "France", "Allemagne", "Royaume-Uni", "Italie", "Espagne",
        // Océanie
        "Australie", "Nouvelle-Zélande", "Papouasie-Nouvelle-Guinée", "Fidji", "Samoa",
        // Continents (noms génériques)
        "Afrique", "Asie", "Europe", "Amérique", "Océanie", "North America", "South America"
    ];
    return !excludedLocations.includes(item);
}

document.addEventListener("DOMContentLoaded", () => {
    const mainCityInput = document.getElementById("city");         // recherche globale
    const filterCityInput = document.getElementById("cityInput");  // filtre latéral

    if (mainCityInput) {
        mainCityInput.addEventListener("keyup", (e) => {
            autoComplete(e.target.value, "city", "suggestions-global");
        });
    }

    if (filterCityInput) {
        filterCityInput.addEventListener("keyup", (e) => {
            autoComplete(e.target.value, "cityInput", "suggestions-filter");
        });
    }
});
