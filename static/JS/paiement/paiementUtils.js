export async function getPricePerNight(hotelId) {
    const response = await fetch(`/get_price_per_night/${hotelId}`);
    const data = await response.json();
    return data.price_per_night || 100;
}

export function calculateNumberOfNights(checkin, checkout) {
    const date1 = new Date(checkin);
    const date2 = new Date(checkout);
    const diffTime = date2 - date1;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
