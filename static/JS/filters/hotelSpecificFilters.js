// Nouveau fichier : filters/specificFilters.js

export function getSpecificFilters() {
    const filters = {
        stars: [...document.querySelectorAll('input[name="stars"]:checked')].map(i => parseInt(i.value, 10)),
        max_price: parseInt(document.getElementById('maxPrice')?.value || "500", 10),
        max_rooms: parseInt(document.getElementById('maxRooms')?.value || "70", 10),
        hotel_name: document.getElementById('hotelName')?.value.trim() || null,
        city_name: document.getElementById('cityInput')?.value.trim() || null
    };

    const equipements = [
        "parking", "restaurant", "piscine", "pets_allowed",
        "washing_machine", "wheelchair_accessible", "gym", "spa",
        "free_wifi", "air_conditioning", "ev_charging", "kitchenette"
    ];
    equipements.forEach(equip => {
        filters[equip] = document.getElementById(equip)?.checked ? 1 : null;
    });

    const ratingCheckboxes = document.querySelectorAll('input[name="hotel_rating"]:checked');
    const hotelRatings = Array.from(ratingCheckboxes).map(input => parseFloat(input.value));
    if (hotelRatings.length > 0) {
        filters.hotel_rating = hotelRatings;
    }

    filters.meal_plan = Array.from(document.querySelectorAll('input[name="meal_plan"]:checked')).map(input => input.value);

    return filters;
}

