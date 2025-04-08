// ============================
// 📑 reservations.js allégé - sans logique d'authentification
// ============================

// Table des matières mise à jour :
// 1. 🚀 Initialisation DOM & Préremplissage
// 2. 🔍 Paramètres URL & Avis
// 3. 🏨 Info Hôtel + Carte
// 4. ⭐ Avis avec tri & pagination
// 5. 📡 Chargement avis depuis API
// 6. 🧾 Réservation & redirection paiement
// 7. 📅 Checkin / Checkout logique


// ============================
// 1. 🚀 Initialisation DOM
// ============================
document.addEventListener("DOMContentLoaded", function () {
    console.log("🚀 reservations.js chargé et DOM prêt !");

    // ✅ Initialisation des variables touchées (avant toute utilisation)
    let emailTouched = false;
    let phoneTouched = false;

    // 👉 Préremplissage du formulaire si l'utilisateur est connecté
    const safeSet = (id, value) => {
        const field = document.getElementById(id);
        if (field && value) field.value = value;
    };

    safeSet("first-name", localStorage.getItem("first_name"));
    safeSet("user_name", localStorage.getItem("name"));
    safeSet("email", localStorage.getItem("email"));

    // 🔁 Nettoyage du téléphone pour n'autoriser que les chiffres (pas de +33)
    const rawPhone = localStorage.getItem("phone");
    const cleanPhone = rawPhone?.replace(/[^0-9]/g, "");  // enlève +, espaces, etc.
    safeSet("phone", cleanPhone);

    const emailField = document.getElementById("email");
    const phoneField = document.getElementById("phone");
    const reservationForm = document.getElementById("reservation-form");
    const submitBtn = document.getElementById("submit-btn");

    // ✅ Sélection des divs d'erreur existantes (déjà dans le HTML)
    const emailError = document.getElementById("reservation-email-error");
    const phoneError = document.getElementById("reservation-phone-error");

    // ✅ Si déjà remplis, on considère les champs comme "touchés"
    if (emailField.value.trim() !== "") emailTouched = true;
    if (phoneField.value.trim() !== "") phoneTouched = true;

    function validateEmailPhone() {
        const email = emailField.value.trim();
        const phone = phoneField.value.trim();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\+?[0-9\s\-()]{7,}$/;

        const emailValid = emailRegex.test(email);
        const phoneValid = phoneRegex.test(phone);

        const emailEmpty = email === "";
        const phoneEmpty = phone === "";

        // ✉️ Email
        if (emailTouched) {
            if (emailEmpty) {
                emailError.textContent = "❌ Le champ email est obligatoire.";
                emailError.classList.add("visible");
            } else if (!emailValid) {
                emailError.textContent = "❌ Veuillez entrer une adresse email valide.";
                emailError.classList.add("visible");
            } else {
                emailError.textContent = "";
                emailError.classList.remove("visible");
            }
        }

        // 📞 Téléphone
        if (phoneTouched) {
            if (phoneEmpty) {
                phoneError.textContent = "❌ Le champ téléphone est obligatoire.";
                phoneError.classList.add("visible");
            } else if (!phoneValid) {
                phoneError.textContent = "❌ Numéro invalide. Exemple : +33 6 12 34 56 78";
                phoneError.classList.add("visible");
            } else {
                phoneError.textContent = "";
                phoneError.classList.remove("visible");
            }
        }

        // 🎨 Mise à jour des classes CSS
        emailField.classList.toggle("invalid", emailTouched && (!emailValid || emailEmpty));
        phoneField.classList.toggle("invalid", phoneTouched && (!phoneValid || phoneEmpty));

        emailField.classList.toggle("valid", emailTouched && emailValid);
        phoneField.classList.toggle("valid", phoneTouched && phoneValid);

        submitBtn.disabled = !(emailValid && phoneValid);
    }

    // ✅ Événements sur les champs
    emailField.addEventListener("input", () => {
        emailTouched = true;
        validateEmailPhone();
    });

    phoneField.addEventListener("input", () => {
        phoneTouched = true;
        validateEmailPhone();
    });

    // ✅ Lancer la validation immédiatement
    validateEmailPhone();


     // =====================================
    // 🔍 6. Récupération des Paramètres URL
    // =====================================
    const params = new URLSearchParams(window.location.search);
    console.log("🔍 Paramètres récupérés :", Object.fromEntries(params.entries()));

    const reviewsJSON = params.get("reviews");
    let reviews = [];

    try {
        reviews = reviewsJSON ? JSON.parse(decodeURIComponent(reviewsJSON)) : [];
    } catch (error) {
        console.error("❌ Erreur de parsing des avis :", error);
        reviews = [];
    }

    console.log("🔍 Reviews après décodage :", reviews);

    // =====================================
    // 📝 7. Affichage Initial des Avis
    // =====================================
    setTimeout(() => {
        displayReviews(reviews);
    }, 500);

    // =====================================
    // 🏨 8. Chargement et Affichage de l'Hôtel
    // =====================================
    const hotel = getHotelData(params);
    console.log("✅ Hôtel chargé :", hotel);
    updateHotelInfo(hotel);

    // =====================================
    // 🗺️ 9. Initialisation Carte Interactive
    // =====================================
    if (!window.map) {
        console.log("🗺️ Création de la carte...");
        createMap(hotel.latitude, hotel.longitude);
    } else {
        window.map.setView([hotel.latitude, hotel.longitude], 12);
    }

    addHotelMarker(hotel);

    // =====================================
    // 📢 10. Chargement Dynamique des Avis
    // =====================================
    const hotelId = params.get("hotel_id");
    console.log("🔍 `hotel_id` récupéré dans reservations.js :", hotelId);
    if (!reviews.length && hotelId) {
        console.log(`📝 Chargement des avis via l'API pour l'hôtel ID: ${hotelId}`);
        loadReviews(hotelId, "date");
    }
    
    // =====================================
    // 🏨 11. Chargement de Tous les Hôtels
    // =====================================
    loadAllHotels();

    // =====================================
    // 🧹 12. Ajout des Écouteurs de Tri Avis
    // =====================================
    setTimeout(() => {
        console.log("⏳ Vérification après chargement des éléments...");
    
        let sortByDateBtn = document.getElementById("sort-by-date");
        let sortByRatingBtn = document.getElementById("sort-by-rating");
        let sortByNameBtn = document.getElementById("sort-by-name");
        let paginationContainer = document.querySelector(".review-pagination");
    
        if (sortByDateBtn) {
            sortByDateBtn.addEventListener("click", () => sortReviews(reviews, "date"));
        }
    
        if (sortByRatingBtn) {
            sortByRatingBtn.addEventListener("click", () => sortReviews(reviews, "rating"));
        }
    
        if (sortByNameBtn) {
            sortByNameBtn.addEventListener("click", () => sortReviews(reviews, "name"));
        }
    }, 1000);
});  


