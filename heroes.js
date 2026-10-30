(function () {
  let uid = 0;
  const INK = '#111';

  const toRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const toHex = a => '#' + a.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const x = toRgb(a), y = toRgb(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); };

  const ellipse = (cx, cy, rx, ry) => `M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
  const circle = (cx, cy, r) => ellipse(cx, cy, r, r);
  const star = (cx, cy, R, r) => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const rad = i % 2 ? r : R;
      pts.push((cx + rad * Math.cos(a)).toFixed(1) + ' ' + (cy + rad * Math.sin(a)).toFixed(1));
    }
    return 'M' + pts.join(' L') + ' Z';
  };
  const mirrorWrap = (p, inner) => p.mirror ? `${inner}<g transform="translate(240 0) scale(-1 1)">${inner}</g>` : inner;

  /* a shape with cel shading and an ink outline */
  function part(p, id, i, defs) {
    const pid = `${id}_${i}`;
    const rule = p.evenodd ? ' fill-rule="evenodd" clip-rule="evenodd"' : '';
    defs.push(`<clipPath id="hc${pid}"><path d="${p.d}"${rule}/></clipPath>`);
    const shade = p.noShade ? p.base : mix(p.base, '#2a1840', 0.38);
    const inner = `<path d="${p.d}" fill="${shade}"${rule}/>
      ${p.noShade ? '' : `<path d="${p.d}" fill="${p.base}" transform="translate(-7 -9)" clip-path="url(#hc${pid})"${rule}/>`}
      <path d="${p.d}" fill="none" stroke="${INK}" stroke-width="${p.w || 5}" stroke-linejoin="round"/>`;
    return mirrorWrap(p, inner);
  }

  /* a limb: ink outline underneath, colour on top, with a thin shade line along one side */
  function tube(points, w, color) {
    const d = 'M' + points.map(p => p.join(' ')).join(' L');
    return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 10}" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${d}" fill="none" stroke="${mix(color, '#2a1840', 0.38)}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${d}" fill="none" stroke="${color}" stroke-width="${w * 0.66}" stroke-linecap="round" stroke-linejoin="round" transform="translate(-2 -3)"/>`;
  }

  function eye(cx, cy, side, iris = '#2f7be0', tilt = 10) {
    const rot = side * -1 * tilt;
    return `<g transform="translate(${cx} ${cy}) rotate(${rot})">
      <path d="M-14 0 C-8 -10 8 -10 14 0 C8 9 -8 9 -14 0 Z" fill="#fff" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>
      <circle cx="1" cy="0" r="6" fill="${iris}"/><circle cx="1" cy="0" r="3.4" fill="#111"/>
      <circle cx="4" cy="-2.5" r="2.2" fill="#fff"/></g>`;
  }

  const RED = '#d62839', WHITE = '#f6f3ea', BLUE = '#1f4fb5', SKIN = '#f2b88f', BOOT = '#7a1f2b';

  /* the head, drawn in a 240 x 280 space so it can be placed and scaled */
  function head(id, defs) {
    const parts = [
      { d: 'M120 34 C172 34 198 70 198 112 C198 152 178 180 150 190 L90 190 C62 180 42 152 42 112 C42 70 68 34 120 34 Z', base: BLUE },
      { mirror: true, d: 'M66 114 L22 102 L58 96 L26 78 L68 86 Z', base: WHITE, noShade: true, w: 4 },
      { d: 'M76 88 C98 78 142 78 164 88 C174 116 172 150 154 172 C142 184 98 184 86 172 C68 150 66 116 76 88 Z', base: SKIN },
    ];
    const body = parts.map((p, i) => part(p, id, 'h' + i, defs)).join('');
    const aLetter = part({ d: 'M120 36 L141 80 L129 80 L126 72 L114 72 L111 80 L99 80 Z M120 52 L124.5 63 L115.5 63 Z', base: WHITE, evenodd: true, noShade: true, w: 3.5 }, id, 'al', defs);
    const strap = `<path d="M76 124 C74 152 88 172 106 180 M164 124 C166 152 152 172 134 180" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" opacity=".55"/>`;
    const brows = `<path d="M86 104 L114 109" stroke="#5a3418" stroke-width="7" stroke-linecap="round"/><path d="M154 104 L126 109" stroke="#5a3418" stroke-width="7" stroke-linecap="round"/>`;
    const nose = `<path d="M120 118 L115 138 L124 141" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
    const mouth = `<path d="M103 156 Q120 163 137 154" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M112 170 L128 170" stroke="#b97b55" stroke-width="3" stroke-linecap="round"/>`;
    return `${body}${strap}${aLetter}${eye(101, 118, -1)}${eye(139, 118, 1)}${brows}${nose}${mouth}`;
  }

  /* a bare face with hair, drawn in the same 240 x 280 head space */
  const FACE = 'M76 88 C98 78 142 78 164 88 C174 116 172 150 154 172 C142 184 98 184 86 172 C68 150 66 116 76 88 Z';
  function personHead(id, defs, c) {
    const bits = [];
    let n = 0;
    const add = p => bits.push(part(p, id, 'p' + (n++), defs));
    add({ d: c.hairBack, base: c.hair });
    add({ d: FACE, base: c.skin || SKIN });
    if (c.stubble) add({ d: c.stubble, base: c.stubbleColor || '#9a7a5a', noShade: true, w: 0.01 });
    if (c.beard) add({ d: c.beard, base: c.hair });
    add({ d: c.hairFront, base: c.hair });
    if (c.extra) add({ d: c.extra, base: c.extraColor || '#d62839', w: 4 });
    const brow = `<path d="${c.brows[0]}" stroke="${c.browColor}" stroke-width="7" stroke-linecap="round"/><path d="${c.brows[1]}" stroke="${c.browColor}" stroke-width="7" stroke-linecap="round"/>`;
    const nose = `<path d="M120 118 L115 138 L124 141" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
    const mouth = `<path d="${c.mouth}" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
    return `${bits.join('')}${eye(101, 120, -1, c.iris, c.tilt)}${eye(139, 120, 1, c.iris, c.tilt)}${brow}${nose}${mouth}`;
  }

  const speedLines = `<g stroke="${INK}" stroke-linecap="round" fill="none">
    <path d="M214 70 L292 52" stroke-width="5"/><path d="M232 112 L298 104" stroke-width="4"/>
    <path d="M226 206 L296 214" stroke-width="5"/><path d="M236 258 L292 276" stroke-width="4"/>
    <path d="M40 70 L8 84" stroke-width="4"/></g>`;
  const speedLinesSoft = '<g stroke="#111" stroke-linecap="round" fill="none" opacity=".5"><path d="M16 120 L52 116" stroke-width="3"/><path d="M262 150 L292 146" stroke-width="3"/></g>';
  const groundShadow = '<ellipse cx="158" cy="330" rx="104" ry="9" fill="#000" opacity=".22"/>';

  const HEROES = {
    /* head-and-shoulders portrait */
    'captain-america': {
      label: 'Captain America, stylized portrait',
      viewBox: '-10 -34 240 280',
      build(id, defs) {
        const back = [
          { d: circle(120, 152, 106), base: RED },
          { d: circle(120, 152, 84), base: WHITE },
          { d: circle(120, 152, 62), base: RED },
          { d: circle(120, 152, 40), base: BLUE },
          { d: 'M18 262 C18 212 62 192 120 192 C178 192 222 212 222 262 Z', base: BLUE },
          { d: 'M96 166 L96 198 L144 198 L144 166 Z', base: '#d99a72' },
        ].map((p, i) => part(p, id, 'b' + i, defs)).join('');
        const chestStar = part({ d: star(120, 224, 17, 7), base: WHITE }, id, 'cs', defs);
        return `${back}${head(id, defs)}${chestStar}`;
      },
    },

    /* full body, charging forward behind the shield */
    'captain-america-action': {
      label: 'Captain America charging with his shield',
      viewBox: '0 0 300 340',
      build(id, defs) {
        const speed = `<g stroke="${INK}" stroke-linecap="round" fill="none">
          <path d="M214 70 L292 52" stroke-width="5"/><path d="M232 112 L298 104" stroke-width="4"/>
          <path d="M226 206 L296 214" stroke-width="5"/><path d="M236 258 L292 276" stroke-width="4"/>
          <path d="M40 70 L8 84" stroke-width="4"/></g>`;
        const shadow = '<ellipse cx="158" cy="330" rx="104" ry="9" fill="#000" opacity=".22"/>';

        const backLeg = tube([[168, 218], [212, 262], [248, 300]], 32, BLUE)
          + part({ d: 'M232 292 L270 286 C284 292 292 304 288 316 L244 322 C232 316 226 302 232 292 Z', base: BOOT }, id, 'bb', defs);
        const rightArm = tube([[198, 156], [248, 186], [266, 146]], 28, BLUE)
          + part({ d: circle(268, 138, 18), base: BOOT }, id, 'fist', defs);
        const torso = part({ d: 'M94 148 C104 134 196 134 206 148 L184 220 L116 220 Z', base: BLUE }, id, 'to', defs)
          + part({ d: 'M114 214 L186 214 L184 228 L116 228 Z', base: '#5a3418', w: 4 }, id, 'be', defs)
          + part({ d: star(150, 176, 16, 6.5), base: WHITE, w: 4 }, id, 'st', defs);
        const frontLeg = tube([[134, 222], [108, 268], [98, 308]], 34, BLUE)
          + part({ d: 'M66 298 C76 284 118 284 126 300 L130 322 L62 322 C58 312 60 304 66 298 Z', base: BOOT }, id, 'fb', defs);
        const leftShoulder = tube([[104, 156], [80, 190]], 28, BLUE);

        const headG = `<g transform="rotate(-8 148 102)"><g transform="translate(55 14) scale(.78)">${head(id, defs)}</g></g>`;

        const sc = (rx, ry) => ellipse(86, 216, rx, ry);
        const shield = `<g transform="rotate(-22 86 216)">
          ${part({ d: sc(70, 60), base: RED }, id, 's1', defs)}
          ${part({ d: sc(56, 47), base: WHITE }, id, 's2', defs)}
          ${part({ d: sc(42, 34), base: RED }, id, 's3', defs)}
          ${part({ d: sc(28, 22), base: BLUE }, id, 's4', defs)}
          ${part({ d: star(86, 216, 20, 8), base: WHITE, w: 4 }, id, 's5', defs)}
        </g>`;
        const whoosh = `<path d="M24 118 Q4 190 32 262" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/><path d="M24 118 Q4 190 32 262" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`;

        return `${speed}${shadow}<g transform="rotate(-6 150 200)">${backLeg}${rightArm}${torso}${frontLeg}${leftShoulder}${headG}${shield}${whoosh}</g>`;
      },
    },

    /* striding forward, sword drawn, cloak streaming behind */
    'aragorn-action': {
      label: 'Aragorn striding forward with his sword drawn',
      viewBox: '0 0 300 340',
      build(id, defs) {
        const CLOAK = '#3d5c3c', TUNIC = '#4a5568', PANTS = '#5b4a3a', BOOTC = '#2f2118', LEATHER = '#6b4423', STEEL = '#dfe7ee', GOLD = '#b8893a';
        const cloak = part({ d: 'M118 144 C170 128 246 150 292 236 L270 228 L278 254 L246 246 L248 272 L214 256 C186 248 160 234 132 206 Z', base: CLOAK }, id, 'cl', defs);
        const backLeg = tube([[168, 220], [212, 262], [248, 300]], 30, PANTS)
          + part({ d: 'M232 292 L270 286 C284 292 292 304 288 316 L244 322 C232 316 226 302 232 292 Z', base: BOOTC }, id, 'bb', defs);
        const frontLeg = tube([[134, 222], [108, 268], [98, 308]], 32, PANTS)
          + part({ d: 'M66 298 C76 284 118 284 126 300 L130 322 L62 322 C58 312 60 304 66 298 Z', base: BOOTC }, id, 'fb', defs);
        const torso = part({ d: 'M94 148 C104 134 196 134 206 148 L184 220 L116 220 Z', base: TUNIC }, id, 'to', defs)
          + part({ d: 'M114 212 L186 212 L184 226 L116 226 Z', base: LEATHER, w: 4 }, id, 'be', defs)
          + part({ d: star(150, 152, 9, 4), base: STEEL, w: 3 }, id, 'br', defs);
        const leftArm = tube([[104, 158], [74, 178], [48, 170]], 26, TUNIC)
          + part({ d: circle(44, 168, 11), base: SKIN, w: 4 }, id, 'lh', defs);
        const rightArm = tube([[198, 156], [236, 150], [260, 118]], 26, TUNIC);
        const sword = `<path d="M262 108 L190 22" fill="none" stroke="${INK}" stroke-width="20" stroke-linecap="round"/>
          <path d="M262 108 L190 22" fill="none" stroke="#9fb0c0" stroke-width="12" stroke-linecap="round"/>
          <path d="M260 104 L192 24" fill="none" stroke="${STEEL}" stroke-width="7" stroke-linecap="round"/>
          <path d="M255 96 L204 36" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`
          + tube([[248, 112], [282, 96]], 7, GOLD)
          + tube([[268, 112], [282, 130]], 8, LEATHER)
          + part({ d: circle(264, 116, 12), base: SKIN, w: 4 }, id, 'rh', defs);
        const headG = `<g transform="rotate(-8 148 102)"><g transform="translate(55 14) scale(.78)">${personHead(id, defs, {
          hair: '#3b2616',
          hairBack: 'M44 124 C40 64 80 30 120 30 C165 30 202 64 198 126 C206 170 196 198 186 216 L170 190 C176 150 174 100 160 86 C140 80 100 80 80 86 C66 100 64 150 70 190 L54 216 C44 198 36 170 44 124 Z',
          hairFront: 'M70 98 C82 66 158 66 170 98 C152 80 98 80 70 98 Z',
          stubble: 'M80 140 C92 178 148 178 160 140 C150 162 90 162 80 140 Z', stubbleColor: '#8c6a4a',
          iris: '#7aa3b8', browColor: '#2a1a0e', tilt: 8,
          brows: ['M86 105 L114 110', 'M154 105 L126 110'],
          mouth: 'M106 158 L134 156',
        })}</g></g>`;
        return `${speedLines}${groundShadow}<g transform="rotate(-6 150 200)">${cloak}${backLeg}${leftArm}${torso}${frontLeg}${rightArm}${sword}${headG}</g>`;
      },
    },

    /* calm, wide ready stance, lightsaber held out in front */
    'obi-wan-action': {
      label: 'Obi-Wan Kenobi in a calm ready stance with a lightsaber',
      viewBox: '0 0 300 340',
      build(id, defs) {
        const ROBE = '#b08a5a', ROBE_D = '#8f6c3f', TUNIC = '#ead9b6', PANTS = '#7a5c3a', BOOTC = '#3b2a1c', BELT = '#5a3a1c';
        const robe = part({ d: 'M100 140 C150 130 252 168 276 252 L244 244 L246 274 L204 254 L186 280 L156 240 Z', base: ROBE_D }, id, 'rb', defs);
        const backLeg = tube([[166, 222], [198, 266], [228, 306]], 32, PANTS)
          + part({ d: 'M212 298 L250 296 C264 302 270 314 266 322 L220 324 C208 318 204 306 212 298 Z', base: BOOTC }, id, 'bb', defs);
        const frontLeg = tube([[136, 222], [100, 262], [84, 306]], 34, PANTS)
          + part({ d: 'M54 296 C64 282 106 282 114 298 L118 322 L50 322 C46 312 48 302 54 296 Z', base: BOOTC }, id, 'fb', defs);
        const torso = part({ d: 'M94 148 C104 134 196 134 206 148 L186 222 L114 222 Z', base: TUNIC }, id, 'to', defs)
          + part({ d: 'M104 142 L152 194 L132 224 L112 224 L98 160 Z', base: ROBE, w: 4 }, id, 'pl', defs)
          + part({ d: 'M196 142 L148 194 L168 224 L188 224 L202 160 Z', base: ROBE, w: 4 }, id, 'pr', defs)
          + part({ d: 'M112 214 L188 214 L186 230 L114 230 Z', base: BELT, w: 4 }, id, 'be', defs);
        const leftArm = tube([[104, 158], [118, 206], [172, 204]], 26, ROBE);
        const rightArm = tube([[198, 156], [226, 192], [198, 210]], 26, ROBE);
        const blade = `<path d="M178 200 L36 150" fill="none" stroke="#4cc3ff" stroke-width="30" stroke-linecap="round" opacity=".28"/>
          <path d="M178 200 L36 150" fill="none" stroke="${INK}" stroke-width="18" stroke-linecap="round"/>
          <path d="M178 200 L36 150" fill="none" stroke="#4cc3ff" stroke-width="11" stroke-linecap="round"/>
          <path d="M172 198 L44 153" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`;
        const hilt = tube([[176, 200], [206, 210]], 10, '#9aa4ae');
        const hands = part({ d: circle(182, 202, 11), base: SKIN, w: 4 }, id, 'h1', defs) + part({ d: circle(200, 208, 11), base: SKIN, w: 4 }, id, 'h2', defs);
        const headG = `<g transform="rotate(4 148 102)"><g transform="translate(55 14) scale(.78)">${personHead(id, defs, {
          hair: '#a0642c',
          hairBack: 'M60 106 C58 54 96 32 124 34 C168 36 192 70 186 112 C186 152 176 182 150 190 L90 190 C64 180 60 152 60 106 Z',
          hairFront: 'M62 98 C60 60 100 42 124 44 C160 46 184 66 178 100 C170 82 150 74 120 74 C92 74 70 82 62 98 Z',
          beard: 'M78 126 C80 178 100 194 120 194 C140 194 160 178 164 126 C156 152 140 162 120 162 C100 162 86 152 78 126 Z',
          iris: '#5a8fc9', browColor: '#7a4a1e', tilt: 4,
          brows: ['M88 107 L114 106', 'M152 107 L126 106'],
          mouth: 'M108 160 Q120 166 132 160',
        })}</g></g>`;
        return `${speedLines}${groundShadow}<g transform="rotate(3 150 200)">${robe}${backLeg}${frontLeg}${torso}${leftArm}${rightArm}${blade}${hilt}${hands}${headG}</g>`;
      },
    },

    /* calm, unhurried, leaning on his staff under falling peach blossoms */
    'oogway-action': {
      label: 'Master Oogway leaning on his staff',
      viewBox: '0 0 300 340',
      build(id, defs) {
        const GREEN = '#9bb06a', SHELL = '#7a5c32', BELLY = '#e7d49a', WOOD = '#7a4a22';
        const petals = [[40, 60, 8], [86, 30, 7], [250, 40, 8], [272, 110, 7], [30, 170, 7], [270, 200, 8], [60, 250, 7], [240, 280, 7], [140, 24, 6], [200, 34, 7]]
          .map(([x, y, r], i) => part({ d: ellipse(x, y, r, r * 0.6), base: '#ffb7c8', w: 3, noShade: true }, id, 'pt' + i, defs)).join('');
        const shell = part({ d: 'M70 160 C60 92 120 70 160 74 C230 80 266 140 254 214 C244 244 190 254 150 254 C100 254 76 226 70 160 Z', base: SHELL }, id, 'sh', defs)
          + `<g fill="none" stroke="${INK}" stroke-width="3" opacity=".45"><path d="M196 110 L224 124 L224 156 L196 170 L168 156 L168 124 Z"/><path d="M222 176 L246 188 L246 214 L222 226 L198 214 L198 188 Z"/><path d="M98 120 L118 112 L134 124 L134 148 L116 158 L98 148 Z"/></g>`;
        const legs = tube([[132, 256], [128, 294]], 28, GREEN) + tube([[188, 256], [192, 294]], 28, GREEN)
          + part({ d: ellipse(128, 304, 30, 14), base: GREEN }, id, 'f1', defs) + part({ d: ellipse(194, 304, 30, 14), base: GREEN }, id, 'f2', defs);
        const body = part({ d: 'M110 172 C108 138 212 138 210 172 C216 222 196 264 160 268 C124 264 104 222 110 172 Z', base: GREEN }, id, 'bo', defs)
          + part({ d: 'M128 180 C128 160 192 160 192 180 C196 226 180 254 160 256 C140 254 124 226 128 180 Z', base: BELLY }, id, 'be', defs)
          + `<g fill="none" stroke="${INK}" stroke-width="3" opacity=".4"><path d="M130 196 L190 196"/><path d="M132 214 L188 214"/><path d="M138 232 L182 232"/></g>`;
        const staff = `<path d="M240 328 L228 74" fill="none" stroke="${INK}" stroke-width="20" stroke-linecap="round"/><path d="M240 328 L228 74" fill="none" stroke="${WOOD}" stroke-width="11" stroke-linecap="round"/>
          <path d="M228 74 C226 40 268 40 266 70 C264 86 244 88 240 76" fill="none" stroke="${INK}" stroke-width="20" stroke-linecap="round"/><path d="M228 74 C226 40 268 40 266 70 C264 86 244 88 240 76" fill="none" stroke="${WOOD}" stroke-width="11" stroke-linecap="round"/>`;
        const arms = tube([[110, 176], [88, 208]], 24, GREEN) + part({ d: circle(86, 214, 13), base: GREEN, w: 4 }, id, 'lh', defs)
          + tube([[206, 176], [232, 206]], 24, GREEN) + part({ d: circle(234, 206, 14), base: GREEN, w: 4 }, id, 'rh', defs);
        const headParts = part({ d: 'M112 100 C112 60 208 60 208 100 C212 130 192 152 160 152 C128 152 108 130 112 100 Z', base: GREEN }, id, 'hd', defs);
        const lid = (cx) => `<path d="M${cx - 15} 100 Q${cx} 92 ${cx + 15} 100" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
          <path d="M${cx - 13} 101 C${cx - 7} 111 ${cx + 7} 111 ${cx + 13} 101 Z" fill="#fff" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><circle cx="${cx + 1}" cy="105" r="3.6" fill="#111"/>`;
        const brow = (d) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="16" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"/>`;
        const face = `${lid(138)}${lid(182)}${brow('M110 90 C118 78 140 82 152 92')}${brow('M210 90 C202 78 180 82 168 92')}
          <path d="M146 132 Q160 142 174 132" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
          <circle cx="154" cy="118" r="2.6" fill="${INK}"/><circle cx="166" cy="118" r="2.6" fill="${INK}"/>
          <path d="M128 144 C140 152 180 152 192 144" fill="none" stroke="${INK}" stroke-width="3" opacity=".35"/>`;
        return `${speedLinesSoft}${groundShadow}<g transform="rotate(-3 150 200)">${petals}${shell}${legs}${body}${arms}${staff}${headParts}${face}</g>`;
      },
    },

    /* sprinting through the finish tape with a gold medal */
    'wilma-action': {
      label: 'Wilma Rudolph sprinting through the finish tape',
      viewBox: '0 0 300 340',
      build(id, defs) {
        const SKINW = '#8a5a3a', WHITEW = '#f6f3ea', BLUEW = '#1f4fb5', SHOE = '#d62839';
        const tape = (d) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="16" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#d62839" stroke-width="9" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-dasharray="9 17"/>`;
        const tapes = tape('M4 176 C40 166 80 184 112 174') + tape('M196 178 C230 168 268 188 298 176');
        const backLeg = tube([[172, 218], [218, 252], [264, 226]], 26, SKINW)
          + part({ d: 'M252 214 L290 206 C300 214 298 228 288 232 L258 238 C250 232 248 222 252 214 Z', base: SHOE }, id, 'bs', defs);
        const frontLeg = tube([[148, 222], [102, 240], [98, 288]], 28, SKINW)
          + part({ d: 'M66 280 C76 270 118 270 124 286 L128 306 L62 308 C58 298 60 288 66 280 Z', base: SHOE }, id, 'fs', defs);
        const shorts = part({ d: 'M124 196 L196 196 L206 238 L152 246 L120 234 Z', base: BLUEW }, id, 'sh', defs);
        const torso = part({ d: 'M112 148 C124 136 190 136 204 150 L196 204 L122 204 Z', base: WHITEW }, id, 'to', defs)
          + part({ d: 'M118 166 L200 166 L199 178 L117 178 Z', base: '#d62839', w: 3 }, id, 'tr', defs);
        const armFront = tube([[122, 154], [82, 174], [84, 138]], 26, SKINW) + part({ d: circle(84, 130, 14), base: SKINW, w: 4 }, id, 'af', defs);
        const armBack = tube([[196, 156], [238, 180], [266, 214]], 26, SKINW) + part({ d: circle(270, 218, 14), base: SKINW, w: 4 }, id, 'ab', defs);
        const medal = `<path d="M136 150 L152 190 L168 150" fill="none" stroke="${INK}" stroke-width="9" stroke-linejoin="round"/><path d="M136 150 L152 190 L168 150" fill="none" stroke="#1f4fb5" stroke-width="5" stroke-linejoin="round"/>`
          + part({ d: circle(152, 194, 12), base: '#f2b705', w: 4 }, id, 'md', defs);
        const headG = `<g transform="rotate(-8 148 102)"><g transform="translate(46 14) scale(.78)">${personHead(id, defs, {
          skin: SKINW, hair: '#2a1a12',
          hairBack: 'M64 108 C60 56 100 34 126 36 C170 38 192 66 188 108 C188 150 176 180 150 188 L90 188 C66 178 64 150 64 108 Z',
          hairFront: 'M66 98 C62 62 100 44 126 46 C160 48 184 68 180 100 C170 82 150 76 122 76 C94 76 72 82 66 98 Z',
          extra: 'M66 90 C100 78 150 78 182 90 L182 102 C150 90 100 90 66 102 Z', extraColor: '#d62839',
          iris: '#3a2518', browColor: '#1a0f08', tilt: 10,
          brows: ['M86 104 L114 109', 'M154 104 L126 109'],
          mouth: 'M102 154 Q120 172 138 154',
        })}</g></g>`;
        return `${speedLines}${groundShadow}<g transform="rotate(-5 150 200)">${backLeg}${armBack}${tapes}${shorts}${torso}${frontLeg}${armFront}${medal}${headG}</g>`;
      },
    },

    /* a small hobbit on a very long walk, pack on his back, staff in hand */
    'frodo-action': {
      label: 'Frodo striding with his pack and walking staff',
      viewBox: '0 0 300 340',
      build(id, defs) {
        const SKINF = '#f4c9a0', CLOAKF = '#6b7a5a', SHIRT = '#e8dcc0', VEST = '#6b4a2e', BREECH = '#7a5a3a', PACK = '#8a5a2b', ROLL = '#c9a46a', WOODF = '#7a4a22';
        const cloak = part({ d: 'M118 146 C168 132 246 168 272 246 L244 234 L246 264 L208 248 C172 240 140 216 128 196 Z', base: CLOAKF }, id, 'cl', defs);
        const pack = part({ d: 'M190 150 C232 140 264 172 254 216 C246 242 204 246 188 222 Z', base: PACK }, id, 'pk', defs)
          + part({ d: 'M194 132 L254 150 L248 172 L188 154 Z', base: ROLL, w: 4 }, id, 'rl', defs);
        const backLeg = tube([[166, 224], [204, 258]], 34, BREECH) + tube([[204, 258], [234, 296]], 26, SKINF)
          + part({ d: 'M214 294 L258 290 C272 298 274 314 264 320 L222 320 C210 314 206 302 214 294 Z', base: SKINF }, id, 'bf', defs);
        const frontLeg = tube([[136, 224], [108, 262]], 34, BREECH) + tube([[108, 262], [98, 298]], 26, SKINF)
          + part({ d: 'M68 296 C78 286 124 286 126 304 C128 318 70 322 66 308 Z', base: SKINF }, id, 'ff', defs);
        const torso = part({ d: 'M96 150 C106 136 194 136 204 150 L184 222 L116 222 Z', base: SHIRT }, id, 'to', defs)
          + part({ d: 'M104 144 L146 190 L134 224 L114 224 L100 164 Z', base: VEST, w: 4 }, id, 'vl', defs)
          + part({ d: 'M196 144 L154 190 L166 224 L186 224 L200 164 Z', base: VEST, w: 4 }, id, 'vr', defs)
          + part({ d: circle(150, 146, 8), base: '#9ac07a', w: 3 }, id, 'br', defs);
        const leftArm = tube([[104, 160], [76, 172], [54, 150]], 24, SHIRT) + part({ d: circle(50, 146, 12), base: SKINF, w: 4 }, id, 'lh', defs);
        const staff = `<path d="M236 326 L216 66" fill="none" stroke="${INK}" stroke-width="19" stroke-linecap="round"/><path d="M236 326 L216 66" fill="none" stroke="${WOODF}" stroke-width="10" stroke-linecap="round"/>`;
        const rightArm = tube([[198, 158], [228, 184], [222, 210]], 24, SHIRT) + part({ d: circle(222, 208, 13), base: SKINF, w: 4 }, id, 'rh', defs);
        const headG = `<g transform="rotate(-8 148 102)"><g transform="translate(55 14) scale(.78)">${personHead(id, defs, {
          skin: SKINF, hair: '#6b3f20',
          hairBack: 'M60 112 C54 56 96 30 126 32 C172 34 196 62 190 112 C196 150 182 180 150 188 L90 188 C62 180 58 150 60 112 Z',
          hairFront: 'M66 102 C62 60 100 40 126 42 C162 44 186 62 180 102 C174 86 166 94 158 80 C150 94 138 82 128 94 C118 82 106 94 96 82 C88 96 76 92 66 102 Z',
          iris: '#4a7ac4', browColor: '#5a3318', tilt: 6,
          brows: ['M88 105 L114 106', 'M152 105 L126 106'],
          mouth: 'M108 158 Q120 164 132 158',
        })}</g></g>`;
        return `${speedLines}${groundShadow}<g transform="rotate(-5 150 200)">${cloak}${pack}${backLeg}${frontLeg}${torso}${staff}${rightArm}${leftArm}${headG}</g>`;
      },
    },
  };

  function svg(id) {
    const h = HEROES[id];
    if (!h) return '';
    const defs = [];
    const markup = h.build(++uid, defs);
    return `<svg class="hero-art" viewBox="${h.viewBox}" role="img" aria-label="${h.label}"><defs>${defs.join('')}</defs><g class="bob">${markup}</g></svg>`;
  }

  window.Hero = { svg, has: id => !!HEROES[id] };
})();
