export function getParamsAndReviews() {
    const params = new URLSearchParams(window.location.search);
    const reviewsJSON = params.get("reviews");
    let reviews = [];

    try {
        reviews = reviewsJSON ? JSON.parse(decodeURIComponent(reviewsJSON)) : [];
    } catch (error) {
        console.error("❌ Erreur de parsing des avis :", error);
        reviews = [];
    }

    return { params, reviews };
}