// ============================================================
// 🔃 13. Tri des Avis selon Critère
// ============================================================
function sortReviews(reviews, criterion) {
    if (criterion === "date") {
        reviews.sort((a, b) => new Date(b.date_posted) - new Date(a.date_posted));
    } else if (criterion === "rating") {
        reviews.sort((a, b) => b.rating - a.rating);
    } else if (criterion === "name") {
        reviews.sort((a, b) => a.first_name.localeCompare(b.first_name));
    }
    currentPage = 1;
    displayReviews(reviews);
}


// ============================================================
// 🛎️ 14. Récupération des Données Hôtel depuis URL
// ============================================================
function getHotelData(params) {
    let imagePath = params.get("image");
    if (!imagePath || imagePath === "null") imagePath = "/static/Image/default.jpg";
    else if (!imagePath.startsWith("http") && !imagePath.startsWith("/static/Image/")) imagePath = `/static/Image/${imagePath}`;

    let hotelLat = parseFloat(params.get("lat")) || 48.8566;
    let hotelLng = parseFloat(params.get("lng")) || 2.3522;

    return {
        id: params.get("hotel_id") || null,
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


// ============================================================
// 🗺️ 15. Création de la Carte Leaflet
// ============================================================
function createMap(lat, lng) {
    if (window.map) window.map.remove();
    
    console.log("🗺️ Initialisation de la carte à :", lat, lng);
    window.map = L.map('hotel-map').setView([lat, lng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
    }).addTo(window.map);
    console.log("✅ Carte créée avec succès !");
}


// ============================================================
// 📍 16. Ajout du Marqueur de l'Hôtel sur la Carte
// ============================================================
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
            if (!hotel.image || hotel.image === "null") {
                hotel.image = "/static/Image/default.jpg";
            }            
            updateHotelInfo(hotel);
            if (hotel.id) {
                console.log(`📝 Rechargement des avis pour l’hôtel ID : ${hotel.id}`);
                loadReviews(hotel.id, "date");
            }
        });
        
    
    window.markers.push(marker);
}


