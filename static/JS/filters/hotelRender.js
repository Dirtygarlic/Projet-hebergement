console.log("🎨 Module hotelRender.js chargé !");

import { fetchHotelReviews } from './hotelReview.js';

export async function renderHotelsWithReviews(hotels) {
    console.log("✅ Hôtels filtrés :", hotels);
    const container = document.getElementById("hotels-list");
    container.innerHTML = '';

    // 🔍 Supprimer les doublons basés sur l'ID de l'hôtel
    const uniqueHotels = Array.from(new Map(hotels.map(h => [h.id, h])).values());

    const countElement = document.getElementById("hotel-count");
    if (countElement) {
        countElement.innerHTML = uniqueHotels.length > 0
            ? `<strong style="color: green;">Nombre d'hôtels trouvés : ${uniqueHotels.length}</strong>`
            : `<strong style="color: red;">Aucun hôtel trouvé</strong>`;
    }

    if (uniqueHotels.length === 0) {
        container.innerHTML = `
            <div class="alert text-center d-flex flex-column align-items-center justify-content-center" role="alert" 
                 style="color: red; font-weight: bold; min-height: 300px; display: flex; flex-direction: column; text-align: center;">
                <img src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExb3JmdTVrem5seG9iZTR3bnIzNDE1NjVnM2dzdnBlOWRlcXZnM3NibSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/UC0bLicVsCTnhtGaBq/giphy.gif" 
                     alt="Désolé" 
                     style="width: 500px; height: auto; margin-bottom: 10px;">
                <br>OUPS ! Veuillez modifier votre recherche.
            </div>`;
        return;
    }  

    for (const hotel of uniqueHotels) {
        const hotelDiv = document.createElement('div');
        hotelDiv.className = 'hotel col-lg-12 d-flex align-items-center border p-3 mb-3';

        const reviews = await fetchHotelReviews(hotel.id);

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
        + `&lng=${hotel.longitude || ""}`
        + `&reviews=${encodeURIComponent(reviews)}`;

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
}
