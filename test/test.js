import { getAllData } from '../db/db.js'
 
/* ------------------------------------------------------------------
   1. FIELD NAMES - edit these to match your Firestore "Flights" fields.
   The first name that exists on a flight is used.
------------------------------------------------------------------- */
const FIELDS = {
  airline:  ['airline', 'airlineName'],
  flightNo: ['flightNumber', 'flightNo', 'number'],
  aircraft: ['aircraft', 'plane'],
  from:     ['from', 'origin', 'departureAirport', 'departure'],
  to:       ['to', 'destination', 'arrivalAirport', 'arrival'],
  depart:   ['departTime', 'departureTime', 'depart'],
  arrive:   ['arriveTime', 'arrivalTime', 'arrive'],
  duration: ['duration'],
  price:    ['price'],
  seats:    ['seats', 'seatsLeft', 'availableSeats'],
  date:     ['date', 'departureDate'],
}
 
const val = (flight, key, fallback = '') => {
  for (const name of FIELDS[key]) {
    if (flight[name] !== undefined && flight[name] !== null) return flight[name]
  }
  return fallback
}
 
/* ------------------------------------------------------------------
   2. Helpers
------------------------------------------------------------------- */
const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
 
// Works for plain text ("08:30") and Firestore Timestamps
const fmtTime = (v) => {
  if (v && typeof v.toDate === 'function') {
    return v.toDate().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }
  return String(v)
}
 
const money = (n) => 'R ' + Number(n).toLocaleString('en-ZA')
const priceOf = (f) => Number(val(f, 'price', 0))
const logoColors = ['blue-logo', 'orange-logo', 'dark-logo', 'purple-logo']
 
// "Johannesburg (JNB)" -> { text: "johannesburg (jnb)", code: "jnb" }
const parseAirport = (input) => {
  const text = input.trim().toLowerCase()
  const m = text.match(/\(([a-z]{3})\)/)
  return { text, code: m ? m[1] : text }
}
const matches = (flightValue, wanted) => {
  if (!wanted.text) return true
  const v = String(flightValue).toLowerCase()
  return v.includes(wanted.code) || wanted.text.includes(v) || v.includes(wanted.text)
}
 
/* ------------------------------------------------------------------
   3. Show flights on the page
------------------------------------------------------------------- */
const list = document.querySelector('.flight-list')
const countEl = document.querySelector('.results-count')
let allFlights = []
 
function cardHTML(f, i) {
  const name = String(val(f, 'airline', 'Airline'))
  const from = String(val(f, 'from'))
  const to = String(val(f, 'to'))
  const seats = val(f, 'seats', '')
  return `
  <article class="flight-card ${i === 0 ? 'featured' : ''}">
    <div class="airline-block">
      <div class="airline-logo ${logoColors[i % logoColors.length]}">${esc(name.slice(0, 2).toUpperCase())}</div>
      <div><strong>${esc(name)}</strong><small>${esc(val(f, 'flightNo'))} · ${esc(val(f, 'aircraft'))}</small></div>
    </div>
    <div class="route-block">
      <div class="airport"><strong>${esc(fmtTime(val(f, 'depart')))}</strong><b>${esc(from)}</b></div>
      <div class="route-line"><span>${esc(val(f, 'duration'))}</span>
        <div><i></i><hr><span class="material-symbols-rounded">flight</span><hr><i></i></div>
        <small>Non-stop</small></div>
      <div class="airport"><strong>${esc(fmtTime(val(f, 'arrive')))}</strong><b>${esc(to)}</b></div>
    </div>
    <div class="flight-price">
      ${seats !== '' ? `<span class="seat-status"><i></i> ${esc(seats)} seats left</span>` : ''}
      <small>From</small><strong>${money(priceOf(f))}</strong>
      <button class="${i === 0 ? 'primary-button' : 'outline-button'} small" type="button" data-id="${esc(f.id)}">Select flight</button>
    </div>
  </article>`
}
 
function render(flights) {
  countEl.textContent = `${flights.length} flight${flights.length === 1 ? '' : 's'} found`
  list.innerHTML = flights.length
    ? flights.map(cardHTML).join('')
    : '<p class="demo-note">No flights match your search. Try different airports.</p>'
}
 
// Select flight -> remember it and go to the booking page
list.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-id]')
  if (!btn) return
  const flight = allFlights.find((f) => f.id === btn.dataset.id)
  try { localStorage.setItem('selectedFlight', JSON.stringify(flight)) } catch (_) {}
  window.location.href = 'Booking.html'
})
 
/* ------------------------------------------------------------------
   4. Search + sort
------------------------------------------------------------------- */
const form = document.querySelector('.search-form')
const sortSelect = document.querySelector('.sort-label select')
 
function applyFilters() {
  const [dep, arr] = form.querySelectorAll('input[type="text"]')
  const depDate = form.querySelector('input[type="date"]').value
  const from = parseAirport(dep.value)
  const to = parseAirport(arr.value)
 
  let result = allFlights.filter((f) => {
    const okRoute = matches(val(f, 'from'), from) && matches(val(f, 'to'), to)
    const flightDate = val(f, 'date')
    const okDate = !depDate || !flightDate || String(flightDate).startsWith(depDate)
    return okRoute && okDate
  })
 
  if (sortSelect.value === 'Lowest price') result.sort((a, b) => priceOf(a) - priceOf(b))
  if (sortSelect.value === 'Earliest departure')
    result.sort((a, b) => fmtTime(val(a, 'depart')).localeCompare(fmtTime(val(b, 'depart'))))
 
  render(result)
}
 
form.addEventListener('submit', (e) => { e.preventDefault(); applyFilters(); document.getElementById('available-flights').scrollIntoView({ behavior: 'smooth' }) })
sortSelect.addEventListener('change', applyFilters)
 
/* ------------------------------------------------------------------
   5. Trip tabs (one-way hides the return date)
------------------------------------------------------------------- */
const tabs = document.querySelectorAll('.trip-tabs .tab')
const returnInput = form.querySelectorAll('input[type="date"]')[1]
tabs.forEach((tab) => tab.addEventListener('click', () => {
  tabs.forEach((t) => t.classList.remove('active'))
  tab.classList.add('active')
  const oneWay = tab.textContent.trim() === 'One-way'
  returnInput.disabled = oneWay
  returnInput.closest('.field').style.opacity = oneWay ? '0.45' : '1'
}))
 
/* ------------------------------------------------------------------
   6. Live clock
------------------------------------------------------------------- */
const clock = document.querySelector('.station-time strong')
const tick = () => {
  if (!clock) return
  clock.textContent = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Johannesburg', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date()) + ' SAST'
}
tick(); setInterval(tick, 1000)
 
/* ------------------------------------------------------------------
   7. Load from Firebase
------------------------------------------------------------------- */
list.innerHTML = '<p class="demo-note">Loading flights...</p>'
try {
  allFlights = await getAllData('Flights')
  console.log('Flights from Firebase:', allFlights) // check field names here
  render(allFlights)
} catch (err) {
  console.error(err)
  list.innerHTML = '<p class="demo-note">Could not load flights. Check the console for details.</p>'
}