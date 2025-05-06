// =============================================================
// 📁 reservationDateLogic.js
// -------------------------------------------------------------
// Ce fichier contient la fonction `setupDateValidation()` qui
// assure une logique de cohérence entre la date d’arrivée (check-in)
// et la date de départ (check-out) dans le formulaire de réservation.
//
// 🎯 Objectif :
// Empêcher l’utilisateur de sélectionner une date de départ
// antérieure ou égale à la date d’arrivée en fixant dynamiquement
// une date minimale valide pour le check-out.
//
// 🔧 Fonctionnalités :
// - Met à jour automatiquement la valeur minimale du champ `checkout`
//   dès que la date `checkin` est modifiée.
// - Affiche un message d’avertissement si la date `checkout` est invalide.
// - Cache le message si la date sélectionnée devient valide.
//
// ⚠️ Affiche un message de warning dans la console si les champs
//    requis ne sont pas trouvés dans le DOM.
//
// ❗ Remarque : Ce fichier a une logique très similaire à `datePickerValidator.js`,
//    il peut être utile à l’avenir de centraliser ou fusionner ces fonctions.
// =============================================================



// ============================
// 📅 reservationDateLogic.js
// ============================

export function setupDateValidation() {
    const checkinInput = document.getElementById("checkin");
    const checkoutInput = document.getElementById("checkout");
    const checkoutWarning = document.getElementById("checkout-warning");

    if (!checkinInput || !checkoutInput || !checkoutWarning) {
        console.warn("⚠️ Les champs date ou l'avertissement ne sont pas présents.");
        return;
    }

    checkinInput.addEventListener("change", () => {
        const checkinDate = new Date(checkinInput.value);
        if (isNaN(checkinDate.getTime())) return;

        const nextDay = new Date(checkinDate);
        nextDay.setDate(checkinDate.getDate() + 1);
        const formatted = nextDay.toISOString().split("T")[0];

        // Appliquer comme date minimale au checkout
        checkoutInput.min = formatted;

        // Si la date actuelle est invalide, la vider et afficher un avertissement
        if (checkoutInput.value && checkoutInput.value < formatted) {
            checkoutInput.value = "";
            checkoutWarning.style.display = "inline";
        } else {
            checkoutWarning.style.display = "none";
        }
    });

    checkoutInput.addEventListener("change", () => {
        if (checkoutInput.value >= checkoutInput.min) {
            checkoutWarning.style.display = "none";
        }
    });
}
