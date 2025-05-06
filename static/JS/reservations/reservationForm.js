// =============================================================
// 📁 reservationForm.js
// -------------------------------------------------------------
// Ce fichier gère la logique du formulaire de réservation d’un hôtel,
// en contrôlant le nombre total de voyageurs (adultes + enfants),
// en affichant dynamiquement ce total, en validant les contraintes,
// puis en redirigeant l’utilisateur vers la page de paiement avec
// les paramètres nécessaires.
//
// 🎯 Objectif :
// Offrir une interface dynamique et sécurisée pour la réservation
// d’un hôtel, tout en imposant des règles claires sur la composition
// du groupe (max 4 adultes, 2 enfants, 6 personnes au total).
//
// 🔧 Fonctionnalités :
// - Calcul automatique du total de voyageurs à chaque changement d’entrée.
// - Affichage immédiat d’un message d’erreur si les limites sont dépassées.
// - Validation du formulaire avant envoi :
//   → vérifie que l’hôtel est sélectionné,
//   → vérifie que l’utilisateur est connecté,
//   → vérifie que les champs sont bien remplis.
// - Construction d’une URL avec tous les paramètres nécessaires
//   pour rediriger vers la page `paiement.html`.
//
// 📦 Données transmises dans l’URL :
// - ID hôtel, dates, nombre de voyageurs, prénom, email, téléphone, image, etc.
//
// 🧩 Dépendances côté HTML :
// - Un formulaire avec l’ID `reservation-form`
// - Champs `adults1`, `children1`, `guests`, `checkin`, `checkout`, etc.
// - Élément pour afficher le total : `#total-guests`
// - Élément d’erreur : `#error-message`
//
// ⚠️ Remarque : cette fonction suppose que certains éléments
// sont déjà présents dans le `


// ============================
// 📋 reservationForm.js
// ============================

export function setupReservationForm() {
    const reservationForm = document.getElementById("reservation-form");
    const adultsInput = document.getElementById("adults1");
    const childrenInput = document.getElementById("children1");
    const totalGuestsDisplay = document.getElementById("total-guests");
    const guestsInput = document.getElementById("guests");
    const errorMessage = document.getElementById("error-message");

    if (!adultsInput || !childrenInput || !guestsInput || !totalGuestsDisplay) {
        console.error("❌ Un des champs de sélection des voyageurs est manquant !");
        return;
    }

    function updateTotalGuests() {
        let adults = parseInt(adultsInput.value) || 0;
        let children = parseInt(childrenInput.value) || 0;
        let total = adults + children;

        if (errorMessage) {
            if (total > 6 || adults > 4 || children > 2) {
                errorMessage.style.display = "block";
                errorMessage.textContent = "❌ Maximum 4 adultes et 2 enfants (6 personnes au total)";
                guestsInput.setCustomValidity("Le nombre total de voyageurs ne peut pas dépasser 6.");
            } else {
                errorMessage.style.display = "none";
                guestsInput.setCustomValidity("");
            }
        }

        totalGuestsDisplay.textContent = total;
        guestsInput.value = total;
    }

    adultsInput.addEventListener("input", updateTotalGuests);
    childrenInput.addEventListener("input", updateTotalGuests);

    updateTotalGuests();

    if (reservationForm) {
        reservationForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const params = new URLSearchParams(window.location.search);
            const hotelId = params.get("hotel_id");
            const checkin = document.getElementById("checkin")?.value;
            const checkout = document.getElementById("checkout")?.value;
            const adults = parseInt(adultsInput?.value) || 0;
            const children = parseInt(childrenInput?.value) || 0;
            let guests = adults + children;
            const imageUrl = params.get("image_url") || params.get("image") || "/static/Image/default.jpg";

            if (!hotelId) {
                alert("❌ Aucun hôtel sélectionné.");
                return;
            }

            if (isNaN(guests) || guests <= 0) {
                guests = 1;
            }

            if (guests > 6 || adults > 4 || children > 2) {
                alert("❌ Nombre de voyageurs incorrect. Maximum : 4 adultes et 2 enfants.");
                return;
            }

            const reservationData = {
                hotel_id: hotelId,
                checkin,
                checkout,
                guests,
                adults,
                children,
                gender: document.getElementById("gender")?.value || "",
                first_name: document.getElementById("first-name")?.value || "",
                user_name: document.getElementById("user_name")?.value || "",
                email: document.getElementById("email")?.value || "",
                phone: document.getElementById("phone")?.value || "",
                stripe_customer_id: localStorage.getItem("stripe_customer_id") || "",
                user_id: localStorage.getItem("user_id") || "",
                total_price: parseFloat(localStorage.getItem("total_price")) || 0
            };

            const userId = localStorage.getItem("user_id");
            if (!userId) {
                alert("Utilisateur non connecté.");
                return;
            }

            reservationData.user_id = userId;

            const paiementUrl = `paiement?hotel_id=${encodeURIComponent(hotelId)}&checkin=${encodeURIComponent(checkin)}&checkout=${encodeURIComponent(checkout)}&guests=${encodeURIComponent(guests)}&adults=${encodeURIComponent(adults)}&children=${encodeURIComponent(children)}&gender=${encodeURIComponent(reservationData.gender)}&first_name=${encodeURIComponent(reservationData.first_name)}&user_name=${encodeURIComponent(reservationData.user_name)}&email=${encodeURIComponent(reservationData.email)}&phone=${encodeURIComponent(reservationData.phone)}&image_url=${encodeURIComponent(imageUrl)}`;

            window.location.href = paiementUrl;
        });
    }
}
