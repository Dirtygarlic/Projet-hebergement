// =============================================================
// 📁 reservationMap.js
// -------------------------------------------------------------
// Ce fichier gère l’affichage dynamique de la carte interactive
// des hôtels sur la page de réservation, ainsi que la récupération
// des données de l’hôtel sélectionné et la mise à jour des infos
// visibles (image, équipements, description, avis, etc.).
//
// 🎯 Objectif :
// - Créer et afficher une carte interactive avec Leaflet.
// - Ajouter des marqueurs d’hôtels cliquables.
// - Mettre à jour dynamiquement l’interface utilisateur
//   en fonction de l’hôtel sélectionné.
// - Gérer l’URL dynamiquement avec les infos de l’hôtel.
//
// 🔧 Fonctionnalités principales :
// 1. `getHotelData(params)`
//    - Extrait les données d’un hôtel depuis les paramètres d’URL.
//    - Fournit un objet `hotel` prêt à être utilisé dans l’affichage.
//
// 2. `createMap(lat, lng)`
//    - Initialise la carte Leaflet centrée sur une latitude/longitude donnée.
//
// 3. `addHotelMarker(hotel, onClickCallback)`
//    - Ajoute un marqueur pour un hôtel.
//    - Met à jour l’URL avec les détails de l’hôtel au clic.
//
// 4. `updateHotelInfo(hotel)`
//    - Met à jour l’affichage principal de la page (titre, image, équipements, etc.).
//    - Affiche les avis dans `.reviews-list` si présents.
//    - Centre la carte sur l’hôtel sélectionné et ajoute un marqueur unique.
//
// 🧩 Dépendance :
// - `initReservations` (depuis `reservationInit.js`) — importé mais **non utilisé ici**.
//
// 🌐 Librairie utilisée :
// - [Leaflet.js](https://leafletjs.com/) pour l’affichage cartographique.
//
// ⚠️ Attention : le conteneur `.reviews-list` doit être présent dans le HTML
//               pour que les avis s'affichent correctement.
// =============================================================


// ============================
// 🗺️ reservationMap.js
// ============================


let markers = [];
let selectedMarker = null;

export function getHotelData(params) {
    let imagePath = params.get("image");
    if (!imagePath || imagePath === "null") imagePath = "/static/Image/default.jpg";
    else if (!imagePath.startsWith("http") && !imagePath.startsWith("/static/Image/")) {
        imagePath = `/static/Image/${imagePath}`;
    }

    let hotelLat = parseFloat(params.get("lat")) || 48.8566;
    let hotelLng = parseFloat(params.get("lng")) || 2.3522;

    return {
        id: params.get("hotel_id") || null,
        name: params.get("name") || "Nom de l'hôtel",
        stars: parseInt(params.get("stars")) || 0,
        rating: params.get("rating") || "N/A",
        address: params.get("address") !== "null" ? params.get("address") : "Adresse inconnue",
        image: imagePath,
        description: params.get("description") !== "null" ? params.get("description") : "Aucune description disponible",
        equipments: params.get("equipments") ? decodeURIComponent(params.get("equipments")).split(",").map(e => e.trim()) : [],
        latitude: hotelLat,
        longitude: hotelLng,
    };
}

