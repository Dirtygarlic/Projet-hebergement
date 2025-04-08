document.addEventListener("DOMContentLoaded", async () => {
    // 🔙 Gère le bouton de retour vers l'accueil
    const backBtn = document.getElementById("back-home");
    if (backBtn) {
        backBtn.addEventListener("click", () => {
            window.location.href = "/"; // Redirection vers index.html
        });
    }

    const userId = localStorage.getItem("user_id");
    if (!userId) {
        alert("Vous devez être connecté pour voir vos réservations.");
        return;
    }

    const container = document.getElementById("reservations-container");
    const response = await fetch(`/api/mes-reservations/${userId}`);
    const reservations = await response.json();

    if (reservations.length === 0) {
        container.innerHTML = "<p>Aucune réservation pour le moment.</p>";
        return;
    }

    reservations.forEach(r => {
        const card = document.createElement("div");
        card.className = "reservation-card";
        card.innerHTML = `
            <img src="${r.image_url}" alt="${r.hotel_name}" />
            <div class="reservation-info">
                <h3>${r.hotel_name}</h3>
                <p>📅 Du ${r.checkin} au ${r.checkout}</p>
                <p>👥 ${r.guests} personne(s)</p>
                <p>💰 ${r.total_price.toFixed(2)} €</p>
                <button class="cancel-button" onclick="cancelReservation(${r.reservation_id})">Annuler</button>
            </div>
        `;
        container.appendChild(card);
    });
});

async function cancelReservation(reservationId) {
    if (confirm("❌ Voulez-vous vraiment annuler cette réservation ?")) {
        const res = await fetch(`/api/reservations/${reservationId}`, {
            method: "DELETE"
        });
        if (res.ok) {
            alert("Réservation annulée !");
            location.reload();
        } else {
            alert("Erreur lors de l'annulation.");
        }
    }
}

