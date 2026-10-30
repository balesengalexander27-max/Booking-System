import { auth, db } from './config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import {
  collection,
  onSnapshot
} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';
 
/* ==========================================
   WHO IS AN ADMIN?
   Put the email(s) of the admin account(s) here.
   Only these accounts can open this page.
   ========================================== */
const ADMIN_EMAILS = ['admin@gmail.com'];
 
const $ = (id) => document.getElementById(id);
 
let allBookings = [];
let listening = false;
 
/* ---------- helpers ---------- */
 
// Prevents data from breaking the HTML
function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
 
function money(value) {
  const n = Number(value);
  return Number.isFinite(n)
    ? 'R ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : 'N/A';
}
 
function toDate(value) {
  return value && typeof value.toDate === 'function' ? value.toDate() : null;
}
 
function formatDate(value) {
  const d = toDate(value);
  return d ? d.toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' }) : '--';
}
 
function fullName(b) {
  const p = b.passenger || {};
  return [p.firstName, p.lastName].filter(Boolean).join(' ') || '--';
}
 
function statusClass(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'confirmed') return 'confirmed';
  if (s === 'cancelled' || s === 'canceled') return 'cancelled';
  return 'other';
}
 
function showGate(title, text, showLoginLink) {
  $('gate').style.display = '';
  $('admin-content').style.display = 'none';
  $('gate-title').textContent = title;
  $('gate-text').textContent = text;
  $('gate-link').style.display = showLoginLink ? '' : 'none';
}
 
/* ---------- stats ---------- */
 
function updateStats() {
  const confirmed = allBookings.filter((b) => statusClass(b.status) === 'confirmed');
  const revenue = confirmed.reduce((sum, b) => sum + (Number(b.price) || 0), 0);
  const flights = new Set(allBookings.map((b) => b.flightId).filter(Boolean));
 
  $('stat-total').textContent = allBookings.length;
  $('stat-confirmed').textContent = confirmed.length;
  $('stat-revenue').textContent = money(revenue);
  $('stat-flights').textContent = flights.size;
  $('last-updated').textContent = new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
}
 
/* ---------- table ---------- */
 
function visibleBookings() {
  const term = $('search').value.trim().toLowerCase();
  const status = $('status-filter').value;
  const sort = $('sort').value;
 
  let list = allBookings.filter((b) => {
    if (status !== 'all' && statusClass(b.status) !== status) return false;
    if (!term) return true;
    const p = b.passenger || {};
    const haystack = [b.reference, fullName(b), p.email, b.userEmail, b.flightId, b.departure, b.destination]
      .join(' ')
      .toLowerCase();
    return haystack.includes(term);
  });
 
  const time = (b) => (toDate(b.createdAt) ? toDate(b.createdAt).getTime() : 0);
  if (sort === 'oldest') list.sort((a, b) => time(a) - time(b));
  else if (sort === 'price') list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
  else list.sort((a, b) => time(b) - time(a));
 
  return list;
}
 
function renderTable() {
  const list = visibleBookings();
 
  $('results-count').textContent =
    `${list.length} booking${list.length === 1 ? '' : 's'} shown` +
    (list.length !== allBookings.length ? ` of ${allBookings.length}` : '');
 
  $('empty-state').textContent = 'No bookings found.';
  $('empty-state').style.display = list.length === 0 ? '' : 'none';
 
  $('bookings-body').innerHTML = list
    .map((b) => {
      const p = b.passenger || {};
      return `
        <tr data-id="${esc(b.id)}">
          <td><span class="ref">${esc(b.reference || b.id.slice(0, 6).toUpperCase())}</span></td>
          <td><span class="cell-main">${esc(fullName(b))}</span><span class="cell-sub">${esc(p.email || b.userEmail || '')}</span></td>
          <td><span class="cell-main">${esc(b.flightId || '--')}</span><span class="cell-sub">${esc(b.company || '')}</span></td>
          <td>${esc(b.departure || '--')} &rarr; ${esc(b.destination || '--')}</td>
          <td class="price">${money(b.price)}</td>
          <td><span class="badge ${statusClass(b.status)}"><i></i>${esc(b.status || 'Unknown')}</span></td>
          <td>${esc(formatDate(b.createdAt))}</td>
        </tr>`;
    })
    .join('');
}
 
/* ---------- details popup ---------- */
 
function detail(label, value, full = false) {
  return `<div class="detail${full ? ' full' : ''}"><small>${esc(label)}</small><span>${esc(value || '--')}</span></div>`;
}
 
function openModal(id) {
  const b = allBookings.find((x) => x.id === id);
  if (!b) return;
  const p = b.passenger || {};
 
  $('modal-title').textContent = b.reference || b.id;
  $('modal-body').innerHTML =
    detail('Passenger', fullName(b)) +
    detail('Status', b.status) +
    detail('Email', p.email || b.userEmail) +
    detail('Phone', p.phone) +
    detail('ID / Passport', p.passportNumber) +
    detail('Accrues miles', b.accrueMiles ? 'Yes' : 'No') +
    detail('Flight', b.flightId) +
    detail('Airline', b.company) +
    detail('Route', `${b.departure || '--'} \u2192 ${b.destination || '--'}`) +
    detail('Price', money(b.price)) +
    detail('Booked on', formatDate(b.createdAt), true);
 
  $('modal').style.display = '';
}
 
function closeModal() {
  $('modal').style.display = 'none';
}
 
$('bookings-body').addEventListener('click', (e) => {
  const row = e.target.closest('tr[data-id]');
  if (row) openModal(row.dataset.id);
});
$('modal-close').addEventListener('click', closeModal);
$('modal').addEventListener('click', (e) => {
  if (e.target === $('modal')) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});
 
['search', 'status-filter', 'sort'].forEach((id) => {
  $(id).addEventListener('input', renderTable);
});
 
/* ---------- live bookings from Firestore (every booking, from every user) ---------- */
 
function startListening() {
  if (listening) return;
  listening = true;
 
  onSnapshot(
    collection(db, 'Bookings'),
    (snapshot) => {
      allBookings = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      updateStats();
      renderTable();
    },
    (error) => {
      console.error('Could not load bookings:', error);
      $('results-count').textContent = 'Could not load bookings';
      $('empty-state').textContent = 'Could not load bookings. Check the console and your Firestore rules.';
      $('empty-state').style.display = '';
    }
  );
}
 
/* ---------- logout ---------- */
 
$('logout-link').addEventListener('click', async (e) => {
  e.preventDefault();
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout failed:', error);
  }
  localStorage.removeItem('isLoggedIn');
  window.location.href = 'logIn.html';
});
 
/* ---------- admin-only access ---------- */
 
onAuthStateChanged(auth, (user) => {
  if (!user) {
    showGate('Please log in', 'You need to log in with the admin account to see this page.', true);
    return;
  }
 
  const email = String(user.email || '').toLowerCase();
  const isAdmin = ADMIN_EMAILS.map((a) => a.toLowerCase()).includes(email);
 
  if (!isAdmin) {
    showGate(
      'Admins only',
      'This page can only be opened with the admin account. Please log in as the admin.',
      true
    );
    return;
  }
 
  $('gate').style.display = 'none';
  $('admin-content').style.display = '';
  startListening();
});