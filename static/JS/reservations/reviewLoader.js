// =============================================================
// 📁 reviewLoader.js
// -------------------------------------------------------------
// Ce fichier contient la fonction `loadReviews()` qui récupère
// les avis d’un hôtel depuis une API back-end et les retourne
// pour traitement ou affichage.
//
// 🎯 Objectif :
// Charger dynamiquement les avis associés à un hôtel donné via
// une requête HTTP GET, en gérant les erreurs proprement et
// en permettant le tri dès la récupération.
//
// 🔧 Fonctionnalités :
// - Envoie une requête `fetch` vers l’endpoint `/get_reviews` avec
//   l’ID de l’hôtel et un critère de tri facultatif (`sortBy`).
// - Parse la réponse JSON et retourne un tableau d’avis.
// - Affiche les avis dans la console pour débogage.
// - Gère les erreurs HTTP et réseau avec un fallback propre.
//
// 🧩 Dépendance :
// - `displayReviews` est importé mais **non utilisé ici** (peut être retiré).
//
// 📦 Retour : un tableau d’objets `reviews` ou un tableau vide en cas d’échec.
// =============================================================


// ============================
// 📡 reviewLoader.js
// ============================

/**
 * Charge les avis d’un hôtel donné via l’API backend.
 * @param {number} hotelId - Identifiant de l’hôtel à interroger.
 * @param {string} [sortBy="date"] - Critère de tri (par défaut : "date").
 * @returns {Promise<Array>} - Tableau d’avis ou tableau vide en cas d’erreur.
 */

export async function loadReviews(hotelId, sortBy = "date") {
    console.log(`📡 Chargement des avis pour l'hôtel ID: ${hotelId} avec tri: ${sortBy}`);

    try {
        const response = await fetch(`/get_reviews?hotel_id=${hotelId}&sort_by=${sortBy}`);
        if (!response.ok) throw new Error("Erreur HTTP : " + response.status);
        const reviews = await response.json();
        console.log("✅ Avis récupérés depuis l'API :", reviews);
        return reviews;  // ✅ on retourne les avis !
    } catch (error) {
        console.error("❌ Erreur lors du chargement des avis :", error);
        return []; // ✅ retourne un tableau vide en cas d'erreur
    }
}