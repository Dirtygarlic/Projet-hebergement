// Initialisation du calendrier
flatpickr("#date-range", {
    mode: "range",
    dateFormat: "d/m/Y",
    locale: "fr"
});

// Suggestions pour le champ de lieu
function suggestLocations(value) {
    const suggestions = document.getElementById("suggestions");
    suggestions.innerHTML = ""; // Efface les suggestions existantes

    if (value.length >= 3) {
        const mockLocations = ["Paris", "New York", "Tokyo", "Berlin", "Rome"]; // Exemples
        const matches = mockLocations.filter((location) =>
            location.toLowerCase().startsWith(value.toLowerCase())
        );

        matches.forEach((match) => {
            const li = document.createElement("li");
            li.textContent = match;
            li.addEventListener("click", () => {
                document.getElementById("location").value = match;
                suggestions.innerHTML = "";
            });
            suggestions.appendChild(li);
        });
    }
}

// Fonction de recherche
function search() {
    const location = document.getElementById("location").value;
    const dateRange = document.getElementById("date-range").value;
    const adults = document.getElementById("adults").value;
    const children = document.getElementById("children").value;

    if (!location || !dateRange || !adults) {
        alert("Veuillez remplir tous les champs avant de rechercher !");
    } else {
        alert(`Recherche effectuée pour : 
        - Destination : ${location}
        - Dates : ${dateRange}
        - Adultes : ${adults}
        - Enfants : ${children}`);
    }
}
