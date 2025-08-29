async function api(path, opts = {}) {
  const res = await fetch('/api' + path, opts);
  return res.json();
}

const form = document.getElementById('pickupForm');
const result = document.getElementById('pickupResult');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  data.weightKg = Number(data.weightKg || 5);
  const j = await api('/pickup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (j.ok) {
    result.innerText = 'Created pickup: ' + j.pickup.id;
    refreshList();
  } else result.innerText = 'Error creating pickup';
});

document.getElementById('bookBtn').addEventListener('click', async () => {
  const id = document.getElementById('bookId').value.trim();
  if (!id) return alert('Enter pickup id');
  const j = await api('/pickup/' + id + '/book', { method: 'POST' });
  document.getElementById('bookResult').innerText = JSON.stringify(j, null, 2);
  refreshList();
});

document.getElementById('refreshBtn').addEventListener('click', refreshList);

async function refreshList() {
  const j = await api('/pickups');
  if (j.ok) {
    const s = j.items.map(it => `${it.id} | ${it.donorName} | ${it.location} | ${it.weightKg}kg | ${it.perishability} | ${it.status} | fee:${it.totalFeeCents || 0}`).join('\n');
    document.getElementById('listArea').innerText = s || '(no pickups)';
  } else {
    document.getElementById('listArea').innerText = 'error';
  }
}

// initial
refreshList();