// ============================================================
// 🏨 17. Chargement de Tous les Hôtels (depuis API)
// ============================================================
function loadAllHotels() {
    fetch("/hotels")
        .then(response => response.json())
        .then(hotels => {
            console.log("📌 Liste des hôtels récupérés :", hotels);
            if (!hotels.length) return console.warn("⚠️ Aucun hôtel trouvé.");

            window.allHotels = hotels;
            hotels.forEach((h, index) => {
                setTimeout(() => {
                    if (h.latitude && h.longitude) {
                        addHotelMarker({
                            id: h.id,
                            name: h.name,
                            stars: h.stars,
                            rating: h.rating,
                            address: h.address,
                            image: h.image || "/static/Image/default.jpg", 
                            description: h.description,
                            equipments: h.equipments || [],
                            latitude: h.latitude,
                            longitude: h.longitude
                        });
                    }
                }, index * 50); // 👈 cette parenthèse était mal placée dans ta version
            });
        })
        .catch(error => console.error("❌ Erreur lors du chargement des hôtels :", error));
}


// ============================================================
// 🔄 18. Mise à jour de l’Info Hôtel (HTML + Carte)
// ============================================================
function updateHotelInfo(hotel) {
    console.log(`🔄 Mise à jour de l'hôtel sélectionné : ${hotel.name}`);
    console.log("📍 Adresse reçue :", hotel.address);

    const imageUrl = hotel.image && hotel.image !== "null"
    ? hotel.image
    : "/static/Image/default.jpg";

    console.log("🖼️ Image finale utilisée :", imageUrl);

    const layoutContainer = document.querySelector(".layout-container");
    if (!layoutContainer) {
        console.error("❌ ERREUR: La div .layout-container n'existe pas !");
        return;
    }

    // Si les sections carte et avis existent déjà, on les extrait pour les réinsérer après
    const existingMapAndReviews = document.querySelector(".map-reviews-container");

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
                <img src="${imageUrl}" alt="Photo de l'hôtel">
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
    `;

    // On réinsère la carte et les avis s'ils existaient déjà
    if (existingMapAndReviews) {
        layoutContainer.appendChild(existingMapAndReviews);
    }

    // 🔁 Mise à jour de la carte (sans la recréer)
    if (window.map) {
        window.map.setView([hotel.latitude, hotel.longitude], 12);

        if (window.selectedMarker) {
            window.map.removeLayer(window.selectedMarker);
        }

        window.selectedMarker = L.marker([hotel.latitude, hotel.longitude])
            .addTo(window.map)
            .bindPopup(`<strong>${hotel.name}</strong><br>${hotel.address}`)
            .openPopup();
    } else {
        createMap(hotel.latitude, hotel.longitude);
        window.selectedMarker = L.marker([hotel.latitude, hotel.longitude])
            .addTo(window.map)
            .bindPopup(`<strong>${hotel.name}</strong><br>${hotel.address}`)
            .openPopup();
    }

        
    addHotelMarker(hotel);
}

const reviewsPerPage = 10;
let currentPage = 1;


// ============================================================
// ⭐ 19. Affichage des Avis Clients + Tri + Pagination
// ============================================================
function displayReviews(reviews) {
    console.log("📝 Affichage des avis dans #reviews-list :", reviews);
    
    const reviewsContainer = document.getElementById("reviews-list");
    let paginationContainer = document.querySelector(".review-pagination");
    let filtersContainer = document.querySelector(".review-filters");

    if (!reviewsContainer) {
        console.error("❌ ERREUR : L'élément #reviews-list est introuvable !");
        return;
    }

    reviewsContainer.innerHTML = "";
 
    if (!paginationContainer) {
        console.warn("⚠️ .review-pagination n'existe pas encore, création manuelle...");
        paginationContainer = document.createElement("div");
        paginationContainer.classList.add("review-pagination");
        document.querySelector(".reviews-section").appendChild(paginationContainer);
    } else {
        paginationContainer.innerHTML = ""; // Nettoyage des anciens boutons
    }

    if (!filtersContainer) {
        console.warn("⚠️ .review-filters n'existe pas encore, création manuelle...");
        filtersContainer = document.createElement("div");
        filtersContainer.classList.add("review-filters");
        document.querySelector(".reviews-section").insertBefore(filtersContainer, reviewsContainer);

        filtersContainer.innerHTML = `
        <button id="sort-by-date">📅 Trier par date</button>
        <button id="sort-by-rating">⭐ Trier par note</button>
        <button id="sort-by-name">🔤 Trier par nom</button>
        `;
    }
    
    if (reviews.length === 0) {
        console.warn("⚠️ Aucun avis reçu, affichage du message par défaut.");
        reviewsContainer.innerHTML = "<p>Aucun avis pour le moment.</p>";
        return;
    }

    console.log("📌 Nombre total d'avis à afficher :", reviews.length);

    // 🎨 Affichage des avis en 2 colonnes
    let reviewGrid = document.createElement("div");
    reviewGrid.classList.add("review-grid");

    // 📌 Découpe des avis par page
    const start = (currentPage - 1) * reviewsPerPage;
    const end = start + reviewsPerPage;
    const reviewsToDisplay = reviews.slice(start, end);

    if (reviewsToDisplay.length === 0) {
        console.warn("⚠️ Aucun avis à afficher sur cette page !");
    }

    try {
        reviewsToDisplay.forEach((review) => {
            const reviewElement = document.createElement("div");
            reviewElement.className = "review-item";
            reviewElement.innerHTML = `
                <div class="review-header">
                    <strong>${review.first_name} ${review.name || ""}</strong> - ${formatDate(review.date_posted)} 
                    <span class="review-rating">⭐ ${review.rating} / 10</span>
                </div>
                <p class="review-comment">${review.comment}</p>
                <hr>
            `;
            reviewGrid.appendChild(reviewElement);
        });
    } catch (error) {
        console.error("❌ Erreur lors de l'affichage des avis :", error);
    }

    console.log("📌 Vérification avant d'ajouter les avis au DOM :", reviewGrid);
    reviewsContainer.appendChild(reviewGrid);

    // 🔄 Gestion de la pagination
    let totalPages = Math.ceil(reviews.length / reviewsPerPage);
    if (totalPages > 1) {
        paginationContainer.innerHTML = ""; // Nettoyage des anciens boutons
        for (let i = 1; i <= totalPages; i++) {
            let pageButton = document.createElement("button");
            pageButton.textContent = i;
            if (currentPage === i) {
                pageButton.classList.add("active");
            }
            pageButton.addEventListener("click", function () {
                currentPage = i;
                displayReviews(reviews);
            });
            paginationContainer.appendChild(pageButton);
        }
    }
    // 🛠 Ajout des événements pour le tri (évite les doublons)
    document.getElementById("sort-by-date").addEventListener("click", () => {
        reviews.sort((a, b) => new Date(b.date_posted) - new Date(a.date_posted));
        currentPage = 1;
        displayReviews(reviews);
    });

    document.getElementById("sort-by-rating").addEventListener("click", () => {
        reviews.sort((a, b) => b.rating - a.rating);
        currentPage = 1;
        displayReviews(reviews);
    });

    document.getElementById("sort-by-name").addEventListener("click", () => {
        reviews.sort((a, b) => a.first_name.localeCompare(b.first_name));
        currentPage = 1;
        displayReviews(reviews);
    });

    console.log("✅ Avis mis à jour avec tri et pagination !");
}


// ============================================================
// 📡 20. Chargement des Avis depuis API /get_reviews
// ============================================================
// 📢 Fonction pour charger les avis depuis l'API
function loadReviews(hotelId, sortBy) {
    console.log(`🔍 Tentative de chargement des avis pour l'hôtel ID: ${hotelId} avec tri: ${sortBy}`);

    fetch(`/get_reviews?hotel_id=${hotelId}&sort_by=${sortBy}`)
        .then(response => response.json())
        .then(reviews => {
            console.log("✅ Avis récupérés :", reviews);
            currentPage = 1; // Réinitialiser à la première page après le tri
            displayReviews(reviews);

            // 📢 Re-ajouter les événements de tri après un rechargement des avis
            document.getElementById("sort-by-date")?.addEventListener("click", () => {
                reviews.sort((a, b) => new Date(b.date_posted) - new Date(a.date_posted));
                currentPage = 1; // Revenir à la première page après le tri
                displayReviews(reviews);
            });

            document.getElementById("sort-by-rating")?.addEventListener("click", () => {
                reviews.sort((a, b) => b.rating - a.rating);
                currentPage = 1; // Revenir à la première page après le tri
                displayReviews(reviews);
            });

        })
        .catch(error => console.error("❌ Erreur lors du chargement des avis :", error));
}


