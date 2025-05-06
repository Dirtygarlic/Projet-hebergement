// =============================================================
// 📁 hotelReview.js
// -------------------------------------------------------------
// Ce fichier contient une fonction dédiée à la récupération
// des avis clients d’un hôtel donné via une API backend.
//
// 🎯 Objectif :
// Permettre de charger dynamiquement les avis d’un hôtel en
// les récupérant depuis le serveur, en fonction de son `hotel_id`.
//
// 🔧 Fonctionnalité :
// - `fetchHotelReviews(hotelId)`
//   → Envoie une requête GET vers `/get_reviews?hotel_id=...&sort_by=date`
//   → Tente de parser la réponse JSON
//   → Retourne la liste des avis sous forme **de chaîne JSON**
//     (utile auparavant pour l’insérer dans l’URL)
//
// 📝 Remarque importante :
// Cette fonction était utilisée pour **transmettre les avis via l’URL**,
// mais cette approche a été abandonnée pour des raisons de sécurité,
// de lisibilité et de performance.
//
// ✅ Aujourd’hui, cette fonction peut être supprimée ou remplacée par
// une fonction de type `loadReviews()` qui retourne directement un tableau,
// comme dans `reviewLoader.js`.
//
// 🔁 Utilisation actuelle : plus utilisée (⚠️ à retirer des imports inutiles).
// =============================================================


export async function fetchHotelReviews(hotelId, sortBy = "date") {
    try {
        const response = await fetch(`/get_reviews?hotel_id=${hotelId}&sort_by=${sortBy}`);
        if (!response.ok) throw new Error(`Erreur API : ${response.statusText}`);

        const reviews = await response.json();
        return reviews;  // ✅ Retourne un tableau JS directement
    } catch (error) {
        console.error("❌ Erreur lors du chargement des avis :", error);
        return [];  // ✅ Fallback sécurisé
    }
}