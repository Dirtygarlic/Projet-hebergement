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
        longitude: hotelLng
    };
}

export function createMap(lat, lng) {
    if (window.map) window.map.remove();

    window.map = L.map('hotel-map').setView([lat, lng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(window.map);
}

export function addHotelMarker(hotel, onClickCallback = null) {
    if (!window.map) return;

    markers = markers.filter(marker => {
        if (marker.getLatLng().equals([hotel.latitude, hotel.longitude])) {
            window.map.removeLayer(marker);
            return false;
        }
        return true;
    });

    const marker = L.marker([hotel.latitude, hotel.longitude])
        .addTo(window.map)
        .bindPopup(`<strong>${hotel.name}</strong><br>${hotel.address}`)
        .on("click", () => {
            if (!hotel.image || hotel.image === "null") hotel.image = "/static/Image/default.jpg";
            if (onClickCallback) onClickCallback(hotel);
        });

    markers.push(marker);
}

export function updateHotelInfo(hotel) {
    const layoutContainer = document.querySelector(".layout-container");
    const existingMapAndReviews = document.querySelector(".map-reviews-container");

    const imageUrl = hotel.image && hotel.image !== "null"
        ? hotel.image
        : "/static/Image/default.jpg";

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
