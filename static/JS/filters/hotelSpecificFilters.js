// =============================================================
// 📁 hotelSpecificFilters.js
// -------------------------------------------------------------
// Ce module extrait tous les filtres spécifiques activés dans
// la barre latérale de la page `hotel.html`, afin de constituer
// un objet `filters` prêt à envoyer à l’API pour filtrer les hôtels.
//
// 🎯 Objectif :
// Récupérer les valeurs des champs de filtre visibles côté utilisateur,
// comme les étoiles, le prix maximum, les équipements, la ville, etc.
//
// 🔧 Fonction principale :
// - `getSpecificFilters()`
//   → Lit les champs de formulaire de la sidebar (checkboxes, input, select)
//   → Regroupe toutes les valeurs pertinentes dans un objet `filters`
//   → Gère plusieurs types de filtres :
//     • étoiles (ex. : [3, 4, 5])
//     • prix maximum, nombre de chambres
//     • nom de l’hôtel, nom de la ville
//     • équipements (ex. : `parking`, `spa`, `pets_allowed`, etc.)
//     • note utilisateur (note moyenne sélectionnée)
//     • types de pension (repas)
//
// 📦 Format final retourné :
// ```js
// {
//   stars: [3, 4],
//   max_price: 200,
//   max_rooms: 30,
//   hotel_name: "Etoile Palace",
//   city_name: "Nice",
//   parking: 1,
//   free_wifi: 1,
//   hotel_rating: [8.5, 9],
//   meal_plan: ["breakfast", "full-board"]
// }
// ```
//
// 🧩 Utilisé dans :
// - `hotel.js` pour envoyer les filtres au back-end via `/filter_hotels`
// - Couplé avec `cleanFilters()` pour ignorer les filtres vides
//
// ✅ Ce module est essentiel pour adapter dynamiquement les résultats
// de recherche à la sélection précise de l’utilisateur.
// =============================================================


export function getSpecificFilters() {
    const filters = {
        stars: [...document.querySelectorAll('input[name="stars"]:checked')].map(i => parseInt(i.value, 10)),
        max_price: parseInt(document.getElementById('maxPrice')?.value || "500", 10),
        max_rooms: parseInt(document.getElementById('maxRooms')?.value || "70", 10),
        hotel_name: document.getElementById('hotelName')?.value.trim() || null,
        city_name: document.getElementById('cityInput')?.value.trim() || null
    };

    const equipements = [
        "parking", "restaurant", "piscine", "pets_allowed",
        "washing_machine", "wheelchair_accessible", "gym", "spa",
        "free_wifi", "air_conditioning", "ev_charging", "kitchenette"
    ];
    equipements.forEach(equip => {
        filters[equip] = document.getElementById(equip)?.checked ? 1 : null;
    });

    const ratingCheckboxes = document.querySelectorAll('input[name="hotel_rating"]:checked');
    const hotelRatings = Array.from(ratingCheckboxes).map(input => parseFloat(input.value));
    if (hotelRatings.length > 0) {
        filters.hotel_rating = hotelRatings;
    }

    filters.meal_plan = Array.from(document.querySelectorAll('input[name="meal_plan"]:checked')).map(input => input.value);

    return filters;
}

