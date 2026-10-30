import { auth, db } from '../config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import {
  doc,
  getDoc,
  collection,
  runTransaction,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';
 
const $ = (id) => document.getElementById(id);
 
const flightDocId = new URLSearchParams(window.location.search).get('id');
let flight = null;
let currentUser = null;
 
/* ---------- helpers ---------- */
 
function money(value) {
  const n = Number(value);
  return Number.isFinite(n)
    ? 'R ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : 'N/A';
}
 
// Shows the text, or hides the element when there is no value
function setOptional(el, value, hideTarget = el) {
  if (value) {
    el.textContent = value;
    hideTarget.style.display = '';
  } else {
    hideTarget.style.display = 'none';
  }
}
 
function showProblem(title, message) {
  $('checkout-grid').innerHTML = `
    <div class="card">
      <h2>${title}</h2>
      <p class="card-subtitle" style="margin:8px 0 16px">${message}</p>
      <a href="#" id="back-link" class="link-inline">&larr; Back to available flights</a>
    </div>`;
  $('back-link').addEventListener('click', (e) => {
    e.preventDefault();
    history.back();
  });
}
 
function formMessage(text) {
  const el = $('form-message');
  el.textContent = text;
  el.style.display = text ? 'block' : 'none';
}
 
/* ---------- load the selected flight ---------- */
 
async function loadFlight() {
  if (!flightDocId) {
    showProblem('No flight selected', 'Please go back and choose a flight first.');
    return;
  }
  try {
    const snap = await getDoc(doc(db, 'Flights', flightDocId));
    if (!snap.exists()) {
      showProblem('Flight not found', 'This flight may have been removed. Please choose another one.');
      return;
    }
    flight = { id: snap.id, ...snap.data() };
    fillSummary();
  } catch (error) {
    console.error('Could not load flight:', error);
    showProblem('Could not load flight', 'Check your connection and your Firestore rules, then try again.');
  }
}
 
function fillSummary() {
  const route = `${flight.Departure} - ${flight.Destination}`;
 
  $('crumb-route').textContent = String(route).toUpperCase();
  $('flight-code').textContent = flight.FlightID ?? '';
  $('cabin-label').textContent = 'OPERATED BY: ' + String(flight.Company ?? '').toUpperCase();
 
  $('dep-city').textContent = flight.Departure ?? '';
  $('dest-city').textContent = flight.Destination ?? '';
 
  // Optional fields: shown only if they exist on the Firestore document
  setOptional($('dep-time'), flight.DepartTime);
  setOptional($('arr-time'), flight.ArriveTime);
  setOptional($('duration'), flight.Duration);
  setOptional($('meta-date'), flight.Date, $('box-date'));
  setOptional($('meta-aircraft'), flight.Aircraft, $('box-aircraft'));
  if (!flight.Date && !flight.Aircraft) $('meta-grid').style.display = 'none';
 
  $('base-fare').textContent = money(flight.Price);
  $('total-price').textContent = money(flight.Price);
 
  document.title = `AeroLink - Book ${flight.FlightID ?? 'flight'}`;
}
 
/* ---------- logged-in user ---------- */
 
async function fillProfile(user) {
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
 
  // Fallback name, used if the user has no saved profile
  let name = user.displayName || (user.email || '').split('@')[0] || 'Guest';
 
  // Read the real name saved at sign-up
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists()) {
      const d = snap.data();
      const full = d.name || [d.firstName, d.lastName].filter(Boolean).join(' ');
      if (full) name = full;
    }
  } catch (error) {
    console.error('Could not load profile:', error);
  }
 
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
 
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user && !$('email').value) $('email').value = user.email || '';
  fillProfile(user);
});
 
/* ---------- green tick only when a field is filled ---------- */
 
['first-name', 'last-name'].forEach((id) => {
  const input = $(id);
  const icon = input.parentElement.querySelector('.input-status-icon');
  const update = () => { icon.style.display = input.value.trim() ? '' : 'none'; };
  input.addEventListener('input', update);
  update();
});
 