// ============================================================
// 📅 21. Formattage des Dates des Avis
// ============================================================
function formatDate(dateString) {
    console.log("📌 Date reçue :", dateString, "| Type :", typeof dateString);

    if (!dateString) return "Date inconnue";

    // Forcer le format correct en ajoutant 'T00:00:00Z' si nécessaire
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        dateString += "T00:00:00Z";
    }

    let date = new Date(dateString);

    if (isNaN(date.getTime())) {
        console.error("❌ Date invalide :", dateString);
        return "Date inconnue";
    }

    return date.toLocaleDateString("fr-FR", {
        weekday: "long",  // ex: lundi
        day: "2-digit",
        month: "long",    // ex: mars
        year: "numeric"
    });
}


// ============================================================
// 📋 22. Gestion du Formulaire de Réservation et Paiement
// ============================================================
// Debut du chemin vers paiement.js
document.addEventListener("DOMContentLoaded", function () {
    const reservationForm = document.getElementById("reservation-form");
    const adultsInput = document.getElementById("adults1");
    const childrenInput = document.getElementById("children1");
    const totalGuestsDisplay = document.getElementById("total-guests");
    const guestsInput = document.getElementById("guests");
    const errorMessage = document.getElementById("error-message");

    // ✅ Vérifier que les éléments existent avant d'ajouter des événements
    if (!adultsInput || !childrenInput || !guestsInput || !totalGuestsDisplay) {
        console.error("❌ Un des champs de sélection des voyageurs est manquant !");
        return;
    }

    // ✅ Fonction pour calculer le nombre total de voyageurs
    function updateTotalGuests() {
        console.log("🔄 updateTotalGuests() appelée !");
        
        let adults = parseInt(adultsInput.value) || 0;
        let children = parseInt(childrenInput.value) || 0;
        let total = adults + children;

        console.log(`🔄 AVANT mise à jour: Total = ${totalGuestsDisplay.textContent}`);
        console.log(`👨 Adultes: ${adults}, 👶 Enfants: ${children}, 👥 Total Calculé: ${total}`);

        // ✅ Vérifier que errorMessage existe avant de modifier `.style`
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

        // ✅ Vérification avant mise à jour
        if (totalGuestsDisplay) {
            console.log(`🔄 AVANT mise à jour: ${totalGuestsDisplay.textContent}`);
            totalGuestsDisplay.textContent = total;
            guestsInput.value = total;
            console.log(`✅ APRÈS mise à jour: ${totalGuestsDisplay.textContent}`);
        } else {
            console.warn("⚠️ L'élément totalGuestsDisplay est introuvable, mise à jour ignorée.");
        }
    } 

    // ✅ Ajout des écouteurs d'événements pour mettre à jour automatiquement
    adultsInput.addEventListener("input", function () {
        console.log("👨 Modification du nombre d'adultes détectée !");
        updateTotalGuests();
    });

    childrenInput.addEventListener("input", function () {
        console.log("👶 Modification du nombre d'enfants détectée !");
        updateTotalGuests();
    });

    updateTotalGuests(); // Initialisation au chargement de la page

    // ✅ Gestion de la soumission du formulaire
    if (reservationForm) {
        reservationForm.addEventListener("submit", async function (event) {
            event.preventDefault(); // ✅ Empêche le rechargement de la page

            console.log("🔍 Soumission du formulaire détectée...");

            const params = new URLSearchParams(window.location.search);
            let hotelId = params.get("hotel_id"); // ✅ Vérification correcte de hotel_id
            let checkin = document.getElementById("checkin")?.value;
            let checkout = document.getElementById("checkout")?.value;
            let adults = parseInt(adultsInput?.value) || 0;
            let children = parseInt(childrenInput?.value) || 0;
            let guests = adults + children; // ✅ Vérification du total
            const imageUrl = params.get("image_url") || params.get("image") || "/static/Image/default.jpg";

            if (!hotelId) {
                console.error("❌ `hotel_id` invalide :", hotelId);
                alert("❌ Aucun hôtel sélectionné.");
                return;
            }

            if (isNaN(guests) || guests <= 0) {
                console.error("❌ Problème avec la valeur de guests, réinitialisation à 1.");
                guests = 1; // Valeur par défaut si vide
            }

            // ✅ Vérification des limites d'invités
            if (guests > 6 || adults > 4 || children > 2) {
                alert("❌ Nombre de voyageurs incorrect. Maximum : 4 adultes et 2 enfants.");
                return;
            }

            console.log(`✅ Nombre total de voyageurs : ${guests} (Adultes: ${adults}, Enfants: ${children})`);

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

            const stripe_customer_id = localStorage.getItem("stripe_customer_id");
            if (stripe_customer_id) {
                reservationData.stripe_customer_id = stripe_customer_id;
            }

            // 🔐 Ajout du user_id si connecté
            const userId = localStorage.getItem("user_id");

            if (!userId) {
            alert("Utilisateur non connecté.");
            return;
            }

            reservationData.user_id = userId;

            const paiementUrl = `paiement?hotel_id=${encodeURIComponent(hotelId)}&checkin=${encodeURIComponent(checkin)}&checkout=${encodeURIComponent(checkout)}&guests=${encodeURIComponent(guests)}&adults=${encodeURIComponent(adults)}&children=${encodeURIComponent(children)}&gender=${encodeURIComponent(reservationData.gender)}&first_name=${encodeURIComponent(reservationData.first_name)}&user_name=${encodeURIComponent(reservationData.user_name)}&email=${encodeURIComponent(reservationData.email)}&phone=${encodeURIComponent(reservationData.phone)}&image_url=${encodeURIComponent(imageUrl)}`;

            console.log("🔄 Redirection vers :", paiementUrl);
            window.location.href = paiementUrl;
        }); 
    } 
}); 

