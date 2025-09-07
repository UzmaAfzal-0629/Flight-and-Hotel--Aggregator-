// ====== CONFIG ======
const API_KEY = "wktQZ4o5nnym7uSUmcB6EKjyQsT18hzp";
const API_SECRET = "Dbx4QKWvy22sPZNh";
let accessToken = null;

// ====== HELPERS ======
const $ = (sel) => document.querySelector(sel);

const currencyFmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

function formatDuration(d) {
  return d.replace("PT", "").replace("H", "h ").replace("M", "m");
}

function debounce(fn, ms = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// ====== AUTH ======
async function getAccessToken() {
  if (accessToken) return accessToken;

  const res = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=client_credentials&client_id=${API_KEY}&client_secret=${API_SECRET}`
  });
  const data = await res.json();
  accessToken = data.access_token;
  return accessToken;
}

// ====== AUTOCOMPLETE ======
async function fetchLocations(query) {
  if (!query || query.length < 2) return [];
  const token = await getAccessToken();
  const url = new URL("https://test.api.amadeus.com/v1/reference-data/locations");
  url.searchParams.set("subType", "CITY,AIRPORT");
  url.searchParams.set("keyword", query);

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  return data.data || [];
}

function setupAutocomplete(inputEl, listEl) {
  const renderList = (items) => {
    listEl.innerHTML = "";
    if (!items.length) {
      listEl.style.display = "none";
      return;
    }
    items.forEach((loc) => {
      const li = document.createElement("li");
      li.textContent = `${loc.name} (${loc.iataCode}) – ${loc.address?.cityName || ""}`;
      li.dataset.code = loc.iataCode;
      li.addEventListener("click", () => {
        inputEl.value = `${loc.name} (${loc.iataCode})`;
        inputEl.dataset.code = loc.iataCode;
        listEl.style.display = "none";
      });
      listEl.appendChild(li);
    });
    listEl.style.display = "block";
  };

  const onType = debounce(async () => {
    try {
      const items = await fetchLocations(inputEl.value.trim());
      renderList(items);
    } catch (e) {
      console.error(e);
      listEl.style.display = "none";
    }
  }, 300);

  inputEl.addEventListener("input", () => {
    delete inputEl.dataset.code; // clear code if user types manually
    onType();
  });

  inputEl.addEventListener("focus", () => {
    if (listEl.children.length) listEl.style.display = "block";
  });

  document.addEventListener("click", (e) => {
    if (!listEl.contains(e.target) && e.target !== inputEl) listEl.style.display = "none";
  });
}

// ====== FLIGHT SEARCH ======
async function searchFlights(params) {
  const token = await getAccessToken();
  const url = new URL("https://test.api.amadeus.com/v2/shopping/flight-offers");
  url.searchParams.set("originLocationCode", params.from);
  url.searchParams.set("destinationLocationCode", params.to);
  url.searchParams.set("departureDate", params.depart);
  url.searchParams.set("adults", params.adults || 1);
  if (params.returnDate) url.searchParams.set("returnDate", params.returnDate);
  url.searchParams.set("currencyCode", "INR");
  url.searchParams.set("travelClass", params.cabin || "ECONOMY");

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Flight search failed");
  return res.json();
}

// ====== RENDER RESULTS ======
function renderResults(data, originCode, destCode) {
  const resultsEl = $("#results");
  const statusEl = $("#status");
  resultsEl.innerHTML = "";

  const flights = (data && data.data) || [];

  // Filter only exact origin → destination
  const filteredFlights = flights.filter(f => {
    const firstSeg = f.itineraries[0].segments[0];
    return firstSeg.departure.iataCode === originCode && firstSeg.arrival.iataCode === destCode;
  });

  if (!filteredFlights.length) {
    statusEl.textContent = "No flights found for selected route. Try changing filters.";
    return;
  }

  statusEl.textContent = `Found ${filteredFlights.length} flight${filteredFlights.length > 1 ? "s" : ""}.`;
  const tpl = $("#resultCardTpl");

  filteredFlights.forEach((f) => {
    const node = tpl.content.firstElementChild.cloneNode(true);
    const firstSeg = f.itineraries[0].segments[0];

    node.querySelector(".airline").textContent = firstSeg.carrierCode || "Airline";
    node.querySelector(".route").textContent = `${firstSeg.departure.iataCode} → ${firstSeg.arrival.iataCode}`;
    node.querySelector(".times").textContent = `${firstSeg.departure.at} → ${firstSeg.arrival.at}`;
    node.querySelector(".meta").textContent = `Duration: ${formatDuration(f.itineraries[0].duration)}`;
    node.querySelector(".price").textContent = currencyFmt(f.price.total);

    resultsEl.appendChild(node);
  });
}

// ====== INIT ======
(function init() {
  const todayISO = new Date().toISOString().slice(0, 10);
  $("#depart").setAttribute("min", todayISO);
  $("#return").setAttribute("min", todayISO);

  setupAutocomplete($("#origin"), $("#originList"));
  setupAutocomplete($("#destination"), $("#destinationList"));

  $("#searchForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const statusEl = $("#status");
    const resultsEl = $("#results");
    statusEl.textContent = "Searching flights…";
    resultsEl.innerHTML = "";

    const originCode = $("#origin").dataset.code;
    const destCode = $("#destination").dataset.code;

    if (!originCode || !destCode) {
      statusEl.textContent = "Please select origin and destination from suggestions.";
      return;
    }

    const params = {
      from: originCode,
      to: destCode,
      depart: $("#depart").value,
      returnDate: $("#return").value || null,
      adults: parseInt($("#adults").value || "1", 10),
      cabin: $("#cabin").value
    };

    try {
      const data = await searchFlights(params);
      renderResults(data, originCode, destCode);
    } catch (err) {
      console.error(err);
      statusEl.textContent = "Error fetching flights. Try again.";
    }
  });
})();
