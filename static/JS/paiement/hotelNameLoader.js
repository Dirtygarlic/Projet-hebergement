// =============================================================
// 📁 hotelNameLoader.js
// -------------------------------------------------------------
// Ce fichier contient une fonction utilitaire pour récupérer
// dynamiquement le nom d’un hôtel à partir de son `hotel_id`,
// en appelant une API backend, puis en l’affichant dans la page.
//
// 🎯 Objectif :
// Afficher le nom de l’hôtel correspondant à l’ID donné, sans
// avoir besoin de le stocker ou de le passer via l’URL.
//
// 🔧 Fonction :
// - `loadHotelName(hotelId)`
//   → Envoie une requête GET vers `/get_hotel_name?hotel_id=...`
//   → Attend une réponse de type `{ name: "Nom de l’hôtel" }`
//   → Met à jour dynamiquement le contenu de l’élément HTML avec l’ID `#hotel-name`
//   → En cas d’erreur : affiche "Erreur de chargement"
//
// 🧩 Utilisé dans :
// - Les pages comme `paiement.html` où seul l’ID hôtel est disponible,
//   mais on veut afficher son nom sans le passer dans l’URL.
//
// ✅ Avantages :
// - Évite de surcharger l’URL avec trop de données
// - Permet d’afficher les informations de l’hôtel au bon moment
// - Code simple, réutilisable, facile à intégrer
//
// 📦 Dépendance HTML :
// - Un élément ayant l’ID `hotel-name` doit être présent dans la page
//
// ⚠️ Le back-end doit répondre avec `{ name: "...", ... }` pour que cela fonctionne correctement.
// =============================================================


export function loadHotelName(hotelId) {
    fetch(`/get_hotel_name?hotel_id=${hotelId}`)
      .then(res => res.json())
      .then(res => {
        document.getElementById("hotel-name").textContent = res.name || "Nom introuvable";
      })
      .catch(() => {
        document.getElementById("hotel-name").textContent = "Erreur de chargement";
      });
  }
  