// ============================================================
// ✍️ 23. Préremplissage du Formulaire Utilisateur Connecté
// ============================================================
function prefillReservationForm() {
    const firstName = localStorage.getItem("first_name");
    const name = localStorage.getItem("name");
    const email = localStorage.getItem("email");
    const phone = localStorage.getItem("phone");

    if (firstName) {
        document.getElementById("first-name").value = firstName;
    }
    if (name) {
        document.getElementById("user_name").value = name;
    }
    if (email) {
        document.getElementById("email").value = email;
    }
    if (phone) {
        document.getElementById("phone").value = phone;
    }
}

// =====================================
// 📅 24. Liaison Date d'arrivée / départ avec message doux
// =====================================
const checkinInput = document.getElementById("checkin");
const checkoutInput = document.getElementById("checkout");
const checkoutWarning = document.getElementById("checkout-warning");

if (checkinInput && checkoutInput && checkoutWarning) {
    checkinInput.addEventListener("change", () => {
        const checkinDate = new Date(checkinInput.value);
        if (isNaN(checkinDate.getTime())) return;

        const nextDay = new Date(checkinDate);
        nextDay.setDate(checkinDate.getDate() + 1);
        const formatted = nextDay.toISOString().split("T")[0];

        // Appliquer la nouvelle date min
        checkoutInput.min = formatted;

        // Si checkout est antérieur, on vide et affiche un message
        if (checkoutInput.value && checkoutInput.value < formatted) {
            checkoutInput.value = "";
            checkoutWarning.style.display = "inline";
        } else {
            checkoutWarning.style.display = "none";
        }
    });

    // Cacher l'avertissement si l'utilisateur change manuellement
    checkoutInput.addEventListener("change", () => {
        if (checkoutInput.value >= checkoutInput.min) {
            checkoutWarning.style.display = "none";
        }
    });
}
