// hotelReviews.js

export async function fetchHotelReviews(hotelId) {
    try {
        const response = await fetch(`/get_reviews?hotel_id=${hotelId}&sort_by=date`);
        if (!response.ok) throw new Error(`Erreur API : ${response.statusText}`);

        const reviews = await response.json();
        return JSON.stringify(reviews);  // Convertir en chaîne JSON pour l'URL
    } catch (error) {
        console.error("❌ Erreur lors du chargement des avis :", error);
        return "[]";  // Retourne un tableau vide en cas d'erreur
    }
}
