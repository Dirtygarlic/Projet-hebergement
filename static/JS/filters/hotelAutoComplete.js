// =============================================================
// 📁 hotelAutoComplete.js
// -------------------------------------------------------------
// Ce fichier gère la fonctionnalité d'autocomplétion pour les
// champs de recherche de villes, à la fois sur la page d'accueil
// (`#city`) et dans les filtres latéraux (`#cityInput`).
//
// 🎯 Objectif :
// Améliorer l’expérience utilisateur en suggérant automatiquement
// des villes dès que l’utilisateur tape au moins 3 lettres,
// en récupérant les suggestions depuis une API (`/autocomplete`).
//
// 🔧 Fonctionnalités :
// - `autoComplete(query, targetInputId, suggestionListId)`
//   → Envoie une requête vers `/autocomplete?query=...`
//   → Affiche les suggestions dans une liste (`<ul>` ou autre).
//   → Remplit automatiquement le champ ciblé au clic sur une suggestion.
//   → Pour les filtres (`#cityInput`), exclut certains pays/continents
//     grâce à `isLikelyACity()` afin de ne garder que des villes.
//
// - `isLikelyACity(item)` :
//   → Évite d'afficher des suggestions génériques comme "Europe",
//     "France", "Canada", etc., lorsqu’on veut uniquement des villes.
//
// - Initialisation automatique au chargement de la page :
//   → Ajoute les écouteurs `keyup` sur les champs `#city` et `#cityInput`
//   → Lance l’autocomplétion quand l'utilisateur tape dans les champs.
//
// 🧩 Utilisé sur :
// - `index.html` (recherche globale avec `#city`)
// - `hotel.html` (filtres spécifiques avec `#cityInput`)
//
// ✅ Rend la recherche de destination plus rapide, intuitive et dynamique.
//
// ⚠️ Les suggestions sont effacées si la saisie est inférieure à 3 caractères.
// =============================================================


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
