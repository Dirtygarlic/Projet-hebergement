// ============================
// 📅 datePickerValidator.js
// ============================

export function setupCheckinCheckoutValidation() {
    const checkinInput = document.getElementById("checkin");
    const checkoutInput = document.getElementById("checkout");
    const checkoutWarning = document.getElementById("checkout-warning");

    if (!checkinInput || !checkoutInput || !checkoutWarning) return;

    checkinInput.addEventListener("change", () => {
        const checkinDate = new Date(checkinInput.value);
        if (isNaN(checkinDate.getTime())) return;

        const nextDay = new Date(checkinDate);
        nextDay.setDate(checkinDate.getDate() + 1);
        const formatted = nextDay.toISOString().split("T")[0];

        checkoutInput.min = formatted;

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
