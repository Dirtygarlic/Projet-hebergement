// ============================
// ⭐ reviewManager.js
// ============================

let currentPage = 1;
const reviewsPerPage = 10;

/**
 * Affiche les avis dans le conteneur HTML avec pagination et tri
 * @param {Array} reviews 
 */
export function displayReviews(reviews) {
    const reviewsContainer = document.getElementById("reviews-list");
    let paginationContainer = document.querySelector(".review-pagination");
    let filtersContainer = document.querySelector(".review-filters");

    if (!reviewsContainer) {
        console.error("❌ Élément #reviews-list introuvable.");
        return;
    }

    reviewsContainer.innerHTML = "";

    if (!paginationContainer) {
        paginationContainer = document.createElement("div");
        paginationContainer.classList.add("review-pagination");
        document.querySelector(".reviews-section")?.appendChild(paginationContainer);
    } else {
        paginationContainer.innerHTML = "";
    }

    if (!filtersContainer) {
        filtersContainer = document.createElement("div");
        filtersContainer.classList.add("review-filters");
        document.querySelector(".reviews-section")?.insertBefore(filtersContainer, reviewsContainer);
        filtersContainer.innerHTML = `
            <button id="sort-by-date">📅 Trier par date</button>
            <button id="sort-by-rating">⭐ Trier par note</button>
            <button id="sort-by-name">🔤 Trier par nom</button>
        `;
    }

    if (reviews.length === 0) {
        reviewsContainer.innerHTML = "<p>Aucun avis pour le moment.</p>";
        return;
    }

    const start = (currentPage - 1) * reviewsPerPage;
    const end = start + reviewsPerPage;
    const reviewsToDisplay = reviews.slice(start, end);

    const grid = document.createElement("div");
    grid.classList.add("review-grid");

    reviewsToDisplay.forEach((review) => {
        const item = document.createElement("div");
        item.className = "review-item";
        item.innerHTML = `
            <div class="review-header">
                <strong>${review.first_name} ${review.name || ""}</strong> - ${formatDate(review.date_posted)} 
                <span class="review-rating">⭐ ${review.rating} / 10</span>
            </div>
            <p class="review-comment">${review.comment}</p>
            <hr>
        `;
        grid.appendChild(item);
    });

    reviewsContainer.appendChild(grid);

    const totalPages = Math.ceil(reviews.length / reviewsPerPage);
    if (totalPages > 1) {
        for (let i = 1; i <= totalPages; i++) {
            const button = document.createElement("button");
            button.textContent = i;
            if (currentPage === i) button.classList.add("active");
            button.addEventListener("click", () => {
                currentPage = i;
                displayReviews(reviews);
            });
            paginationContainer.appendChild(button);
        }
    }

    setupSortButtons(reviews);
}


/**
 * Trie les avis selon un critère donné et met à jour l'affichage
 * @param {Array} reviews 
 * @param {string} criterion 
 */
export function sortReviews(reviews, criterion) {
    if (criterion === "date") {
        reviews.sort((a, b) => new Date(b.date_posted) - new Date(a.date_posted));
    } else if (criterion === "rating") {
        reviews.sort((a, b) => b.rating - a.rating);
    } else if (criterion === "name") {
        reviews.sort((a, b) => a.first_name.localeCompare(b.first_name));
    }
    currentPage = 1;
    displayReviews(reviews);
}


/**
 * Active les boutons de tri pour relancer `sortReviews`
 * @param {Array} reviews 
 */
function setupSortButtons(reviews) {
    document.getElementById("sort-by-date")?.addEventListener("click", () => sortReviews(reviews, "date"));
    document.getElementById("sort-by-rating")?.addEventListener("click", () => sortReviews(reviews, "rating"));
    document.getElementById("sort-by-name")?.addEventListener("click", () => sortReviews(reviews, "name"));
}


/**
 * Formatte une date pour affichage en français
 * @param {string} dateString 
 * @returns {string}
 */
function formatDate(dateString) {
    if (!dateString) return "Date inconnue";

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        dateString += "T00:00:00Z";
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Date inconnue";

    return date.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
}
