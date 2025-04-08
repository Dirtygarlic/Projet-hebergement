// =========================================
// 📚 SOMMAIRE DU FICHIER paiement.js
// =========================================
// 1. 📦 Importations des modules
// 2. 📝 Gestion des événements de formulaire
// 3. 📞 Validation en temps réel des champs
// 4. 🔐 Réinitialisation du mot de passe
// 5. 🔧 Fonctions utilitaires (prix / nuits)
// 6. 🚀 Initialisation principale (DOMContentLoaded)
//    6.1 Chargement clé Stripe
//    6.2 Extraction des données URL
//    6.3 Affichage dans le DOM
//    6.4 Création session Stripe Checkout
// 7. 🌍 Fonctions exposées au HTML
// =========================================

// ============================
// 1. 📦 Importations des modules
// ============================
import { checkLoginOnLoad } from '../authentification/sessionManager.js';


// ============================
// 5. 🔧 Fonctions utilitaires (prix / nuits)
// ============================
async function getPricePerNight(hotelId) {
    const response = await fetch(`/get_price_per_night/${hotelId}`);
    const data = await response.json();
    return data.price_per_night || 100;
}

function calculateNumberOfNights(checkin, checkout) {
    const date1 = new Date(checkin);
    const date2 = new Date(checkout);
    const diffTime = date2 - date1;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// ============================
// 6. 🚀 Initialisation principale (DOMContentLoaded)
// ============================
document.addEventListener("DOMContentLoaded", async () => {
    checkLoginOnLoad();

    console.log("🚀 paiement.js chargé et DOM prêt !");

    // 6.1 Chargement clé Stripe
    let STRIPE_PUBLIC_KEY = null;

    // ✅ Import dynamique de la clé Stripe
    try {
        // ✅ Tentative d'import dynamique
        const module = await import("/stripe_config.js");
        STRIPE_PUBLIC_KEY = module.STRIPE_PUBLIC_KEY;
    } catch (err) {
        console.warn("⚠️ Impossible de charger stripe_config.js :", err);
        // ⚠️ Pas de blocage ici
    }

    // ⚠️ Si Stripe n'est pas dispo, tu alertes seulement au moment du paiement
    if (typeof Stripe === "undefined") {
        alert("⚠️ Stripe est indisponible.");
        return;
    }

    const stripe = STRIPE_PUBLIC_KEY ? Stripe(STRIPE_PUBLIC_KEY) : null;

    if (!stripe) {
        const payBtn = document.getElementById("pay-button");
        payBtn.disabled = true;
        payBtn.textContent = "Redirection en cours...";     
        if (payBtn) {
            payBtn.disabled = true;
            payBtn.textContent = "Paiement indisponible";
        }
    }

    // 6.2 Extraction des données URL
    const params = new URLSearchParams(window.location.search);
    const hotelId = params.get("hotel_id");
    // ✅ Récupérer dynamiquement le nom de l'hôtel
    if (hotelId) {
        fetch(`/get_hotel_name?hotel_id=${hotelId}`)
            .then(response => response.json())
            .then(data => {
                if (data.name) {
                    document.getElementById("hotel-name").textContent = data.name;
                } else {
                    document.getElementById("hotel-name").textContent = "Nom introuvable";
                }
            })
            .catch(error => {
                console.error("❌ Erreur lors de la récupération du nom de l'hôtel :", error);
                document.getElementById("hotel-name").textContent = "Erreur de chargement";
            });
    }

    const checkin = params.get("checkin");
    const checkout = params.get("checkout");
    const guests = parseInt(params.get("guests")) || 1;
    const adults = parseInt(params.get("adults")) || 0;
    const children = parseInt(params.get("children")) || 0;
    const gender = params.get("gender");
    const firstName = params.get("first_name");
    const userName = params.get("user_name");
    const email = params.get("email");
    const phone = params.get("phone");
    const imageUrl = params.get("image_url") || "/static/Image/default.jpg";

    // 6.3 Affichage dans le DOM
    let pricePerNight = await getPricePerNight(hotelId);
    let numberOfNights = calculateNumberOfNights(checkin, checkout);
    let totalPrice = pricePerNight * numberOfNights;

    // 🧾 Affichage dans le DOM
    document.getElementById("checkin").textContent = checkin;
    document.getElementById("checkout").textContent = checkout;
    document.getElementById("guests").textContent = `${guests} (Ad: ${adults}, Enf: ${children})`;
    document.getElementById("number-of-nights").textContent = `${numberOfNights} nuit(s)`;
    document.getElementById("total-price").textContent = totalPrice.toFixed(2) + " €";
    document.getElementById("gender").textContent = gender;
    document.getElementById("first_name").textContent = firstName;
    document.getElementById("user_name").textContent = userName;
    document.getElementById("email").textContent = email;
    document.getElementById("phone").textContent = phone;

    const imageElement = document.getElementById("hotel-image");
    if (imageElement) {
        imageElement.src = imageUrl;
        imageElement.onerror = () => imageElement.src = "/static/Image/default.jpg";
    }

    // 6.4 Création session Stripe Checkout
    document.getElementById("pay-button").addEventListener("click", async () => {
        console.log("🎯 Bouton cliqué");
        try {
            // 1️⃣ Création client Stripe
            const user_id = localStorage.getItem("user_id");

            // 🔐 Vérifie que l'utilisateur est bien connecté
            if (!user_id) {
            alert("Veuillez vous connecter pour effectuer une réservation.");
            return;
        }

            localStorage.setItem("total_price", totalPrice.toString());

            // 2️⃣ Création de la session Stripe Checkout
            const response = await fetch("/create-checkout-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotel_id: hotelId,
                    guests,
                    checkin,
                    checkout,
                    first_name: firstName,
                    user_name: userName,
                    gender,
                    email,
                    phone,
                    adults,
                    children,
                    total_price: totalPrice,
                    user_id: user_id
                })
            });

            const session = await response.json();

            if (session.url) {
                console.log("🔗 Redirection vers Stripe avec l'URL :", session.url);
                const payBtn = document.getElementById("pay-button");
                payBtn.disabled = true;
                payBtn.textContent = "Redirection en cours...";

                setTimeout(() => {
                    //window.location.href = session.url;
                    window.open(session.url, "_self");
                }, 100);  // ← délai très court mais suffisant
            
            } else {
                alert("❌ Erreur de session Stripe.");
            }
        } catch (error) {
            console.error("❌ Erreur pendant le paiement :", error);
            alert("Une erreur est survenue.");
        }
    });
});