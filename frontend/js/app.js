const API = '/api/events';

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => (toast.style.display = 'none'), 3000);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function urgencyChip(dateStr) {
  const diffDays = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return '<span class="urgency-chip today">Today</span>';
  if (diffDays === 1) return '<span class="urgency-chip today">Tomorrow</span>';
  if (diffDays <= 7) return `<span class="urgency-chip soon">In ${diffDays} days</span>`;
  return '';
}

// ---------- Homepage: event grid + category filter ----------
async function loadEvents(category = '') {
  const grid = document.getElementById('eventGrid');
  if (!grid) return;

  grid.innerHTML = '<p>Loading events...</p>';

  try {
    const url = category ? `${API}?category=${encodeURIComponent(category)}` : API;
    const res = await fetch(url);
    const events = await res.json();

    if (!events.length) {
      grid.innerHTML = `<div class="empty-state"><span class="icon">🗓️</span>Nothing scheduled here yet — check back soon, or try a different category.</div>`;
      return;
    }

    grid.innerHTML = events
      .map((ev) => {
        const full = ev.registeredCount >= ev.capacity;
        const pct = Math.min(100, Math.round((ev.registeredCount / ev.capacity) * 100));
        return `
        <div class="event-card">
          <span class="category">${ev.category}</span>
          <h3>${ev.title}</h3>
          <p>${formatDate(ev.date)}${urgencyChip(ev.date)}</p>
          <p>${ev.location}</p>
          <div class="seat-meter">
            <div class="track"><div class="fill" style="width:${pct}%"></div></div>
            <div class="label ${full ? 'full' : ''}">
              ${full ? 'Full — new signups join the waitlist' : `${ev.capacity - ev.registeredCount} of ${ev.capacity} seats left`}
            </div>
          </div>
          <a class="btn" href="event-detail.html?id=${ev._id}">View & Register</a>
        </div>`;
      })
      .join('');
  } catch (err) {
    grid.innerHTML = '<div class="empty-state">Could not load events. Please try again.</div>';
  }
}

function initFilters() {
  const filters = document.getElementById('filters');
  if (!filters) return;

  filters.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') return;
    filters.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
    e.target.classList.add('active');
    loadEvents(e.target.dataset.category);
  });
}

// ---------- Event detail + registration ----------
function getEventIdFromUrl() {
  return new URLSearchParams(window.location.search).get('id');
}

async function loadEventDetail() {
  const container = document.getElementById('eventDetail');
  if (!container) return;

  const id = getEventIdFromUrl();
  if (!id) {
    container.innerHTML = '<p>No event specified.</p>';
    return;
  }

  try {
    const res = await fetch(`${API}/${id}`);
    if (!res.ok) throw new Error('not found');
    const ev = await res.json();
    const full = ev.registeredCount >= ev.capacity;

    container.innerHTML = `
      <span class="category">${ev.category}</span>
      <h2>${ev.title}</h2>
      <p>${ev.description}</p>
      <p><strong>When:</strong> ${formatDate(ev.date)}</p>
      <p><strong>Where:</strong> ${ev.location}</p>
      <span class="badge ${full ? 'full' : 'open'}">
        ${full ? 'Full — you will be added to the waitlist' : `${ev.capacity - ev.registeredCount} of ${ev.capacity} spots left`}
      </span>
    `;
  } catch (err) {
    container.innerHTML = '<p>Event not found.</p>';
  }
}

function initRegisterForm() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = getEventIdFromUrl();
    const message = document.getElementById('registerMessage');

    const payload = {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value
    };

    try {
      const res = await fetch(`${API}/${id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        message.textContent = data.message || 'Registration failed.';
        message.style.color = 'var(--danger)';
        return;
      }

      if (data.status === 'waitlisted') {
        message.textContent = `Event is full — you're #${data.waitlistPosition} on the waitlist. We'll email you if a spot opens up.`;
        message.style.color = 'var(--warning)';
      } else {
        message.textContent = "You're registered! See you there.";
        message.style.color = 'var(--success)';
      }
      form.reset();
      loadEventDetail();
    } catch (err) {
      message.textContent = 'Something went wrong. Please try again.';
      message.style.color = 'var(--danger)';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initFilters();
  loadEvents();
  loadEventDetail();
  initRegisterForm();
});
