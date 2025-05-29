// ============================
// 📑 paiement.js (modulaire)
// ============================
// Ce fichier est le point d'entrée principal pour la page de paiement.
// Il orchestre :
// - la récupération des données d'une réservation via l'URL,
// - le calcul dynamique du prix total (nuitées x tarif),
// - l'affichage des détails dans le DOM,
// - la connexion à Stripe via une session Checkout,
// - la redirection vers Stripe pour le paiement.
//
// Chaque logique est déléguée à un module JS clair. 🧩

/*
JS/
├── paiement.js                 # Point d’entrée principal de la page paiement
└── paiement/                   # Modules dédiés
    ├── paiementUtils.js        # 💰 Fonctions utilitaires (prix, nuitées)
    ├── paiementDOM.js          # 🧾 Affichage des données dans le DOM
    ├── stripeSession.js        # 💳 Création de session Stripe
    └── hotelNameLoader.js      # 📛 Chargement dynamique du nom de l’hôtel
*/

/* 🧭 Table des matières du fichier paiement.js :
1. 📦 Importation des modules
2. 🚀 Initialisation principale DOM
   2.1 ✅ Vérification login utilisateur
   2.2 🔐 Chargement dynamique clé Stripe
   2.3 📥 Extraction des paramètres de réservation
   2.4 Nom de l’hôtel (chargement dynamique)
   2.5 💰 Calcul prix total
   2.6 🧾 Affichage DOM
   2.7 💳 Création session Stripe et redirection
*/


// ============================
// 1. 📦 Importations des modules
// ============================
import { checkLoginOnLoad } from './authentification/sessionManager.js';
import { getPricePerNight, calculateNumberOfNights } from './paiement/paiementUtils.js';
import { displayReservationDetails } from './paiement/paiementDOM.js';
import { createStripeSession } from './paiement/stripeSession.js';
import { loadHotelName } from './paiement/hotelNameLoader.js';


// ============================
// 2. 🚀 Initialisation principale DOM
// ============================
document.addEventListener("DOMContentLoaded", async () => {
    // 2.1 ✅ Connexion utilisateur persistante
    checkLoginOnLoad();

    // 2.2 🔐 Chargement de la clé Stripe
    let STRIPE_PUBLIC_KEY = null;
    try {
        const module = await import("/stripe_config.js");
        STRIPE_PUBLIC_KEY = module.STRIPE_PUBLIC_KEY;
    } catch (err) {
        alert("Impossible de charger la clé Stripe.");
        return;
    }

    if (typeof Stripe === "undefined") {
        alert("Stripe est indisponible.");
        return;
    }

    const stripe = STRIPE_PUBLIC_KEY ? Stripe(STRIPE_PUBLIC_KEY) : null;
    if (!stripe) {
        const payBtn = document.getElementById("pay-button");
        if (payBtn) {
            payBtn.disabled = true;
            payBtn.textContent = "Paiement indisponible";
        }
        return;
    }

    // 2.3 📥 Récupération des paramètres de réservation depuis l'URL
    const params = new URLSearchParams(window.location.search);
    const data = {
        hotelId: params.get("hotel_id"),
        checkin: params.get("checkin"),
        checkout: params.get("checkout"),
        guests: parseInt(params.get("guests")) || 1,
        adults: parseInt(params.get("adults")) || 0,
        children: parseInt(params.get("children")) || 0,
        gender: params.get("gender"),
        firstName: params.get("first_name"),
        userName: params.get("user_name"),
        email: params.get("email"),
        phone: params.get("phone"),
        imageUrl: params.get("image_url") || "/static/Image/default.jpg"
    };

    // 2.4 Nom de l’hôtel (chargement dynamique)
    if (data.hotelId) {
        loadHotelName(data.hotelId);
    }

    // 2.5 💰 Calcul du prix total
    const pricePerNight = await getPricePerNight(data.hotelId);
    const numberOfNights = calculateNumberOfNights(data.checkin, data.checkout);
    const totalPrice = pricePerNight * numberOfNights;
    localStorage.setItem("total_price", totalPrice.toString());

    // 2.6 🧾 Affichage dans le DOM
    displayReservationDetails(data, numberOfNights, totalPrice);

    // 2.7 💳 Création session Stripe Checkout
    document.getElementById("pay-button").addEventListener("click", async () => {
        const user_id = localStorage.getItem("user_id");
        if (!user_id) {
            alert("Veuillez vous connecter pour effectuer une réservation.");
            return;
        }
        console.log("📤 Envoi vers Stripe avec user_id =", user_id);
        await createStripeSession({ ...data, total_price: totalPrice, user_id });
    });
});
