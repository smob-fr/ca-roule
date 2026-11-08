/* Générateur des niveaux du mode Course « sorties limitées ».
 * Pour chaque niveau, une fiche (taille, nombre de voitures, manœuvres obligatoires, portes de couleur, barrières)
 * puis une escalade : on part d'une grille au hasard et on garde les variantes qui collent le mieux à la fiche.
 * « Manœuvres » = coups minimum − nombre de voitures : voitures à avancer à moitié pour dégager les autres.
 * Usage : node tools/gen_course.js <premier> <dernier> [secondes par niveau=6]  → data/course/part_<premier>_<dernier>_<s>.json
 * puis node tools/gen_course.js merge → data/course.json */
const fs = require('fs'), path = require('path');
const E = require('../src/engine.js');
const OUT = path.join(__dirname, '../data/course');
const PER_CITY = 25, CITIES = 3;

if (process.argv[2] === 'merge') {
  const all = fs.readdirSync(OUT).filter(f => /^part_[\d_]+\.json$/.test(f)).flatMap(f => JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8')));
  /* plusieurs recherches pour un même niveau : on garde celle qui a le plus de manœuvres, puis la moins facile */
  const best = new Map();
  for (const l of all) { const o = best.get(l.n), x = l.opt - l.cars.length; if (!o || x > o.opt - o.cars.length || (x === o.opt - o.cars.length && l.naive < o.naive)) best.set(l.n, l); }
  const out = [...best.values()].sort((a, b) => a.n - b.n).map(({ n, ...rest }) => rest);
  fs.writeFileSync(path.join(__dirname, '../data/course.json'), JSON.stringify(out));
  console.log(out.length, 'niveaux →', JSON.stringify(out).length, 'octets');
  out.forEach((l, i) => { if (i % 5 === 4 || l.boss) console.log(String(i + 1).padStart(2), l.W + 'x' + l.H, l.cars.length + ' voitures', 'obj ' + l.opt, '+' + (l.opt - l.cars.length), l.hard ? 'Difficile' : '', l.boss ? 'GÉANT' : '', 'naïf→obj ' + l.naive + '%'); });
  process.exit(0);
}

function spec(n) {
  const city = Math.ceil(n / PER_CITY), local = (n - 1) % PER_CITY + 1, boss = local === PER_CITY, hard = !boss && local % 5 === 0;
  const tut = n <= 2;
  const W = boss ? 7 : local <= 4 ? 5 : 6, H = boss ? 9 : local <= 4 ? 6 : local <= 12 ? 7 : 8;
  let cars = tut ? (n === 1 ? 3 : 4) : Math.min(9, 4 + Math.floor(local / 3) + (city - 1));
  let extra = tut ? 0 : local <= 4 ? 1 : local <= 10 ? (city > 1 ? 2 : 1) : local <= 18 ? 2 : 3;
  if (hard) { extra = Math.min(3, extra + 1); cars = Math.min(10, cars + 1); }
  if (boss) { cars = 11; extra = 3; }
  return { n, city, local, boss, hard, W, H, cars, extra, colored: city >= 2, bars: city >= 3 && local >= 2 ? (boss ? 2 : 1) : 0 };
}

let seed = 1;
const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const pick = a => a[(rnd() * a.length) | 0];
const COLORS = ['red', 'blue', 'yellow'], DECO = ['red', 'blue', 'yellow', 'green', 'purple', 'orange'];

function make(sp) {
  const { W, H } = sp, cellsOf = c => { const o = []; for (let k = 0; k < c.len; k++) o.push(c.h ? c.line * W + c.pos + k : (c.pos + k) * W + c.line); return o; };
  const used = cars => { const u = new Set(); cars.forEach(c => cellsOf(c).forEach(x => u.add(x))); return u; };
  function carFor(L, u) {
    for (let t = 0; t < 60; t++) {
      const g = pick(L.gates), h = g.side === 'L' || g.side === 'R', len = rnd() < 0.25 ? 3 : 2, N = h ? W : H;
      const c = { h, line: g.at, pos: (rnd() * (N - len + 1)) | 0, len, dir: g.side === 'R' || g.side === 'B' ? 1 : -1, color: g.color === 'any' ? (sp.colored ? pick(COLORS) : pick(DECO)) : g.color };
      if (cellsOf(c).every(x => !u.has(x)) && !(L.buttons || []).some(b => cellsOf(c).includes(b.y * W + b.x))) return c;
    }
    return null;
  }
  function gates() {
    const out = [], taken = new Set(), ng = sp.boss ? 7 : Math.max(2, Math.min(6, 2 + Math.floor(sp.cars / 2.5)));
    while (out.length < ng) {
      const side = pick(['T', 'B', 'L', 'R']), at = (rnd() * (side === 'T' || side === 'B' ? W : H)) | 0;
      if (taken.has(side + at)) continue;
      taken.add(side + at);
      out.push({ side, at, color: !sp.colored || out.length < 2 ? 'any' : pick(COLORS) });
    }
    return out;
  }
  function fresh() {
    const L = { W, H, gates: gates(), cars: [], bars: [], buttons: [] };
    for (let b = 0; b < sp.bars; b++) {
      const g = L.gates[(rnd() * L.gates.length) | 0];
      if (L.bars.some(x => x.side === g.side && x.at === g.at)) continue;
      L.bars.push({ side: g.side, at: g.at });
      L.buttons.push({ x: (rnd() * W) | 0, y: (rnd() * H) | 0, bar: L.bars.length - 1 });
    }
    for (let k = 0; k < sp.cars; k++) { const c = carFor(L, used(L.cars)); if (c) L.cars.push(c); }
    return L;
  }
  function mutate(L) {
    const M = JSON.parse(JSON.stringify(L)), op = rnd();
    if (op < 0.55 && M.cars.length) { const i = (rnd() * M.cars.length) | 0; const rest = M.cars.filter((_, j) => j !== i); const c = carFor(M, used(rest)); if (c) M.cars[i] = c; }
    else if (op < 0.7 && M.cars.length < sp.cars + 1) { const c = carFor(M, used(M.cars)); if (c) M.cars.push(c); }
    else if (op < 0.8 && M.cars.length > sp.cars - 1) M.cars.splice((rnd() * M.cars.length) | 0, 1);
    else if (op < 0.92 && M.buttons.length) { const b = M.buttons[(rnd() * M.buttons.length) | 0]; b.x = (rnd() * W) | 0; b.y = (rnd() * H) | 0; }
    else { const i = (rnd() * M.cars.length) | 0, c = M.cars[i]; if (c) { c.pos = Math.max(0, Math.min((c.h ? W : H) - c.len, c.pos + (rnd() < 0.5 ? -1 : 1))); if (cellsOf(c).some(x => used(M.cars.filter((_, j) => j !== i)).has(x))) return L; } }
    /* pas de voiture posée sur un bouton au départ */
    if (M.cars.some(c => M.buttons.some(b => cellsOf(c).includes(b.y * W + b.x)))) return L;
    return M;
  }
  return { fresh, mutate };
}
/* joueur « naïf » : sort une voiture dès qu'il le peut, sinon touche au hasard ; % de parties à l'objectif */
function naive(A, tries) {
  let ok = 0;
  for (let k = 0; k < tries; k++) {
    let s = 0, m = 0;
    for (; m < 60; m++) {
      const out = A.E[s];
      if (!out.length) break;
      const gone = Q => Q.slice(0, -1).filter(x => x < 0).length, ex = out.filter(([, t]) => gone(A.S[t]) > gone(A.S[s]));
      s = (ex.length ? ex[(rnd() * ex.length) | 0] : out[(rnd() * out.length) | 0])[1];
      if (A.win[s] === 0) { m++; break; }
    }
    if (A.win[s] === 0 && m <= A.opt) ok++;
  }
  return Math.round(ok / tries * 100);
}
function evaluate(sp, L) {
  if (L.cars.length < Math.max(2, sp.cars - 1)) return null;
  const A = E.crAnalyse(L, null, 300000);
  if (!A || !A.solvable) return null;
  const extra = A.opt - L.cars.length;
  /* une barrière doit servir : sans elle (ouverte d'emblée), le niveau doit être différent */
  let barsUseful = true;
  if (L.bars.length) { const B = E.crAnalyse(L, L.cars.map(c => c.pos).concat([(1 << L.bars.length) - 1]), 300000); barsUseful = !!B && B.win[0] !== A.opt; }
  const dead = A.win.filter(x => x < 0).length / A.states;
  const score = -Math.abs(extra - sp.extra) * 20 - Math.abs(L.cars.length - sp.cars) * 6 + (barsUseful ? 0 : -25) + dead * 10 + Math.min(extra, sp.extra + 1);
  return { A, extra, score, dead, barsUseful };
}
function level(n, seconds) {
  const sp = spec(n);
  seed = n * 104729 + 7;
  const gen = make(sp), t0 = Date.now();
  let best = null;
  while (Date.now() - t0 < seconds * 1000) {
    let L = gen.fresh(), ev = evaluate(sp, L), stall = 0;
    if (!ev) continue;
    while (stall < 80 && Date.now() - t0 < seconds * 1000) {
      const M = gen.mutate(L), e = M === L ? null : evaluate(sp, M);
      if (e && e.score >= ev.score) { if (e.score > ev.score) stall = 0; else stall++; L = M; ev = e; } else stall++;
      if (ev.extra === sp.extra && Math.abs(L.cars.length - sp.cars) <= 0 && ev.barsUseful && ev.dead > 0.05) break;
    }
    if (!best || ev.score > best.ev.score) best = { L, ev };
    if (best.ev.extra === sp.extra && best.L.cars.length === sp.cars && best.ev.barsUseful) break;
  }
  const { L, ev } = best;
  return {
    n, city: sp.city, hard: sp.hard || undefined, boss: sp.boss || undefined, W: L.W, H: L.H, opt: ev.A.opt, naive: naive(ev.A, 300),
    gates: L.gates.map(g => [g.side, g.at, g.color]), bars: L.bars.map(b => [b.side, b.at]), buttons: L.buttons.map(b => [b.x, b.y, b.bar]),
    cars: L.cars.map(c => [c.h ? 1 : 0, c.line, c.pos, c.len, c.dir, c.color])
  };
}
const a = +process.argv[2] || 1, b = +process.argv[3] || a, sec = +process.argv[4] || 6, out = [];
fs.mkdirSync(OUT, { recursive: true });
for (let n = a; n <= b; n++) {
  const l = level(n, spec(n).boss ? sec * 4 : sec);
  out.push(l);
  console.log('niveau', n, l.W + 'x' + l.H, l.cars.length, 'voitures, objectif', l.opt, '(+' + (l.opt - l.cars.length) + ')', 'naïf→objectif', l.naive + '%');
  fs.writeFileSync(path.join(OUT, 'part_' + a + '_' + b + '_' + sec + '.json'), JSON.stringify(out));
}
