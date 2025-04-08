document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("newsletter-form");
    const emailInput = document.getElementById("newsletter-email");
    const messageDiv = document.getElementById("newsletter-message");

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = emailInput.value;

            try {
                const res = await fetch("/subscribe-newsletter", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email })
                });

                const data = await res.json();
                if (res.ok) {
                    messageDiv.textContent = "📩 Merci ! Un email de confirmation vous a été envoyé.";
                    emailInput.value = "";
                } else {
                    messageDiv.textContent = data.error || "❌ Une erreur est survenue.";
                }
            } catch (err) {
                console.error("Erreur d’inscription :", err);
                messageDiv.textContent = "❌ Une erreur est survenue.";
            }
        });
    }
});
