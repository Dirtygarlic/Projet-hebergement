// =============================================================
// 📁 mesReservations.js
// -------------------------------------------------------------
// Ce script gère l'affichage dynamique des réservations de
// l'utilisateur connecté sur la page `/mes-reservations`.
//
// 🎯 Objectif :
// Permettre à un utilisateur connecté de visualiser la liste
// de ses réservations passées ou en cours, et de pouvoir les annuler.
//
// 🔧 Fonctionnalités :
// - Vérifie si un `user_id` est présent dans le localStorage
//   → sinon affiche une alerte et empêche le chargement
// - Fait un appel API à `/api/mes-reservations/<user_id>`
//   → récupère les réservations de l'utilisateur
// - Si aucune réservation : affiche un message
// - Sinon : crée dynamiquement une carte pour chaque réservation :
//   → image de l’hôtel, nom, dates, nombre de personnes, prix, bouton "Annuler"
// - Gère l’annulation d’une réservation avec confirmation
//   → supprime via `DELETE /api/reservations/<reservation_id>`
//   → recharge la page après succès
// - Gère aussi un bouton de retour vers l’accueil (`#back-home`)
//
// 📦 Dépendances HTML :
// - Un conteneur avec l’ID `#reservations-container`
// - Un bouton avec l’ID `#back-home` (facultatif)
// - Style associé à `.reservation-card` et `.cancel-button`
//
// ✅ Avantages :
// - Interface utilisateur claire et réactive
// - Interaction fluide sans rechargement serveur
// - Code simple à maintenir
//
// ⚠️ Nécessite que l’utilisateur soit connecté (`user_id` dans localStorage)
// =============================================================

document.addEventListener("DOMContentLoaded", async () => {
    const showCancelledCheckbox = document.getElementById("show-cancelled");
    const backBtn = document.getElementById("back-home");
    const searchInput = document.getElementById("client-search");
    const clientFilterDiv = document.querySelector(".client-filter");
    const hotelSearchInput = document.getElementById("hotel-search");

    if (backBtn) {
        backBtn.addEventListener("click", () => {
            window.location.href = "/";
        });
    }

    // 🔍 Filtrage combiné nom + hôtel
    function filterCards() {
        const name = searchInput.value.toLowerCase();
        const hotel = hotelSearchInput.value.toLowerCase();

        const cards = document.querySelectorAll(".reservation-card");
        cards.forEach(card => {
            const clientText = card.querySelector(".client-name")?.textContent.toLowerCase() || "";
            const hotelText = card.querySelector(".hotel-name")?.textContent.toLowerCase() || "";

            const matchName = name === "" || clientText.includes(name);
            const matchHotel = hotel === "" || hotelText.includes(hotel);

            card.style.display = matchName && matchHotel ? "" : "none";
        });
    }

    searchInput.addEventListener("input", filterCards);
    hotelSearchInput.addEventListener("input", filterCards);


    async function loadReservations() {
        const userId = localStorage.getItem("user_id");
        if (!userId) {
            alert("Vous devez être connecté pour voir vos réservations.");
            return;
        }

        const container = document.getElementById("reservations-container");
        container.innerHTML = "";

        let isAdmin = false;
        try {
            const roleRes = await fetch(`/api/user-role/${userId}`);
            const roleData = await roleRes.json();
            isAdmin = roleData.role === "admin";
        } catch (err) {
            console.error("Erreur récupération du rôle :", err);
        }

        const response = await fetch(`/api/mes-reservations/${userId}`);
        const reservations = await response.json();

        // Affiche la barre de recherche uniquement si admin
        clientFilterDiv.style.display = isAdmin ? "flex" : "none";
    
        // 🧮 Statistiques admin
        if (isAdmin) {
            document.getElementById("admin-stats").style.display = "flex";
            document.getElementById("admin-actions").style.display = "block";

            const cleanBtn = document.getElementById("clean-pending-btn");
            cleanBtn.addEventListener("click", async () => {
                if (confirm("🧹 Confirmer le nettoyage des réservations 'pending' de +24h ?")) {
                    try {
                        const res = await fetch("/admin/clean-pending");
                        const data = await res.json();
                        alert(data.message || "Nettoyage effectué.");
                        location.reload();
                    } catch (e) {
                        alert("Erreur lors du nettoyage.");
                        console.error(e);
                    }
                }
            });

            const totalCount = reservations.length;
            const cancelledCount = reservations.filter(r => r.status === "cancelled").length;
            const activeCount = reservations.filter(r => r.status !== "cancelled").length;
            const uniqueClientCount = new Set(reservations.map(r => r.user_id)).size;

            document.getElementById("total-resa").textContent = `Total : ${totalCount}`;
            document.getElementById("active-resa").textContent = `En cours : ${activeCount}`;
            document.getElementById("cancelled-resa").textContent = `Annulées : ${cancelledCount}`;
            document.getElementById("unique-clients").textContent = `Clients uniques : ${uniqueClientCount}`;
        }

        const showCancelled = showCancelledCheckbox.checked;

        const filtered = reservations.filter(r => {
            return showCancelled || r.status !== "cancelled";
        });

        if (filtered.length === 0) {
            container.innerHTML = "<p>Aucune réservation à afficher.</p>";
            return reservations; 
        }

        filtered.forEach(r => {
            const card = document.createElement("div");
            card.className = "reservation-card";
            if (r.status === "cancelled") card.classList.add("cancelled-card");

            const cancelLabel = isAdmin ? "Supprimer" : "Annuler";
            const cancelledBadge = r.status === "cancelled" ? `<span class="cancelled-label">❌ Annulée</span>` : "";
            const adminBadge = isAdmin ? `<span class="admin-badge">Admin</span>` : "";
            const clientInfo = isAdmin && r.first_name && r.last_name ? `<p>👤 ${r.first_name} ${r.last_name}</p>` : "";

            card.innerHTML = `
                <img src="${r.image_url}" alt="${r.hotel_name}" />
                <div class="reservation-info">
                    <h3>${adminBadge} ${cancelledBadge}</h3>
                    <h3 class="hotel-name">${r.hotel_name}</h3>
                    ${clientInfo ? `<p class="client-name">👤 ${r.first_name} ${r.last_name}</p>` : ""}
                    <p>📅 Du ${r.checkin} au ${r.checkout}</p>
                    <p>👥 ${r.guests} personne(s)</p>
                    <p>💰 ${r.total_price.toFixed(2)} €</p>
                    ${r.status !== "cancelled" ? `
                        <button class="cancel-button" onclick="cancelReservation(${r.reservation_id}, ${userId})">${cancelLabel}</button>
                    ` : `
                        <p class="cancelled-label">❌ Réservation annulée</p>
                    `}
                </div>
            `;
            container.appendChild(card);
        });
    }
    showCancelledCheckbox.addEventListener("change", loadReservations);
    await loadReservations(); // 👈 Pas besoin de récupérer la valeur
});

async function cancelReservation(reservationId, userId) {
    if (confirm("❌ Voulez-vous vraiment annuler cette réservation ?")) {
        const res = await fetch(`/api/reservations/${reservationId}?user_id=${userId}`, {
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


