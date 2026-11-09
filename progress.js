(function () {
  /* Saves every checkbox on this device right away, and syncs to the family database on the live sites. */
  const PROD_HOSTS = ['goat-program.vercel.app', 'samueldn.github.io'];
  const canSync = PROD_HOSTS.includes(location.hostname);
  const API = location.hostname === 'goat-program.vercel.app' ? '/api/progress' : 'https://goat-program.vercel.app/api/progress';
  // A built-in key that keeps random scripts out. It is not a secret: anyone who reads this page can see it.
  const SITE_KEY = 'gp-FvNk6NjZiLdSDW0v';
  const K_STATE = 'goat-progress-v1', K_PENDING = 'goat-progress-pending-v1';

  const read = k => { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  let state = read(K_STATE);     // { field: { t, v } }
  let pending = read(K_PENDING); // changes not yet confirmed by the server
  let status = canSync ? 'syncing' : 'local';
  let flushTimer = null, busy = false, again = false;

  const LABELS = {
    local: 'Saved on this device',
    syncing: 'Syncing...',
    synced: 'Synced',
    offline: 'Offline, will sync',
    error: 'Sync problem',
  };
  const NOTES = {
    local: 'This copy is a preview. Ticks are saved on this device only.',
    syncing: 'Checking with the family database...',
    synced: 'Everything is saved and shared across all your devices.',
    offline: 'No connection right now. Ticks are saved here and will sync when you are back online.',
    error: 'Syncing is not working right now. Ticks are still saved on this device.',
  };

  const isDone = f => !!(state[f] && state[f].v === '1');

  function updateUI() {
    document.querySelectorAll('.sync-pill').forEach(el => {
      el.textContent = LABELS[status];
      el.className = 'sync-pill s-' + status;
    });
    document.querySelectorAll('.sync-note').forEach(el => { el.textContent = NOTES[status]; });
  }

  function setStatus(s) { status = s; updateUI(); }
  function emit() { updateUI(); window.dispatchEvent(new Event('goat:progress')); }

  function apply(root) {
    (root || document).querySelectorAll('input[data-field]').forEach(el => {
      const d = isDone(el.dataset.field);
      if (el.checked !== d) el.checked = d;
    });
  }

  function merge(server) {
    let changed = false;
    for (const f in server || {}) {
      const s = server[f], l = state[f];
      if (!l || s.t > l.t) { state[f] = { t: s.t, v: s.v }; changed = true; }
    }
    if (changed) { write(K_STATE, state); apply(); emit(); }
  }

  async function sync() {
    if (!canSync) return;
    if (busy) { again = true; return; }
    busy = true;
    setStatus('syncing');
    try {
      const sent = Object.entries(pending).slice(0, 60);
      const res = await fetch(API, {
        method: sent.length ? 'POST' : 'GET',
        headers: { 'x-family-key': SITE_KEY, 'content-type': 'application/json' },
        body: sent.length ? JSON.stringify({ ops: sent.map(([f, o]) => ({ f, t: o.t, v: o.v })) }) : undefined,
      });
      if (res.status === 401 || res.status === 503) { setStatus('error'); return; }
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      for (const [f, o] of sent) if (pending[f] && pending[f].t === o.t) delete pending[f];
      write(K_PENDING, pending);
      merge(data.progress);
      setStatus('synced');
      if (Object.keys(pending).length) schedule();
    } catch (e) {
      setStatus('offline');
    } finally {
      busy = false;
      if (again) { again = false; schedule(); }
    }
  }

  function schedule() { clearTimeout(flushTimer); flushTimer = setTimeout(sync, 500); }

  function set(field, value) {
    const t = Date.now();
    state[field] = { t, v: value };
    pending[field] = { t, v: value };
    write(K_STATE, state);
    write(K_PENDING, pending);
    emit();
    schedule();
  }

  function panelHtml() {
    return `
      <div class="sync">
        <button type="button" class="sync-pill s-${status}" data-sync-toggle aria-expanded="false">${LABELS[status]}</button>
        <div class="sync-panel" hidden>
          <p class="sync-note"></p>
          <button type="button" class="link-btn" data-sync-backup>Download a backup</button>
        </div>
      </div>`;
  }

  document.addEventListener('change', e => {
    const el = e.target;
    if (el && el.matches && el.matches('input[type="checkbox"][data-field]')) set(el.dataset.field, el.checked ? '1' : '0');
  });

  document.addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('[data-sync-toggle]');
    if (t) {
      const panel = t.parentElement.querySelector('.sync-panel');
      panel.hidden = !panel.hidden;
      t.setAttribute('aria-expanded', String(!panel.hidden));
      updateUI();
      return;
    }
    if (e.target.closest && e.target.closest('[data-sync-backup]')) {
      const blob = new Blob([JSON.stringify({ saved: new Date().toISOString(), progress: state }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'goat-program-progress-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    }
  });

  setInterval(() => { if (document.visibilityState === 'visible') sync(); }, 20000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') sync(); });
  window.addEventListener('online', sync);
  window.addEventListener('DOMContentLoaded', () => { apply(); updateUI(); sync(); });

  window.Progress = { isDone, set, apply, sync, barHtml: panelHtml, status: () => status, afterRender: () => { apply(); updateUI(); } };
})();
