// =============================================================
// 📁 hotelAPI.js
// -------------------------------------------------------------
// Ce fichier regroupe toutes les fonctions liées aux appels API
// pour récupérer les données d’hôtels depuis le serveur,
// avec ou sans filtres.
//
// 🎯 Objectif :
// Centraliser les interactions front → back concernant les
// données hôtelières, et offrir une interface claire pour
// différents cas de chargement :
// - tous les hôtels,
// - hôtels filtrés (recherche avancée),
// - recherche globale (lieu, dates, voyageurs).
//
// 🔧 Fonctionnalités :
// 1. `fetchAllHotelsAPI()`
//    → Requête GET vers `/hotels` pour récupérer tous les hôtels.
// 2. `fetchHotelsAPI(filters)`
//    → Requête POST vers `/filter_hotels` avec des filtres spécifiques.
// 3. `fetchFilteredHotelsAPI(filters)`
//    → Requête POST vers `/recherche` avec des filtres globaux (ville, dates, voyageurs).
//
// 🔁 Fonctions de haut niveau avec callbacks (wrapper) :
// 4. `fetchAllHotels(renderCallback, isFiltering, isGlobalSearchActive)`
//    → Empêche l'appel si un filtre est actif, sinon récupère tous les hôtels.
// 5. `fetchHotels(filters, renderCallback)`
//    → Utilise les filtres spécifiques et appelle le callback d'affichage.
// 6. `fetchFilteredHotels(filters, renderCallback)`
//    → Utilise les filtres globaux et appelle le callback d'affichage.
//
// ✅ Ces fonctions permettent une séparation claire entre la logique
// réseau (API) et la logique d’affichage (rendu dynamique).
//
// 🧩 Utilisé dans :
// - `hotel.js`, `mapLoader.js`, `hotelGlobalFilters.js`, etc.
//
// ⚠️ Les callbacks doivent gérer l’affichage des hôtels côté interface.
// =============================================================


// 📡 API : Récupère tous les hôtels
export async function fetchAllHotelsAPI() {
    const response = await fetch('/hotels');
    if (!response.ok) throw new Error(`Erreur: ${response.statusText}`);
    return response.json();
}

// 📡 API : Récupère les hôtels selon filtres spécifiques
export async function fetchHotelsAPI(filters = {}) {
    const response = await fetch('/filter_hotels', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters)
    });
    if (!response.ok) throw new Error(`Erreur: ${response.statusText}`);
    return response.json();
}

// 📡 API : Recherche globale d'hôtels (ville, dates, voyageurs...)
export async function fetchFilteredHotelsAPI(filters = {}) {
    const response = await fetch('/recherche', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters)
    });
    if (!response.ok) throw new Error(`Erreur: ${response.statusText}`);
    return response.json();
}

// 🔁 Wrapper pour afficher les résultats dans le rendu
export async function fetchAllHotels(renderCallback, isFiltering = false, isGlobalSearchActive = false) {
    if (isFiltering || isGlobalSearchActive) {
        console.warn("⚠️ fetchAllHotels() bloqué car filtrage en cours !");
        return;
    }
    const hotels = await fetchAllHotelsAPI();
    renderCallback(hotels);
}

export async function fetchHotels(filters, renderCallback) {
    const hotels = await fetchHotelsAPI(filters);
    renderCallback(hotels);
}

export async function fetchFilteredHotels(filters, renderCallback) {
    const hotels = await fetchFilteredHotelsAPI(filters);
    renderCallback(hotels);
}
