document.addEventListener("DOMContentLoaded", function () {
    console.log("🚀 reservations.js chargé et DOM prêt !");

    if (!window.location.pathname.includes("reservations")) return;
    console.log("📌 Page de réservation détectée");

    const params = new URLSearchParams(window.location.search);
    console.log("🔍 Paramètres récupérés :", Object.fromEntries(params.entries()));

    const hotel = getHotelData(params);
    console.log("✅ Hôtel chargé :", hotel);

    updateHotelInfo(hotel);

    if (!window.map) {
        console.log("🗺️ Création de la carte...");
        createMap(hotel.latitude, hotel.longitude);
    } else {
        console.log(`📍 Recentrement de la carte sur ${hotel.name}`);
        window.map.setView([hotel.latitude, hotel.longitude], 12);
    }

    addHotelMarker(hotel);
    loadAllHotels();
});

function getHotelData(params) {
    let imagePath = params.get("image");
    if (!imagePath || imagePath === "null") imagePath = "/static/Image/default.jpg";
    else if (!imagePath.startsWith("http") && !imagePath.startsWith("/static/Image/")) imagePath = `/static/Image/${imagePath}`;

    let hotelLat = parseFloat(params.get("lat")) || 48.8566;
    let hotelLng = parseFloat(params.get("lng")) || 2.3522;

    return {
        name: params.get("name") || "Nom de l'hôtel",
        stars: parseInt(params.get("stars")) || 0,
        rating: params.get("rating") || "N/A",
        address: params.get("address") && params.get("address") !== "null" ? params.get("address") : "Adresse inconnue",
        image: imagePath,
        description: params.get("description") && params.get("description") !== "null" ? params.get("description") : "Aucune description disponible",
        equipments: params.get("equipments") ? decodeURIComponent(params.get("equipments")).split(",").map(e => e.trim()) : [],
        latitude: hotelLat,
        longitude: hotelLng
    };
}

function createMap(lat, lng) {
    if (window.map) window.map.remove();
    
    console.log("🗺️ Initialisation de la carte à :", lat, lng);
    window.map = L.map('hotel-map').setView([lat, lng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
    }).addTo(window.map);
    console.log("✅ Carte créée avec succès !");
}

function addHotelMarker(hotel) {
    if (!window.map) {
        console.error("❌ Impossible d'ajouter le marqueur, la carte n'existe pas encore !");
        return;
    }
    window.markers = window.markers || [];

    window.markers = window.markers.filter(marker => {
        if (marker.getLatLng().equals([hotel.latitude, hotel.longitude])) {
            window.map.removeLayer(marker);
            return false;
        }
        return true;
    });

    let marker = L.marker([hotel.latitude, hotel.longitude])
        .addTo(window.map)
        .bindPopup(`<strong>${hotel.name}</strong><br>${hotel.address}`)
        .on("click", function () {
            console.log(`🏨 Hôtel sélectionné : ${hotel.name}`);
            updateHotelInfo(hotel);
        });
    
    window.markers.push(marker);
}

function loadAllHotels() {
    fetch("/hotels")
        .then(response => response.json())
        .then(hotels => {
            console.log("📌 Liste des hôtels récupérés :", hotels);
            if (!hotels.length) return console.warn("⚠️ Aucun hôtel trouvé.");

            window.allHotels = hotels;
            hotels.forEach((h, index) => {
                setTimeout(() => { if (h.latitude && h.longitude) addHotelMarker(h); }, index * 50);
            });
        })
        .catch(error => console.error("❌ Erreur lors du chargement des hôtels :", error));
}

function updateHotelInfo(hotel) {
    console.log(`🔄 Mise à jour de l'hôtel sélectionné : ${hotel.name}`);
    const layoutContainer = document.querySelector(".layout-container");
    if (!layoutContainer) return console.error("❌ ERREUR: La div .layout-container n'existe pas !");

    // 📌 Dictionnaire des équipements avec emojis
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

    layoutContainer.innerHTML = `
        <div class="hotel-info-container">
            <h1>${hotel.name} <span class="hotel-stars">${'⭐'.repeat(hotel.stars)}</span></h1>
            <p class="hotel-address">📍 ${hotel.address}</p>
            <div class="hotel-image-container">
                <img src="${hotel.image}" alt="Photo de l'hôtel">
            </div>
            <div class="hotel-equipments">
                <h3>Équipements</h3>
                <div class="equipments-grid">
                    ${hotel.equipments.length > 0 
                        ? hotel.equipments.map(e => 
                            `<div class="equipment-item"><span>${equipmentIcons[e] || "❓"}</span> ${e}</div>`
                        ).join("") 
                        : "<p>Aucun équipement disponible.</p>"
                    }
                </div>
            </div>
            <div class="hotel-description">
                <h3>Description</h3>
                <p>${hotel.description}</p>
            </div>
        </div>
        <div class="map-container">
            <div id="hotel-map" style="width: 100%; height: 500px; border-radius: 10px;"></div>
        </div>`;
    
    createMap(hotel.latitude, hotel.longitude);
    window.markers?.forEach(marker => window.map.removeLayer(marker));
    window.markers = [];
    addHotelMarker(hotel);
    window.allHotels?.forEach(h => { if (h.latitude && h.longitude) addHotelMarker(h); });
}