/* ---------- confirm booking ---------- */
 
async function createBooking() {
  const flightRef = doc(db, 'Flights', flight.id);
  const bookingRef = doc(collection(db, 'Bookings'));
  const reference = 'AL-' + bookingRef.id.slice(0, 6).toUpperCase();
 
  const passenger = {
    firstName: $('first-name').value.trim(),
    lastName: $('last-name').value.trim(),
    email: $('email').value.trim(),
    phone: $('phone').value.trim(),
    passportNumber: $('passport').value.trim()
  };
 
  // Transaction: check seats and book in one step, so two people can't take the last seat
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(flightRef);
    if (!snap.exists()) throw new Error('This flight no longer exists.');
 
    const f = snap.data();
    const seats = Number(f.AvailableSeats);
    if (!(seats >= 1)) throw new Error('Sorry, this flight is sold out.');
 
    tx.update(flightRef, { AvailableSeats: seats - 1 });
    tx.set(bookingRef, {
      reference,
      userId: currentUser.uid,
      userEmail: currentUser.email,
      flightDocId: flight.id,
      flightId: f.FlightID ?? '',
      company: f.Company ?? '',
      departure: f.Departure ?? '',
      destination: f.Destination ?? '',
      price: Number(f.Price),
      passenger,
      accrueMiles: $('accrue-miles').checked,
      status: 'Confirmed',
      createdAt: serverTimestamp()
    });
  });
 
  return { reference, passenger };
}
 
function showConfirmation({ reference, passenger }) {
  const fullName = `${passenger.firstName} ${passenger.lastName}`;
 
  $('conf-email').textContent = passenger.email;
  $('conf-ref').textContent = reference;
  $('conf-name').textContent = fullName;
  $('conf-flight').textContent = flight.FlightID ?? '';
  $('conf-route-title').textContent = `${flight.Departure} \u2192 ${flight.Destination}`;
  $('conf-route-sub').textContent = flight.Company ?? '';
  $('conf-dep').textContent = [flight.Date, flight.DepartTime].filter(Boolean).join(', ') || 'To be confirmed';
  $('conf-barcode').textContent = `${reference}-${flight.FlightID ?? ''}`;
  $('stub-name').textContent = fullName;
  $('stub-ticket').textContent = 'Booking Ref: ' + reference;
 
  // Move the stepper on to step 3
  const steps = document.querySelectorAll('.checkout-steps .step');
  const lines = document.querySelectorAll('.checkout-steps .step-line');
  steps[1].className = 'step completed';
  steps[1].innerHTML =
    '<div class="step-icon"><span class="material-symbols-outlined">check</span></div>' +
    '<span class="step-label">Passenger Details</span>';
  lines[1].classList.add('active-line');
  steps[2].className = 'step completed active';
steps[2].innerHTML =
  '<div class="step-icon"><span class="material-symbols-outlined">check</span></div>' +
  '<span class="step-label">Booking Confirmed</span>';
 
  $('checkout-grid').style.display = 'none';
  $('confirmation').style.display = '';
  $('confirmation').scrollIntoView({ behavior: 'smooth' });
}
 
$('passenger-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  formMessage('');
  if (!flight) return;
 
  if (!currentUser) {
    formMessage('Please log in to confirm your booking.');
    return;
  }
 
  const button = $('confirm-btn');
  const originalHtml = button.innerHTML;
  button.disabled = true;
  button.textContent = 'Confirming...';
 
  try {
    const result = await createBooking();
    showConfirmation(result);
  } catch (error) {
    console.error('Booking failed:', error);
    formMessage(error.message || 'Something went wrong. Please try again.');
    button.disabled = false;
    button.innerHTML = originalHtml;
  }
});
 
$('print-btn').addEventListener('click', () => window.print());
 
loadFlight();