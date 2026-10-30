import { auth } from '../config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import { getAllData } from '../db/db.js';
 
const listEl = document.getElementById('flight-list');
const countEl = document.getElementById('results-count');
const sortEl = document.getElementById('sort-flights');
const formEl = document.getElementById('search-form');
const fromEl = document.getElementById('from-input');
const toEl = document.getElementById('to-input');
 
const LOGO_COLORS = ['blue-logo', 'orange-logo', 'dark-logo', 'purple-logo'];
 
let allFlights = [];
let visibleFlights = [];
 
// Prevents data from breaking the HTML
function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
 
function initials(company) {
  const words = String(company || '?').trim().split(/\s+/);
  return (words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2)).toUpperCase();
}
 
function formatPrice(price) {
  const n = Number(price);
  return Number.isFinite(n) ? 'R ' + n.toLocaleString('en-US') : 'N/A';
}
 
function seats(flight) {
  const n = Number(flight.AvailableSeats);
  return Number.isFinite(n) ? n : 0;
}
 
function flightCard(flight, index) {
  const featured = index === 0;
  const buttonClass = featured ? 'primary-button' : 'outline-button';
  const seatCount = seats(flight);
 
  return `
    <article class="flight-card ${featured ? 'featured' : ''}">
      <div class="airline-block">
        <div class="airline-logo ${LOGO_COLORS[index % LOGO_COLORS.length]}">${esc(initials(flight.Company))}</div>
        <div><strong>${esc(flight.Company)}</strong><small>${esc(flight.FlightID)}</small></div>
      </div>
      <div class="route-block">
        <div class="airport"><strong>${esc(flight.Departure)}</strong><small>Departure</small></div>
        <div class="route-line">
          <span>${esc(flight.FlightID)}</span>
          <div><i></i><hr><span class="material-symbols-rounded">flight</span><hr><i></i></div>
        </div>
        <div class="airport"><strong>${esc(flight.Destination)}</strong><small>Destination</small></div>
      </div>
      <div class="flight-price">
        <span class="seat-status"><i></i> ${seatCount} seats left</span>
        <small>From</small>
        <strong>${formatPrice(flight.Price)}</strong>
        <button class="${buttonClass} small" type="button" data-id="${esc(flight.id)}"
                ${seatCount === 0 ? 'disabled' : ''}>${seatCount === 0 ? 'Sold out' : 'Select flight'}</button>
      </div>
    </article>`;
}
 
function render() {
  countEl.textContent = `${visibleFlights.length} flight${visibleFlights.length === 1 ? '' : 's'} found`;
 
  if (visibleFlights.length === 0) {
    listEl.innerHTML = '<p class="demo-note">No flights found for this route.</p>';
    return;
  }
  listEl.innerHTML = visibleFlights.map(flightCard).join('');
}
 
function applySort() {
  const mode = sortEl.value;
  if (mode === 'Lowest price') {
    visibleFlights.sort((a, b) => Number(a.Price) - Number(b.Price));
  } else if (mode === 'Most seats available') {
    visibleFlights.sort((a, b) => seats(b) - seats(a));
  }
  // "Recommended" keeps the order from Firestore
}
 
// "Johannesburg (JNB)" -> "johannesburg"
function clean(text) {
  return text.replace(/\(.*?\)/g, '').trim().toLowerCase();
}
 
function applyFilters() {
  const from = clean(fromEl.value);
  const to = clean(toEl.value);
 
  visibleFlights = allFlights.filter(f =>
    (!from || String(f.Departure).toLowerCase().includes(from)) &&
    (!to || String(f.Destination).toLowerCase().includes(to))
  );
  applySort();
  render();
}
 
async function loadFlights() {
  listEl.innerHTML = '<p class="demo-note">Loading flights...</p>';
  try {
    allFlights = await getAllData('Flights');
    applyFilters();
  } catch (error) {
    console.error('Could not load flights:', error);
    countEl.textContent = '0 flights found';
    listEl.innerHTML = '<p class="demo-note">Could not load flights. Check the console and your Firestore rules.</p>';
  }
}
 
formEl.addEventListener('submit', (e) => {
  e.preventDefault();
  applyFilters();
  document.getElementById('available-flights').scrollIntoView({ behavior: 'smooth' });
});
 
sortEl.addEventListener('change', () => {
  applySort();
  render();
});
 
// Remember which flight was picked and move on to booking
listEl.addEventListener('click', (e) => {
  const button = e.target.closest('button[data-id]');
  if (!button) return;
  window.location.href = '../Booking.html?id=' + encodeURIComponent(button.dataset.id);
});
 
/* ---------- logged-in user in the header ---------- */
 
function fillProfile(user) {
  const avatar = document.querySelector('.profile .avatar');
  const nameEl = document.querySelector('.profile b');
  const subEl = document.querySelector('.profile small');
  if (!avatar || !nameEl || !subEl) return;
 
  if (!user) {
    avatar.textContent = '?';
    nameEl.textContent = 'Guest';
    subEl.textContent = 'Not signed in';
    return;
  }
 
  const emailName = (user.email || '').split('@')[0];
  const name = user.displayName || emailName || 'Guest';
  const initials = name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';
 
  avatar.textContent = initials;
  nameEl.textContent = name;
  subEl.textContent = user.email || '';
}
 
onAuthStateChanged(auth, fillProfile);
 
loadFlights();
 
/* ---------- live station time (SAST) ---------- */
 
const stationTimeEl = document.querySelector('.station-time strong');
 
if (stationTimeEl) {
  const stationFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Johannesburg',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
 
  function updateStationTime() {
    stationTimeEl.textContent = stationFormatter.format(new Date()) + ' SAST';
  }
 
  updateStationTime();
  // Update at the start of every minute so it never drifts
  setTimeout(() => {
    updateStationTime();
    setInterval(updateStationTime, 60000);
  }, 60000 - (Date.now() % 60000));
}