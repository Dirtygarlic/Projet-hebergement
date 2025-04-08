export async function createStripeSession(data) {
    try {
        console.log("💳 Données envoyées à Stripe :", data);

        const response = await fetch("/create-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status} : ${response.statusText}`);
        }

        const session = await response.json();

        if (session.url) {
            const payBtn = document.getElementById("pay-button");
            payBtn.disabled = true;
            payBtn.textContent = "Redirection en cours...";
            setTimeout(() => {
                window.open(session.url, "_self");
            }, 100);
        } else {
            alert("❌ Erreur de session Stripe (pas d’URL)");
        }

    } catch (error) {
        console.error("❌ Erreur Stripe :", error);
        alert("❌ Impossible de créer une session Stripe.\n" + error.message);
    }
}
