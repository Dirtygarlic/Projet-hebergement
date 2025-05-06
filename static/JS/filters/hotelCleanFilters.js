// =============================================================
// 📁 filters/hotelCleanFilters.js
// -------------------------------------------------------------
// Ce fichier contient une fonction utilitaire dédiée au nettoyage
// des objets de filtres utilisés dans les requêtes de recherche
// d’hôtels ou dans d'autres modules de filtrage.
//
// 🎯 Objectif :
// Éviter d’envoyer des filtres vides, null ou inutiles à l’API
// en supprimant toutes les clés non pertinentes d’un objet `filters`.
//
// 🔧 Fonctionnalité :
// - `cleanFilters(filters)`
//   → Supprime les propriétés de l'objet dont la valeur est :
//      • `null`
//      • une chaîne vide (`''`)
//      • un tableau vide (`[]`)
//   → Retourne l’objet nettoyé prêt à être utilisé dans une requête.
//
// ✅ Utile avant d’envoyer une requête à l’API pour garantir
// que seuls les filtres réellement remplis soient transmis.
// Cela évite des traitements ou erreurs inutiles côté back-end.
//
// 🧩 Utilisé dans :
// - `hotel.js` (pour la recherche globale et les filtres spécifiques)
// - tout autre fichier manipulant des objets de filtres dynamiques
//
// 🔄 Fonction pure : elle ne modifie que l’objet passé en paramètre.
// =============================================================


export function cleanFilters(filters) {
    Object.keys(filters).forEach(key => {
        if (
            filters[key] === null ||
            filters[key] === '' ||
            (Array.isArray(filters[key]) && filters[key].length === 0)
        ) {
            delete filters[key];
        }
    });
    return filters;
}
