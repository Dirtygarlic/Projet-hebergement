export function loadHotelName(hotelId) {
    fetch(`/get_hotel_name?hotel_id=${hotelId}`)
      .then(res => res.json())
      .then(res => {
        document.getElementById("hotel-name").textContent = res.name || "Nom introuvable";
      })
      .catch(() => {
        document.getElementById("hotel-name").textContent = "Erreur de chargement";
      });
  }
  