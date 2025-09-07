// ===== Hotel Data =====
const hotels = [
  {
    name: "Taj Palace",
    location: "Mumbai",
    price: 15000,
    rating: 5,
    facilities: "Free Wi-Fi, Swimming Pool, Spa, Gym, Restaurant",
    image: "tajpalace.png"
  },
  {
    name: "Hotel Patna Inn",
    location: "Patna",
    price: 5000,
    rating: 4,
    facilities: "Free Breakfast, Wi-Fi, Parking, AC Rooms",
    image: "hotelpatnainn.png"
  },
  {
    name: "Delhi Grand",
    location: "Delhi",
    price: 12000,
    rating: 4,
    facilities: "Gym, Restaurant, Pool, Wi-Fi, Parking",
    image: "delhigrnad.png"
  },
  {
    name: "Hyderabad Stay",
    location: "Hyderabad",
    price: 8000,
    rating: 3,
    facilities: "Wi-Fi, Parking, Restaurant, AC Rooms",
    image: "hydrabadstay.png"
  },
  {
    name: "Budget Inn",
    location: "Delhi",
    price: 2000,
    rating: 2,
    facilities: "Wi-Fi, Parking",
    image: "delhiinn.png"
  }
];

// ===== Select DOM Elements =====
const locationSelect = document.getElementById("location");
const priceButtons = document.querySelectorAll(".price-buttons button");
const ratingSelect = document.getElementById("rating");
const priceCheckbox = document.getElementById("price-checkbox");
const searchBtn = document.getElementById("search-btn");
const hotelsContainer = document.getElementById("hotels-container");

let selectedPriceRange = null;

// ===== Price Buttons Logic =====
priceButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    priceButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedPriceRange = btn.getAttribute("data-range").split("-").map(Number);
  });
});

// ===== Search Function =====
function searchHotels() {
  const location = locationSelect.value;
  const rating = Number(ratingSelect.value);
  const usePrice = priceCheckbox.checked;

  let filteredHotels = hotels.filter(hotel => {
    let match = true;

    // Filter by location
    if(location && hotel.location !== location) match = false;

    // Filter by rating
    if(rating && hotel.rating < rating) match = false;

    // Filter by price if enabled
    if(usePrice && selectedPriceRange) {
      const [min, max] = selectedPriceRange;
      if(hotel.price < min || hotel.price > max) match = false;
    }

    return match;
  });

  displayHotels(filteredHotels);
}

// ===== Display Hotels =====
function displayHotels(list) {
  hotelsContainer.innerHTML = "";

  if(list.length === 0) {
    hotelsContainer.innerHTML = "<p style='text-align:center;'>No hotels found for selected filters.</p>";
    return;
  }

  list.forEach(hotel => {
    const card = document.createElement("div");
    card.classList.add("hotel-card");

    card.innerHTML = `
      <img src="${hotel.image}" alt="${hotel.name}">
      <div class="hotel-info">
        <h3>${hotel.name}</h3>
        <p><strong>Location:</strong> ${hotel.location}</p>
        <p><strong>Price:</strong> ₹${hotel.price.toLocaleString()}</p>
        <p><strong>Rating:</strong> <span class="rating">${"★".repeat(hotel.rating)}</span></p>
        <p><strong>Facilities:</strong> ${hotel.facilities}</p>
      </div>
    `;

    hotelsContainer.appendChild(card);
  });
}

// ===== Event Listener =====
searchBtn.addEventListener("click", searchHotels);

// ===== Initial Display =====
displayHotels(hotels);
