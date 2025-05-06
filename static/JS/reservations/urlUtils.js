// =============================================================
// 📁 urlUtils.js
// -------------------------------------------------------------
// Ce fichier expose une fonction utilitaire permettant d’extraire
// facilement les paramètres de l’URL via `URLSearchParams`.
//
// 🎯 Objectif :
// Centraliser la lecture des paramètres d’URL dans une fonction
// unique, évitant ainsi de dupliquer `new URLSearchParams(...)`
// partout dans le projet.
//
// 🔧 Fonctionnalité :
// - `getParamsAndReviews()` :
//   → Retourne un objet contenant :
//      • `params` : une instance de `URLSearchParams`
//      • `reviews` : tableau vide (placeholder hérité d'une version antérieure)
//
// 📝 Remarque : la lecture des avis (`reviews`) a été retirée de l’URL,
// mais le tableau est laissé vide pour compatibilité éventuelle.
//
// ✅ Bon point d’entrée pour des traitements liés aux paramètres de recherche.
// =============================================================


export function getParamsAndReviews() {
    const params = new URLSearchParams(window.location.search);
    return { params, reviews: [] }; // on ne lit plus les reviews dans l'URL
}
    