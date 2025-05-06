// =============================================================
// 📁 index.js
// -------------------------------------------------------------
// Ce fichier JavaScript est le point d'entrée principal de la
// page d’accueil (`index.html`) du site JustDreams.
//
// 🎯 Objectif :
// Gérer les interactions globales de la page d'accueil, notamment :
// - le déclenchement de la recherche globale,
// - la récupération des filtres utilisateur,
// - la redirection vers la page des hôtels (`hotel.html`) avec
//   les paramètres sélectionnés,
// - la gestion d'éléments dynamiques de l’interface (header, modale…).
//
// 🔧 Fonctionnalités possibles (selon implémentation) :
// - Lecture des champs de recherche (lieu, dates, nombre de voyageurs).
// - Construction dynamique d’une URL avec les critères de recherche.
// - Redirection propre vers la page des résultats.
// - Intégration éventuelle de l’autocomplétion ou du filtrage.
//
// 🧩 Dépendances :
// - Champs du formulaire global sur `index.html`.
// - Fichiers liés : `hotel.js`, `hotelAutoComplete.js`, `hotelGlobalFilters.js`, etc.
//
// 📦 Ce fichier agit comme un **pont** entre l’accueil et les pages
// de résultats, en transmettant proprement les choix de l’utilisateur.
//
// ✅ Il permet à l’expérience utilisateur de rester fluide
// et cohérente dès l’entrée sur le site.

/*
🧑‍💻 UTILISATEUR sur index.html
       |
       | Remplit le formulaire de recherche :
       | 📍 Destination   📅 Dates   👨‍👩‍👧‍👦 Voyageurs
       ↓
📦 index.js
       |
       | → Récupère les valeurs saisies dans le formulaire
       | → Vérifie les champs requis
       | → Construit une URL de redirection avec les paramètres :
       |     hotel.html?city=Paris&checkin=2025-05-10&checkout=2025-05-14&adults=2&children=1
       ↓
🔀 Redirection automatique
       vers :
🗺️ hotel.html
       |
       | → Les paramètres sont lus dans l’URL
       | → Les hôtels correspondants sont chargés et affichés
       | → La carte est initialisée avec les résultats filtrés
*/
// =============================================================



// 🍔 Ouvrir / Fermer le menu au clic
document.querySelector('.button-mobile').addEventListener('click', (e) => {
    e.stopPropagation(); // 👈 Empêche de fermer juste après ouverture
    document.querySelector('.button-bar').classList.toggle('open');
});

// 🔒 Fermer si on clique en dehors du menu ou du bouton
document.addEventListener('click', (e) => {
    const buttonBar = document.querySelector('.button-bar');
    const menuButton = document.querySelector('.button-mobile');
    
    if (!buttonBar.contains(e.target) && !menuButton.contains(e.target)) {
        buttonBar.classList.remove('open');
    }
});

// ⌨️ Fermer avec la touche Échap
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelector('.button-bar').classList.remove('open');
    }
});
