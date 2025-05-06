// =============================================================
// 📁 hotelGlobalFilters.js
// -------------------------------------------------------------
// Ce fichier contient une fonction utilitaire qui extrait et
// structure les filtres globaux saisis par l'utilisateur dans
// le formulaire de recherche principale de la page d’accueil.
//
// 🎯 Objectif :
// Récupérer les valeurs saisies dans les champs du formulaire
// de recherche globale (destination, dates, voyageurs, animaux…)
// et les retourner sous forme d’un objet prêt à envoyer à l’API.
//
// 🔧 Fonctionnalité :
// - `getGlobalFiltersFromForm()` :
//   → Récupère la destination dans le champ `#city`
//   → Récupère les dates dans le champ `#date-range` (format "dd/mm/yyyy au dd/mm/yyyy")
//   → Convertit les adultes / enfants en entiers
//   → Indique si l’option "animaux admis" est cochée (`1` ou `0`)
//   → Retourne un objet structuré :
//     {
//       destination: "Nice",
//       start_date: "2025-05-10",
//       end_date: "2025-05-14",
//       adults: 2,
//       children: 1,
//       pets: 1
//     }
//
// 🧩 Utilisé dans :
// - `hotel.js` et autres fichiers de gestion de recherche
//   pour envoyer des filtres globaux vers l’API `/recherche`.
//
// ⚠️ Remarque : si le champ `#date-range` n’est pas bien formaté,
// les `start_date` et `end_date` seront `null`.
// =============================================================


export function getGlobalFiltersFromForm() {
    const dateRange = document.getElementById("date-range").value.trim().split(" au ");
    return {
        destination: document.getElementById("city").value.trim(),
        start_date: dateRange.length === 2 ? dateRange[0] : null,
        end_date: dateRange.length === 2 ? dateRange[1] : null,
        adults: parseInt(document.getElementById("adults").value, 10),
        children: parseInt(document.getElementById("children").value, 10),
        pets: document.getElementById("pets").checked ? 1 : 0
    };
}