export function createMap(lat, lng) {
    // Vérifiez si la carte existe déjà avant de la recréer
    if (window.map) return;

    window.map = L.map('hotel-map').setView([lat, lng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(window.map);
}


export function addHotelMarker(hotel, onClickCallback = null) {
    if (!window.map) return;

    // Ne supprime pas les marqueurs existants, juste ajouter un nouveau marqueur
    const marker = L.marker([hotel.latitude, hotel.longitude])
        .addTo(window.map)
        .bindPopup(`<strong>${hotel.name}</strong><br>${hotel.address}`)
        .on("click", () => {
            console.log("🖱️ Clic sur : ", hotel.name);

            if (!hotel.image || hotel.image === "null") {
                hotel.image = "/static/Image/default.jpg";
            }

            // 👉 Met à jour l’URL
            const url = new URL(window.location);
            url.searchParams.set("hotel_id", hotel.id);
            url.searchParams.set("name", hotel.name);
            url.searchParams.set("stars", hotel.stars);
            url.searchParams.set("rating", hotel.rating);
            url.searchParams.set("equipments", hotel.equipments.join(","));
            url.searchParams.set("price", hotel.price);
            url.searchParams.set("image", hotel.image);
            url.searchParams.set("address", hotel.address);
            url.searchParams.set("description", hotel.description);
            url.searchParams.set("lat", hotel.latitude);
            url.searchParams.set("lng", hotel.longitude);
            
            // 🔁 Recharge proprement la page avec la nouvelle URL
            window.location.href = url.toString();
        });

    markers.push(marker);
}


export function updateHotelInfo(hotel) {
    console.log("Chargement des informations pour l'hôtel : ", hotel.name);
    // Exemple d'affichage des commentaires
    const layoutContainer = document.querySelector(".layout-container");
    const existingMapAndReviews = document.querySelector(".map-reviews-container");

    const imageUrl = hotel.image && hotel.image !== "null"
        ? hotel.image
        : "/static/Image/default.jpg";

    console.log("Image de l'hôtel : ", imageUrl);

    const equipmentIcons = {
        "Parking": "🚗", "Restaurant": "🍽️", "Piscine": "🏊", "Animaux admis": "🐾",
        "Salle de sport": "🏋️", "Spa": "💆", "Wi-Fi gratuit": "📶", "Climatisation": "❄️",
        "Borne recharge": "⚡", "Accès PMR": "♿", "Machine à laver": "🧺", "Kitchenette": "🍳"
    };

    layoutContainer.innerHTML = `
        <div class="hotel-info-container">
            <h1>${hotel.name} <span class="hotel-stars">${'⭐'.repeat(hotel.stars)}</span></h1>
            <p class="hotel-address">📍 ${hotel.address}</p>
            <div class="hotel-image-container">
                <img src="${imageUrl}" alt="Photo de l'hôtel">
            </div>
            <div class="hotel-equipments">
                <h3>Équipements</h3>
                <div class="equipments-grid">
                    ${hotel.equipments.length > 0
                        ? hotel.equipments.map(e => `<div class="equipment-item"><span>${equipmentIcons[e] || "❓"}</span> ${e}</div>`).join("")
                        : "<p>Aucun équipement disponible.</p>"
                    }
                </div>
            </div>
            <div class="hotel-description">
                <h3>Description</h3>
                <p>${hotel.description}</p>
            </div>
        </div>
    `;

    if (existingMapAndReviews) {
        layoutContainer.appendChild(existingMapAndReviews);
    }

    // Affichage des commentaires dynamiquement dans la section .reviews-list
    const reviewsContainer = document.querySelector(".reviews-list");

    if (!reviewsContainer) {
        console.warn("⚠️ .reviews-list introuvable. Le conteneur des avis doit être dans le HTML pour afficher les commentaires.");
        return;
    }

    reviewsContainer.innerHTML = "";  // Vider les anciens commentaires

    console.log("Chargement des commentaires pour l'hôtel : ", hotel.name);
    console.log("Commentaires de l'hôtel : ", hotel.reviews);

    // Vérifier si des commentaires existent et les afficher
    if (hotel.reviews && hotel.reviews.length > 0) {
        hotel.reviews.forEach(review => {
            const reviewElement = document.createElement("div");
            reviewElement.classList.add("review");
            reviewElement.innerHTML = `
                <p><strong>${review.first_name} ${review.last_name}</strong> - ${review.rating}⭐</p>
                <p>${review.comment}</p>
            `;
            reviewsContainer.appendChild(reviewElement);
        });
    } else {
        reviewsContainer.innerHTML = "<p>Aucun commentaire disponible.</p>";
    }

    if (window.map) {
        window.map.setView([hotel.latitude, hotel.longitude], 12);

        if (selectedMarker) {
            window.map.removeLayer(selectedMarker);
        }

        selectedMarker = L.marker([hotel.latitude, hotel.longitude])
            .addTo(window.map)
            .bindPopup(`<strong>${hotel.name}</strong><br>${hotel.address}`)
            .openPopup();
    } else {
        createMap(hotel.latitude, hotel.longitude);
    }

    addHotelMarker(hotel);
}
