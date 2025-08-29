let token = null;
let me = null;

async function api(path, opts = {}) {
  opts.headers = opts.headers || {};
  if (!opts.headers['Content-Type'] && !(opts.body instanceof FormData)) opts.headers['Content-Type'] = 'application/json';
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch('/api' + path, opts);
  return res.json();
}

// UI wiring
function showPanel(id) {
  ['createPanel','marketPanel','metricsPanel'].forEach(p => document.getElementById(p).style.display = (p===id ? '' : 'none'));
}
document.getElementById('createToggle').addEventListener('click', () => showPanel('createPanel'));
document.getElementById('listToggle').addEventListener('click', () => showPanel('marketPanel'));
document.getElementById('metricsToggle').addEventListener('click', () => showPanel('metricsPanel'));

async function onLoginActions() {
  document.getElementById('userInfo').innerText = me ? `${me.name} (${me.role}) • rep:${me.reputationScore}` : '';
  showPanel('createPanel');
  startSSE();
  refreshList();
  loadMetrics();
  loadNotifications();
}

// Auth
document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const j = await api('/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  if (j.ok) { token = j.token; me = j.user; onLoginActions(); } else alert('Login failed');
});
document.getElementById('regBtn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const name = email.split('@')[0] || 'donor';
  // try geo
  let lat = null, lng = null;
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((p) => {
      lat = p.coords.latitude; lng = p.coords.longitude;
    }, () => {}, { timeout: 2000 });
  }
  const j = await api('/register', { method: 'POST', body: JSON.stringify({ name, email, password, role: 'donor', lat, lng }) });
  if (j.ok) { token = j.token; me = j.user; onLoginActions(); } else alert('Register failed');
});

// SSE
let evtSource = null;
function startSSE() {
  if (!token) return;
  if (evtSource) evtSource.close();
  evtSource = new EventSource('/api/events', { withCredentials: true });
  // can't pass headers in EventSource — we're using auth.middleware that expects Authorization header.
  // To workaround for demo, server-side auth.middleware will check cookie or fallback; if strict, SSE may require token in query.
  // For demo, we will poll notifications instead if SSE connection fails.
  evtSource.onmessage = (e) => {
    try {
      const d = JSON.parse(e.data);
      const li = document.createElement('li');
      li.innerText = d.message;
      document.getElementById('notesList').prepend(li);
    } catch (err) {}
  };
  evtSource.onerror = () => { evtSource.close(); evtSource = null; };
}

// Create pickup with geolocation
let currentLat = null, currentLng = null;
document.getElementById('locBtn').addEventListener('click', () => {
  if (!navigator.geolocation) return alert('Geolocation not available');
  navigator.geolocation.getCurrentPosition((p) => {
    currentLat = p.coords.latitude; currentLng = p.coords.longitude;
    document.getElementById('geoText').innerText = `${currentLat.toFixed(4)},${currentLng.toFixed(4)}`;
  }, (e) => alert('geo error: ' + e.message), { timeout:5000 });
});

document.getElementById('pickupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  data.weightKg = Number(data.weightKg || 5);
  if (currentLat && currentLng) { data.lat = currentLat; data.lng = currentLng; }
  const j = await api('/pickup', { method: 'POST', body: JSON.stringify(data) });
  if (j.ok) {
    document.getElementById('pickupResult').innerText = 'Created pickup: ' + j.pickup.id;
    refreshList();
  } else document.getElementById('pickupResult').innerText = 'Error creating pickup';
});

// Dashboard & metrics
async function refreshList() {
  const j = await api('/pickups');
  if (j.ok) {
    const s = j.items.map(it => `${it.id} | ${it.donorName} | ${it.location} | ${it.weightKg}kg | ${it.perishability} | ${it.status} | fee:${(it.totalFeeCents||0)/100}`).join('\n');
    document.getElementById('listArea').innerText = s || '(no pickups)';
  } else document.getElementById('listArea').innerText = 'error';
}
document.getElementById('refreshBtn').addEventListener('click', refreshList);

async function loadMetrics() {
  const j = await api('/metrics/impact');
  if (j.ok) {
    document.getElementById('metrics').innerHTML = `<div>Total kg diverted: <strong>${j.totalKg}</strong></div>
      <div>Estimated meals: <strong>${j.totalMeals}</strong></div>
      <div>Impact records: <strong>${j.pickups}</strong></div>`;
  } else document.getElementById('metrics').innerText = 'no metrics';
}

// Notifications polling fallback
async function loadNotifications() {
  const j = await api('/notifications');
  if (j.ok) {
    const out = j.items.map(n => `<li>${new Date(n.createdAt).toLocaleString()}: ${n.message}</li>`).join('');
    document.getElementById('notesList').innerHTML = out || '<li>(none)</li>';
  }
}

// initial state: try to fetch /me if token stored in sessionStorage
(async function init() {
  const stored = sessionStorage.getItem('eco_token');
  if (stored) { token = stored; const j = await api('/me'); if (j.ok) { me = j.user; onLoginActions(); } }
})();
