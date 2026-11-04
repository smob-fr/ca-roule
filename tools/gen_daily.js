/* Générateur des défis du jour : casse-tête très difficiles.
 * Pour une disposition de voitures tirée au hasard, on explore TOUTES les positions atteignables
 * (parcours en largeur), puis on mesure depuis les positions gagnantes la distance de chaque
 * position (les coups sont réversibles). La position la plus éloignée est le départ le plus dur
 * de cette disposition. On garde celles qui demandent au moins MIN coups.
 * Usage : node tools/gen_daily.js <graine> <secondes> [min=30]   -> data/daily/d_<graine>.json */
const fs = require('fs'), path = require('path');
const E = require('../src/engine.js');
const N = E.PZ_N;
const seed = +process.argv[2] || 1, seconds = +process.argv[3] || 60, MIN = +process.argv[4] || 30;

function rng(s) {
  let a = s >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r = rng(seed * 104729 + 17);
const cellsOf = (c, p) => { const o = []; for (let i = 0; i < c.len; i++) o.push(c.h ? c.fixed * N + p + i : (p + i) * N + c.fixed); return o; };

function randomBoard() {
  const k = 11 + ((r() * 4) | 0);
  const cars = [{ h: true, fixed: 2, len: 2 }], pos = [(r() * 3) | 0];
  const used = new Set(cellsOf(cars[0], pos[0]));
  for (let t = 0; t < 400 && cars.length < k; t++) {
    const len = r() < 0.28 ? 3 : 2, h = r() < 0.5;
    const c = { h, fixed: (r() * N) | 0, len }, p = (r() * (N - len + 1)) | 0;
    if (h && c.fixed === 2) continue;
    const cs = cellsOf(c, p);
    if (cs.some(x => used.has(x))) continue;
    cs.forEach(x => used.add(x));
    cars.push(c); pos.push(p);
  }
  return { cars, pos };
}

/* exploration complète de la composante, puis distances depuis les positions gagnantes */
function hardest(cars, start, cap) {
  const n = cars.length, goalPos = N - cars[0].len;
  const key = P => { let k = 0; for (let i = 0; i < n; i++) k = k * 8 + P[i]; return k; };
  const states = [start.slice()], index = new Map([[key(start), 0]]), adj = [];
  const occ = new Uint8Array(N * N);
  for (let si = 0; si < states.length; si++) {
    if (states.length > cap) return null;
    const P = states[si], nb = [];
    occ.fill(0);
    for (let j = 0; j < n; j++) for (const x of cellsOf(cars[j], P[j])) occ[x] = 1;
    for (let j = 0; j < n; j++) {
      const c = cars[j];
      for (let step = -1; step <= 1; step += 2) {
        let p = P[j];
        for (;;) {
          const front = step > 0 ? p + c.len : p - 1;
          if (front < 0 || front >= N || occ[c.h ? c.fixed * N + front : front * N + c.fixed]) break;
          p += step;
          const T = P.slice(); T[j] = p;
          const kt = key(T);
          let ti = index.get(kt);
          if (ti === undefined) { ti = states.length; index.set(kt, ti); states.push(T); }
          nb.push(ti);
        }
      }
    }
    adj.push(nb);
  }
  const dist = new Int32Array(states.length).fill(-1);
  let q = [];
  states.forEach((s, i) => { if (s[0] >= goalPos) { dist[i] = 0; q.push(i); } });
  if (!q.length) return null;
  let far = q[0];
  while (q.length) {
    const nq = [];
    for (const i of q) for (const t of adj[i]) if (dist[t] < 0) { dist[t] = dist[i] + 1; nq.push(t); far = t; }
    q = nq;
  }
  return { pos: states[far], opt: dist[far], size: states.length };
}

/* petites modifications d'une disposition (on garde la rouge) */
function mutate(b) {
  const cars = b.cars.map(c => ({ ...c })), pos = b.pos.slice(), n = cars.length, op = r();
  const fits = (c, p, skip) => {
    if (c.h && c.fixed === 2) return false;
    const used = new Set();
    cars.forEach((o, i) => { if (i !== skip) cellsOf(o, pos[i]).forEach(x => used.add(x)); });
    return cellsOf(c, p).every(x => !used.has(x));
  };
  const rnd = () => { const len = r() < 0.28 ? 3 : 2; return [{ h: r() < 0.5, fixed: (r() * N) | 0, len }, (r() * (N - len + 1)) | 0]; };
  if (op < 0.45) {
    const i = 1 + ((r() * (n - 1)) | 0);
    for (let t = 0; t < 30; t++) { const [c, p] = rnd(); if (fits(c, p, i)) { cars[i] = c; pos[i] = p; break; } }
  } else if (op < 0.7 && n < 15) {
    for (let t = 0; t < 30; t++) { const [c, p] = rnd(); if (fits(c, p, -1)) { cars.push(c); pos.push(p); break; } }
  } else if (op < 0.85 && n > 9) {
    const i = 1 + ((r() * (n - 1)) | 0); cars.splice(i, 1); pos.splice(i, 1);
  } else {
    const i = 1 + ((r() * (n - 1)) | 0), c = { ...cars[i], len: cars[i].len === 2 ? 3 : 2 };
    for (let p = 0; p <= N - c.len; p++) if (fits(c, p, i)) { cars[i] = c; pos[i] = p; break; }
  }
  return { cars, pos };
}
const canonOf = (cars, p) => p[0] + '|' + cars.slice(1).map((c, i) => [c.h ? 1 : 0, c.fixed, p[i + 1], c.len].join(':')).sort().join(',');

const out = [], seen = new Set(), seenLayout = new Set();
const file = path.join(__dirname, '../data/daily', 'd_' + seed + '.json');
fs.mkdirSync(path.dirname(file), { recursive: true });
const t0 = Date.now();
let tries = 0;
function record(b, h) {
  const k = canonOf(b.cars, h.pos);
  if (seen.has(k)) return;
  seen.add(k);
  const v = E.pzSolve(b.cars, h.pos, 3e6);   /* vérification indépendante par le solveur du jeu */
  if (!v || v.opt !== h.opt) return;
  out.push({ opt: v.opt, ways: v.ways, cars: b.cars.map((c, i) => [c.h ? 1 : 0, c.fixed, h.pos[i], c.len]) });
  console.log('[' + seed + '] ' + Math.round((Date.now() - t0) / 1000) + 's : ' + v.opt + ' coups, ' + b.cars.length + ' voitures (' + out.length + ')');
  fs.writeFileSync(file, JSON.stringify(out));
}
while (Date.now() - t0 < seconds * 1000) {
  /* une escalade : on part d'une disposition au hasard et on garde les variantes plus dures */
  let cur = randomBoard(), h = hardest(cur.cars, cur.pos, 300000);
  if (!h) continue;
  let best = h.opt, stall = 0, kept = 0;
  while (stall < 120 && Date.now() - t0 < seconds * 1000) {
    tries++;
    const cand = mutate(cur), hc = hardest(cand.cars, cand.pos, 300000);
    if (!hc) { stall++; continue; }
    if (hc.opt >= best) {
      if (hc.opt > best) stall = 0; else stall++;
      cur = cand; best = hc.opt;
      if (hc.opt >= MIN && kept < 6) {
        const lk = cand.cars.slice(1).map(c => [c.h ? 1 : 0, c.fixed, c.len].join(':')).sort().join(',');
        if (!seenLayout.has(lk)) { seenLayout.add(lk); kept++; record(cand, hc); }
      }
    } else stall++;
  }
}
fs.writeFileSync(file, JSON.stringify(out));
console.log('[' + seed + '] fini : ' + tries + ' essais, ' + out.length + ' défis');
