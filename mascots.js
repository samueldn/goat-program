(function () {
  let uid = 0;

  /* ---------- colour helper ---------- */
  const toRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const toHex = a => '#' + a.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const x = toRgb(a), y = toRgb(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); };

  /* ---------- hats (origin at the crown of the head; outlined in ink when drawn) ---------- */
  const HATS = [
    { id: 'cap', name: 'Baseball cap', svg: `
      <path d="M-34 2 Q-36 -36 0 -38 Q36 -36 34 2 Z" fill="#2563eb"/>
      <path d="M-34 2 Q-36 -36 0 -38 L0 2 Z" fill="#1d4ed8" opacity=".35"/>
      <path d="M10 -2 Q44 -8 58 6 Q56 12 44 10 Q28 4 10 6 Z" fill="#1e40af"/>
      <circle cx="0" cy="-38" r="4" fill="#1e40af"/>` },
    { id: 'party', name: 'Party hat', svg: `
      <path d="M-28 4 L0 -66 L28 4 Z" fill="#f472b6"/>
      <path d="M-16 -26 L16 -26 L20.8 -14 L-20.8 -14 Z" fill="#facc15"/>
      <path d="M-8.8 -44 L8.8 -44 L12 -36 L-12 -36 Z" fill="#facc15"/>
      <ellipse cx="0" cy="4" rx="30" ry="5" fill="#ec4899"/>
      <circle cx="0" cy="-68" r="8" fill="#facc15"/>` },
    { id: 'crown', name: 'Crown', svg: `
      <path d="M-34 4 L-38 -30 L-18 -14 L0 -40 L18 -14 L38 -30 L34 4 Z" fill="#fbbf24"/>
      <rect x="-34" y="-6" width="68" height="12" rx="4" fill="#f59e0b"/>
      <circle cx="-38" cy="-32" r="5" fill="#ef4444"/>
      <circle cx="0" cy="-42" r="6" fill="#3b82f6"/>
      <circle cx="38" cy="-32" r="5" fill="#ef4444"/>` },
    { id: 'tophat', name: 'Top hat', svg: `
      <ellipse cx="0" cy="2" rx="42" ry="8" fill="#374151"/>
      <path d="M-26 2 L-24 -52 Q0 -58 24 -52 L26 2 Z" fill="#4b5563"/>
      <ellipse cx="0" cy="-52" rx="24" ry="6" fill="#6b7280"/>
      <rect x="-26" y="-18" width="52" height="12" fill="#ef4444"/>` },
    { id: 'wizard', name: 'Wizard hat', svg: `
      <ellipse cx="0" cy="4" rx="44" ry="8" fill="#6d28d9"/>
      <path d="M-28 2 Q-22 -30 -6 -52 Q4 -68 24 -74 Q12 -56 16 -36 Q22 -16 28 2 Z" fill="#7c3aed"/>
      <path d="M-26 -4 L26 -4 L24 -16 L-23 -16 Z" fill="#facc15"/>
      <path transform="translate(-4 -36)" d="M0 -8 L2.4 -2.5 L8 -2.5 L3.6 1.5 L5 7.5 L0 4 L-5 7.5 L-3.6 1.5 L-8 -2.5 L-2.4 -2.5 Z" fill="#fde047"/>` },
    { id: 'cowboy', name: 'Cowboy hat', svg: `
      <path d="M-52 -4 Q-40 12 0 10 Q40 12 52 -4 Q42 4 30 2 L-30 2 Q-42 4 -52 -4 Z" fill="#a16207"/>
      <path d="M-28 4 Q-32 -30 -16 -38 Q0 -28 16 -38 Q32 -30 28 4 Z" fill="#d97706"/>
      <rect x="-28" y="-12" width="56" height="10" fill="#7c2d12"/>` },
    { id: 'beanie', name: 'Beanie', svg: `
      <path d="M-32 4 Q-34 -38 0 -40 Q34 -38 32 4 Z" fill="#ef4444"/>
      <path d="M-18 -36 L-12 4 M0 -40 L0 4 M18 -36 L12 4" stroke="#b91c1c" stroke-width="3" fill="none" opacity=".5"/>
      <rect x="-36" y="-10" width="72" height="16" rx="8" fill="#b91c1c"/>
      <circle cx="0" cy="-44" r="10" fill="#fff"/>` },
  ];

  /* ---------- characters: one drawing each, painted in ink and cel style ---------- */
  const GEO = {
    goat: {
      label: 'goat wearing a crown', fixedHat: 'crown', hat: { x: 110, y: 66, s: 1.05, rot: -5 },
      parts: [
        { mirror: true, base: '#d9a35f', d: 'M72 92 C48 80 34 54 40 24 C48 22 52 28 52 32 C56 54 72 66 96 72 Z' },
        { mirror: true, base: '#e8d9bd', d: 'M62 116 C38 104 16 112 8 130 C28 140 50 140 68 132 Z' },
        { mirror: true, base: '#f1aab6', d: 'M58 120 C42 114 28 118 22 128 C34 132 48 132 60 128 Z' },
        { base: '#e3d4b8', d: 'M96 186 C98 214 108 236 110 238 C112 236 122 214 124 186 Z' },
        { base: '#f6eddc', d: 'M110 62 C140 62 160 84 158 118 C157 146 146 170 132 190 C126 200 94 200 88 190 C74 170 63 146 62 118 C60 84 80 62 110 62 Z' },
        { base: '#f1dcc0', d: 'M84 148 C84 134 136 134 136 148 C138 172 126 192 110 192 C94 192 82 172 84 148 Z' },
        { base: '#c97f86', d: 'M98 156 C98 148 122 148 122 156 C122 164 116 168 110 168 C104 168 98 164 98 156 Z' },
      ],
      lines: [{ mirror: true, d: 'M58 76 L70 66 M50 60 L62 52 M46 44 L56 38' }],
      nostrils: [[104, 158, 2.5, 4], [116, 158, 2.5, 4]],
      eyes: { l: [84, 112], r: [136, 112], tilt: 14, kind: 'goat' },
      brows: ['M64 98 L100 108', 'M156 98 L120 108'],
      mouth: 'M92 180 Q110 190 130 178',
    },
    duke: {
      label: 'pig', hat: { x: 110, y: 60, s: 1.1, rot: -8 },
      parts: [
        { mirror: true, base: '#f09ab0', d: 'M64 84 C48 54 22 56 20 92 C32 96 50 98 64 100 Z' },
        { mirror: true, base: '#ffc1d2', d: 'M58 82 C48 66 34 68 32 88 C42 90 50 92 58 94 Z' },
        { base: '#f7a8bd', d: 'M110 58 C150 58 170 86 168 122 C166 160 146 190 110 190 C74 190 54 160 52 122 C50 86 70 58 110 58 Z' },
        { base: '#f28bab', d: 'M76 134 C76 112 144 112 144 134 C146 158 130 172 110 172 C90 172 74 158 76 134 Z' },
        { mirror: true, base: '#fff3dc', d: 'M84 168 C79 178 83 188 92 185 C92 178 90 172 90 166 Z' },
      ],
      lines: [],
      nostrils: [[97, 140, 5.5, 8], [123, 140, 5.5, 8]],
      eyes: { l: [78, 98], r: [142, 98], tilt: 12, kind: 'round' },
      brows: ['M58 86 L98 97', 'M162 86 L122 97'],
      mouth: 'M84 180 Q110 196 138 178',
    },
    rudy: {
      label: 'dog', hat: { x: 110, y: 56, s: 1.05, rot: -6 },
      parts: [
        { mirror: true, base: '#9a5a2a', d: 'M58 80 C36 74 18 92 20 128 C22 150 42 154 56 140 C60 120 62 100 64 86 Z' },
        { base: '#f2bf6b', d: 'M110 58 C146 58 164 82 162 118 C161 144 150 168 132 182 C122 190 98 190 88 182 C70 168 59 144 58 118 C56 82 74 58 110 58 Z' },
        { base: '#9a5a2a', d: 'M120 72 C146 70 160 92 152 118 C140 124 124 118 118 100 C116 88 116 80 120 72 Z' },
        { base: '#fff1d6', d: 'M80 140 C80 122 140 122 140 140 C142 164 128 184 110 184 C92 184 78 164 80 140 Z' },
        { base: '#ff6f8e', d: 'M98 160 C98 186 122 186 122 160 Z' },
        { base: '#2a1c18', d: 'M98 130 C98 122 122 122 122 130 C122 138 116 144 110 144 C104 144 98 138 98 130 Z' },
      ],
      lines: [],
      nostrils: [],
      eyes: { l: [80, 98], r: [140, 98], tilt: 12, kind: 'round' },
      brows: ['M58 84 L98 96', 'M162 84 L122 96'],
      mouth: 'M110 144 L110 158 M110 158 Q94 170 84 158 M110 158 Q126 170 136 158',
    },
    monty: {
      label: 'moose', hat: { x: 110, y: 60, s: 0.95, rot: -4 },
      parts: [
        { mirror: true, base: '#e0b25a', d: 'M78 74 C60 66 40 60 20 38 C28 30 38 34 40 42 C44 30 56 26 62 36 C62 26 72 22 78 30 C76 42 84 54 94 64 Z' },
        { mirror: true, base: '#7a4a2d', d: 'M58 100 C38 92 22 98 14 112 C30 122 48 122 62 114 Z' },
        { mirror: true, base: '#d9a07a', d: 'M54 102 C40 98 28 102 22 110 C34 116 46 116 56 110 Z' },
        { base: '#8b5a3c', d: 'M110 60 C140 60 156 84 154 116 C153 140 148 162 140 182 C132 200 88 200 80 182 C72 162 67 140 66 116 C64 84 80 60 110 60 Z' },
        { base: '#b98055', d: 'M78 148 C78 130 142 130 142 148 C146 178 130 202 110 202 C90 202 74 178 78 148 Z' },
      ],
      lines: [],
      nostrils: [[98, 172, 5, 8], [122, 172, 5, 8]],
      eyes: { l: [84, 106], r: [136, 106], tilt: 13, kind: 'round', scale: 0.92 },
      brows: ['M66 95 L104 106', 'M154 95 L116 106'],
      mouth: 'M92 192 Q110 200 128 190',
    },
    indiana: {
      label: 'chicken', hat: { x: 110, y: 66, s: 1.0, rot: -5 },
      parts: [
        { base: '#e23b3b', d: 'M78 70 C70 46 84 30 94 46 C96 28 116 28 118 46 C128 32 146 46 138 70 C128 76 90 76 78 70 Z' },
        { base: '#e23b3b', d: 'M100 160 C96 190 124 190 120 160 Z' },
        { base: '#fff8ea', d: 'M110 64 C146 64 166 90 164 124 C162 156 140 182 110 182 C80 182 58 156 56 124 C54 90 74 64 110 64 Z' },
        { base: '#d98410', d: 'M96 140 C100 158 120 158 124 140 C118 148 102 148 96 140 Z' },
        { base: '#f5a623', d: 'M88 122 C96 108 124 108 132 122 C130 140 120 150 110 154 C100 150 90 140 88 122 Z' },
      ],
      lines: [],
      nostrils: [],
      eyes: { l: [76, 100], r: [144, 100], tilt: 14, kind: 'chicken' },
      brows: ['M54 86 L94 100', 'M166 86 L126 100'],
      mouth: '',
    },
  };

  /* ---------- pieces ---------- */
  const INK = '#111';
  const mirrorWrap = (p, inner) => p.mirror ? `${inner}<g transform="translate(220 0) scale(-1 1)">${inner}</g>` : inner;

  function eyeMarkup(cx, cy, side, e) {
    const rot = side * -1 * e.tilt;
    const almond = 'M-15 0 C-9 -11 9 -11 15 0 C9 10 -9 10 -15 0 Z';
    const fill = e.kind === 'goat' || e.kind === 'chicken' ? '#ffe08a' : '#fff';
    const pupil = e.kind === 'goat'
      ? '<rect x="-10" y="-5" width="20" height="11" rx="5.5" fill="#111"/>'
      : '<ellipse cx="1" cy="1" rx="5.5" ry="6.5" fill="#111"/>';
    const s = e.scale || 1;
    return `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${s})">
      <path d="${almond}" fill="${fill}" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>${pupil}<circle cx="5" cy="-3" r="2.4" fill="#fff"/></g>`;
  }

  const inkHat = h => `<g stroke="${INK}" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round">${h.svg}</g>`;

  const DEFAULT_HAT = { duke: 'cap', indiana: 'crown', rudy: 'party', monty: 'beanie' };
  const KEY = 'goat-hats-v1';
  function loadHats() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
  function saveHats(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch {} }
  function hatOf(kid) { return HATS.find(h => h.id === (loadHats()[kid] || DEFAULT_HAT[kid])) || HATS[0]; }

  function svg(kid, opts = {}) {
    const g = GEO[kid];
    if (!g) return '';
    const id = ++uid;
    const defs = [];
    const parts = g.parts.map((p, i) => {
      const pid = `${id}_${i}`;
      defs.push(`<clipPath id="cp${pid}"><path d="${p.d}"/></clipPath>`);
      const inner = `<path d="${p.d}" fill="${mix(p.base, '#2a1840', 0.38)}"/>
        <path d="${p.d}" fill="${p.base}" transform="translate(-7 -9)" clip-path="url(#cp${pid})"/>
        <path d="${p.d}" fill="none" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`;
      return mirrorWrap(p, inner);
    }).join('');
    const lines = g.lines.map(l => mirrorWrap(l, `<path d="${l.d}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`)).join('');
    const nostrils = g.nostrils.map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${INK}"/>`).join('');
    const brows = g.brows.map(d => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>`).join('');
    const mouth = g.mouth ? `<path d="${g.mouth}" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>` : '';
    const eyes = `<g class="eyes">${eyeMarkup(g.eyes.l[0], g.eyes.l[1], -1, g.eyes)}${eyeMarkup(g.eyes.r[0], g.eyes.r[1], 1, g.eyes)}</g>`;

    const fixed = !!g.fixedHat;
    const hat = fixed ? HATS.find(x => x.id === g.fixedHat) : hatOf(kid);
    const h = g.hat;
    const interactive = !opts.small && !fixed;
    const slotAttrs = interactive
      ? `class="hat-slot" role="button" tabindex="0" data-kid="${kid}" aria-label="Change hat. Now wearing: ${hat.name}"`
      : 'class="hat-static"';
    const slot = `<g ${slotAttrs} transform="translate(${h.x} ${h.y}) rotate(${h.rot}) scale(${h.s})">
      ${interactive ? '<title>Tap to change my hat</title><rect class="hat-hit" x="-56" y="-86" width="112" height="100" fill="transparent"/>' : ''}
      <g class="hat-inner">${inkHat(hat)}</g></g>`;

    return `<svg class="mascot" data-kid="${kid}" viewBox="-10 -34 240 280" role="img" aria-label="${g.label}">
      <defs>${defs.join('')}</defs>
      <g class="bob">${parts}${lines}${nostrils}${brows}${eyes}${mouth}${slot}</g></svg>`;
  }

  function paintHat(kid, hat, pop) {
    document.querySelectorAll(`svg.mascot[data-kid="${kid}"]`).forEach(el => {
      const inner = el.querySelector('.hat-inner');
      if (!inner) return;
      const slot = el.querySelector('.hat-slot, .hat-static');
      inner.innerHTML = inkHat(hat);
      if (slot && slot.classList.contains('hat-slot')) slot.setAttribute('aria-label', `Change hat. Now wearing: ${hat.name}`);
      if (pop) {
        inner.classList.remove('pop');
        void inner.getBoundingClientRect();
        inner.classList.add('pop');
      }
    });
    document.querySelectorAll(`[data-hat-name="${kid}"]`).forEach(el => { el.textContent = hat.name; });
  }

  function cycle(kid) {
    const saved = loadHats();
    const current = HATS.findIndex(h => h.id === (saved[kid] || DEFAULT_HAT[kid]));
    const next = HATS[(current + 1) % HATS.length];
    saved[kid] = next.id;
    saveHats(saved);
    paintHat(kid, next, true);
    if (window.Progress) window.Progress.set('hat|' + kid, next.id);
  }

  // hats chosen on another device arrive through the synced progress data
  function applySyncedHats() {
    if (!window.Progress) return;
    const saved = loadHats();
    let changed = false;
    for (const kid of Object.keys(DEFAULT_HAT)) {
      const v = window.Progress.get('hat|' + kid);
      const hat = v && HATS.find(h => h.id === v);
      if (hat && (saved[kid] || DEFAULT_HAT[kid]) !== hat.id) {
        saved[kid] = hat.id;
        changed = true;
        paintHat(kid, hat, true);
      }
    }
    if (changed) saveHats(saved);
  }

  // hats picked on this device before syncing existed get uploaded once
  function seedSyncedHats() {
    if (!window.Progress) return;
    const saved = loadHats();
    for (const kid of Object.keys(saved)) {
      if (DEFAULT_HAT[kid] && window.Progress.get('hat|' + kid) == null) window.Progress.set('hat|' + kid, saved[kid]);
    }
  }

  window.addEventListener('goat:progress', applySyncedHats);
  window.addEventListener('DOMContentLoaded', () => { seedSyncedHats(); applySyncedHats(); });

  document.addEventListener('click', e => {
    const slot = e.target.closest && e.target.closest('.hat-slot');
    if (!slot) return;
    e.preventDefault();
    e.stopPropagation();
    cycle(slot.dataset.kid);
  }, true);

  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('hat-slot')) {
      e.preventDefault();
      cycle(e.target.dataset.kid);
    }
  });

  window.Mascot = { svg, cycle, hatName: kid => hatOf(kid).name };
})();
