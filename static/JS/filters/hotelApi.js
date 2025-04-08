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
