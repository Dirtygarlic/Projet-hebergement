export function displayReservationDetails(data, numberOfNights, totalPrice) {
    const {
        checkin, checkout, guests, adults, children,
        gender, firstName, userName, email, phone, imageUrl
    } = data;

    document.getElementById("checkin").textContent = checkin;
    document.getElementById("checkout").textContent = checkout;
    document.getElementById("guests").textContent = `${guests} (Ad: ${adults}, Enf: ${children})`;
    document.getElementById("number-of-nights").textContent = `${numberOfNights} nuit(s)`;
    document.getElementById("total-price").textContent = totalPrice.toFixed(2) + " €";
    document.getElementById("gender").textContent = gender;
    document.getElementById("first_name").textContent = firstName;
    document.getElementById("user_name").textContent = userName;
    document.getElementById("email").textContent = email;
    document.getElementById("phone").textContent = phone;

    const imageElement = document.getElementById("hotel-image");
    if (imageElement) {
        imageElement.src = imageUrl;
        imageElement.onerror = () => imageElement.src = "/static/Image/default.jpg";
    }
}
