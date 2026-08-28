const EVENTS_API = '/api/events';
const AUTH_API = '/api/auth';

function getToken() {
  return localStorage.getItem('adminToken');
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' };
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => (toast.style.display = 'none'), 3000);
}

// ---------- Login ----------
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const message = document.getElementById('loginMessage');

  try {
    const res = await fetch(`${AUTH_API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      message.textContent = data.message || 'Login failed';
      message.style.color = 'var(--danger)';
      return;
    }

    localStorage.setItem('adminToken', data.token);
    document.getElementById('loginCard').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    loadAdminEvents();
  } catch (err) {
    message.textContent = 'Something went wrong.';
  }
}

// ---------- Create event ----------
async function handleCreateEvent(e) {
  e.preventDefault();
  const message = document.getElementById('createMessage');

  const payload = {
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    category: document.getElementById('category').value,
    date: document.getElementById('date').value,
    location: document.getElementById('location').value,
    capacity: Number(document.getElementById('capacity').value)
  };

  try {
    const res = await fetch(EVENTS_API, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) {
      message.textContent = data.message || 'Could not create event';
      message.style.color = 'var(--danger)';
      return;
    }

    message.textContent = 'Event created.';
    message.style.color = 'var(--success)';
    e.target.reset();
    loadAdminEvents();
  } catch (err) {
    message.textContent = 'Something went wrong.';
  }
}

// ---------- List admin's events ----------
async function loadAdminEvents() {
  const list = document.getElementById('adminEventList');
  try {
    const res = await fetch(EVENTS_API);
    const events = await res.json();

    if (!events.length) {
      list.innerHTML = '<p>No events yet. Create one above.</p>';
      return;
    }

    list.innerHTML = events
      .map(
        (ev) => `
      <div class="event-card" style="margin-bottom:0.75rem;">
        <span class="category">${ev.category} · ${ev.status}</span>
        <h3>${ev.title}</h3>
        <p>${ev.registeredCount}/${ev.capacity} registered</p>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn secondary" onclick="viewRegistrants('${ev._id}', '${ev.title.replace(/'/g, "\\'")}')">View registrants</button>
          <button class="btn danger" onclick="cancelEvent('${ev._id}')">Cancel event</button>
        </div>
      </div>`
      )
      .join('');
  } catch (err) {
    list.innerHTML = '<p>Could not load events.</p>';
  }
}

async function cancelEvent(id) {
  if (!confirm('Cancel this event?')) return;
  await fetch(`${EVENTS_API}/${id}`, { method: 'DELETE', headers: authHeaders() });
  showToast('Event cancelled');
  loadAdminEvents();
}

// ---------- Registrants + manual waitlist promotion ----------
async function viewRegistrants(eventId, title) {
  const card = document.getElementById('registrantsCard');
  const body = document.getElementById('registrantsBody');
  document.getElementById('registrantsTitle').textContent = `Registrants — ${title}`;
  card.style.display = 'block';
  card.dataset.eventId = eventId;

  try {
    const res = await fetch(`${EVENTS_API}/${eventId}/registrations`, { headers: authHeaders() });
    const regs = await res.json();

    if (!regs.length) {
      body.innerHTML = '<tr><td colspan="4">No registrations yet.</td></tr>';
      return;
    }

    body.innerHTML = regs
      .map(
        (r) => `
      <tr>
        <td>${r.name}</td>
        <td>${r.email}</td>
        <td><span class="status-pill ${r.status}">${r.status}${r.waitlistPosition ? ' #' + r.waitlistPosition : ''}</span></td>
        <td>
          ${r.status !== 'cancelled' ? `<button class="btn danger" onclick="cancelRegistration('${r._id}', '${eventId}', '${title.replace(/'/g, "\\'")}')">Cancel</button>` : ''}
        </td>
      </tr>`
      )
      .join('');
  } catch (err) {
    body.innerHTML = '<tr><td colspan="4">Could not load registrants.</td></tr>';
  }
}

async function cancelRegistration(regId, eventId, title) {
  if (!confirm('Cancel this registration? If confirmed, the next waitlisted person will be promoted automatically.')) return;

  await fetch(`/api/registrations/${regId}`, { method: 'DELETE', headers: authHeaders() });
  showToast('Registration cancelled — waitlist updated if applicable');
  viewRegistrants(eventId, title);
  loadAdminEvents();
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  const createForm = document.getElementById('createEventForm');
  if (createForm) createForm.addEventListener('submit', handleCreateEvent);

  if (getToken()) {
    document.getElementById('loginCard').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    loadAdminEvents();
  }
});
