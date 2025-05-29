// =============================================================
// 📁 hotelRender.js
// -------------------------------------------------------------
// Ce module gère l’affichage dynamique des résultats hôteliers
// sur la page `hotel.html`, après une recherche ou un filtrage.
//
// 🎯 Objectif :
// Afficher une liste d’hôtels sous forme de cartes informatives,
// avec gestion des doublons, rendu visuel propre, et construction
// du lien vers la page de réservation (`reservations.html`).
//
// 🔧 Fonction principale :
// - `renderHotelsWithReviews(hotels)` :
//   → Supprime les doublons déjà présents (même ID),
//   → Affiche le nombre d’hôtels trouvés,
//   → Si aucun résultat : montre une alerte visuelle avec un gif,
//   → Pour chaque hôtel :
//       • Crée dynamiquement une carte HTML avec les infos :
//         nom, étoiles, prix, équipements, image, note, etc.
//       • Génère un lien vers `reservations.html` avec toutes
//         les infos encodées dans l’URL (hors avis).
//
// 🧩 Dépendance :
// - `fetchHotelReviews()` (non utilisé ici)
//
// ✅ Avantages :
// - Séparation claire entre le rendu et la récupération des données,
// - Plus sécurisé : ne passe plus les avis en URL,
// - Compatible avec tous les filtres (spécifiques ou globaux).
//
// 📦 Utilisé dans :
// - `hotel.js`, après un appel API pour afficher les résultats.
//
// ⚠️ Pour ajouter les avis à l’affichage, penser à les charger
// dynamiquement dans `reservations.html`, pas depuis ce fichier.
// =============================================================

let hotelCache = [];
let hotelRenderIndex = 0;
const HOTELS_PER_PAGE = 10;
let isFilterMode = false; // ← mode filtrage actif

export function resetHotelCache(hotels) {
    isFilterMode = true;
    hotelCache = hotels;
    hotelRenderIndex = 0;

    const container = document.getElementById("hotels-list");
    if (container) container.innerHTML = '';

    renderHotelsWithReviews(hotels, true);
}

export function renderHotelsWithReviews(hotels, isFiltered = false) {
    console.log("✅ Hôtels reçus :", hotels);

    const container = document.getElementById("hotels-list");

    if (isFiltered) {
        hotelCache = hotels;
        hotelRenderIndex = 0;
        isFilterMode = true;
        container.innerHTML = '';
    } else {
        if (hotelCache.length === 0) {
            hotelCache = hotels; // ⚠️ première fois : on initialise
        } else {
            hotelCache = hotelCache.concat(hotels); // les suivants : on concatène
        }
    }

    const hotelsToRender = hotelCache.slice(hotelRenderIndex, hotelRenderIndex + HOTELS_PER_PAGE);
    hotelRenderIndex += HOTELS_PER_PAGE;

    // ✅ Mise à jour du compteur
    const countElement = document.getElementById("hotel-count");
    if (countElement) {
        countElement.innerHTML =
            hotelCache.length > 0
                ? `<strong style="color: green;">Nombre d'hôtels trouvés : ${hotelCache.length}</strong>`
                : `<strong style="color: red;">Aucun hôtel trouvé</strong>`;
    }

    if (hotelsToRender.length === 0 && container.children.length === 0) {
        container.innerHTML = `
            <div class="alert text-center" style="color: red; font-weight: bold; min-height: 300px;">
                <img src="https://media3.giphy.com/media/v1.Y2lk.../giphy.gif" 
                     alt="Désolé" style="width: 500px; height: auto; margin-bottom: 10px;">
                <br>OUPS ! Veuillez modifier votre recherche.
            </div>`;
        return;
    }

    for (const hotel of hotelsToRender) {
        if (document.querySelector(`[data-hotel-id="${hotel.id}"]`)) continue; // ← évite doublon visuel

        const hotelDiv = document.createElement('div');
        hotelDiv.className = 'hotel col-lg-12 d-flex align-items-center border p-3 mb-3';
        hotelDiv.dataset.hotelId = hotel.id;

        const reservationLink = `/reservations?hotel_id=${hotel.id}`
            + `&name=${encodeURIComponent(hotel.name)}`
            + `&stars=${hotel.stars}`
            + `&rating=${encodeURIComponent(hotel.hotel_rating || "N/A")}`
            + `&equipments=${encodeURIComponent(hotel.equipments?.join(", ") || "Aucun équipement")}`
            + `&price=${hotel.price_per_night}`
            + `&image=${encodeURIComponent(hotel.image || "/static/Image/default.jpg")}`
            + `&address=${encodeURIComponent(hotel.address && hotel.address !== "null" && hotel.address.trim() !== "" ? hotel.address : `${hotel.city || "Ville inconnue"}, ${hotel.country || "France"}`)}`
            + `&description=${encodeURIComponent(hotel.description && hotel.description !== "null" ? hotel.description : "Aucune description disponible")}`
            + `&lat=${hotel.latitude || ""}`
            + `&lng=${hotel.longitude || ""}`;

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
                <a href="${reservationLink}" class="reserve-button">Réserver</a>
            </div>
        `;
        container.appendChild(hotelDiv);
    }

    // Gère l'affichage du bouton "charger plus"
    const btn = document.getElementById("load-more-btn");
    if (btn) {
        if (isFilterMode) {
            btn.style.display = "none"; // ← toujours masqué en mode filtre
        } else {
            btn.style.display = hotelRenderIndex >= hotelCache.length ? "none" : "block";
        }
    }
}

// Pour le cas où l’utilisateur réinitialise les filtres
export function clearHotelFilterMode() {
    isFilterMode = false;
    hotelCache = [];
    hotelRenderIndex = 0;
}

export function getIsFilterMode() {
    return isFilterMode;
}

export function getHotelCache() {
    return hotelCache;
}

export function renderAllFilteredHotels(hotels) {
    const container = document.getElementById("hotels-list");
    if (container) container.innerHTML = '';
    hotelCache = hotels;
    isFilterMode = true;
    hotelRenderIndex = hotels.length;

    for (const hotel of hotels) {
        if (document.querySelector(`[data-hotel-id="${hotel.id}"]`)) continue;

        const hotelDiv = document.createElement('div');
        hotelDiv.className = 'hotel col-lg-12 d-flex align-items-center border p-3 mb-3';
        hotelDiv.dataset.hotelId = hotel.id;

        const reservationLink = `/reservations?hotel_id=${hotel.id}`
            + `&name=${encodeURIComponent(hotel.name)}`
            + `&stars=${hotel.stars}`
            + `&rating=${encodeURIComponent(hotel.hotel_rating || "N/A")}`
            + `&equipments=${encodeURIComponent(hotel.equipments?.join(", ") || "Aucun équipement")}`
            + `&price=${hotel.price_per_night}`
            + `&image=${encodeURIComponent(hotel.image || "/static/Image/default.jpg")}`
            + `&address=${encodeURIComponent(hotel.address && hotel.address !== "null" && hotel.address.trim() !== "" ? hotel.address : `${hotel.city || "Ville inconnue"}, ${hotel.country || "France"}`)}`
            + `&description=${encodeURIComponent(hotel.description && hotel.description !== "null" ? hotel.description : "Aucune description disponible")}`
            + `&lat=${hotel.latitude || ""}`
            + `&lng=${hotel.longitude || ""}`;

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
                <a href="${reservationLink}" class="reserve-button">Réserver</a>
            </div>
        `;
        container.appendChild(hotelDiv);
    }

    const btn = document.getElementById("load-more-btn");
    if (btn) btn.style.display = "none";
}


