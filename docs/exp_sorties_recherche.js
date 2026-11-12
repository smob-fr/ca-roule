/* Prototype de recherche de niveaux « sorties limitées » par escalade (expérience), remplacé par tools/gen_course.js. */
const { analyse } = require('./exp_sorties_moteur.js');
const W = 6, H = 8, COLORS = ['red', 'blue', 'yellow'];
let seed = (+process.argv[2] || 1) * 7919;
const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const pick = a => a[(rnd() * a.length) | 0];
const cellsOf = c => { const o = []; for (let k = 0; k < c.len; k++) o.push(c.h ? c.line * W + c.pos + k : (c.pos + k) * W + c.line); return o; };
function freeCells(cars, skip) { const u = new Set(); cars.forEach((c, i) => { if (i !== skip) cellsOf(c).forEach(x => u.add(x)); }); return u; }
function carFor(gates, used) {
  for (let t = 0; t < 60; t++) {
    const g = pick(gates), h = g.side === 'L' || g.side === 'R', len = rnd() < 0.25 ? 3 : 2, N = h ? W : H;
    const c = { h, line: g.at, pos: (rnd() * (N - len + 1)) | 0, len, dir: g.side === 'R' || g.side === 'B' ? 1 : -1, color: g.color === 'any' ? pick(COLORS) : g.color };
    if (cellsOf(c).every(x => !used.has(x))) return c;
  }
  return null;
}
function randomGates() {
  const gates = [], taken = new Set(), ng = 5 + ((rnd() * 2) | 0);
  while (gates.length < ng) {
    const side = pick(['T', 'B', 'L', 'R']), at = (rnd() * (side === 'T' || side === 'B' ? W : H)) | 0;
    if (taken.has(side + at)) continue;
    taken.add(side + at);
    gates.push({ side, at, color: gates.length < 2 ? 'any' : pick(COLORS) });
  }
  return gates;
}
function mutate(L) {
  const cars = L.cars.map(c => ({ ...c })), gates = L.gates.map(g => ({ ...g })), op = rnd();
  if (op < 0.5 && cars.length) { const i = (rnd() * cars.length) | 0, c = carFor(gates, freeCells(cars, i)); if (c) cars[i] = c; }
  else if (op < 0.7 && cars.length < 12) { const c = carFor(gates, freeCells(cars, -1)); if (c) cars.push(c); }
  else if (op < 0.8 && cars.length > 7) cars.splice((rnd() * cars.length) | 0, 1);
  else { const i = (rnd() * cars.length) | 0; const c = { ...cars[i] }; c.pos = Math.max(0, Math.min((c.h ? W : H) - c.len, c.pos + (rnd() < 0.5 ? -1 : 1))); if (cellsOf(c).every(x => !freeCells(cars, i).has(x))) cars[i] = c; }
  /* une voiture dont la porte a disparu est retirée */
  return { W, H, gates, cars: cars.filter(c => gates.some(g => g.at === c.line && g.side === (c.h ? (c.dir > 0 ? 'R' : 'L') : (c.dir > 0 ? 'B' : 'T')) && (g.color === 'any' || g.color === c.color))) };
}
function naive(A, tries) {
  let wins = 0;
  for (let k = 0; k < tries; k++) {
    let s = 0;
    for (let step = 0; step < 80; step++) {
      const out = A.E[s];
      if (!out.length) break;
      const gone = P => P.filter(x => x < 0).length;
      const exits = out.filter(([, t]) => gone(A.S[t]) > gone(A.S[s]));
      s = (exits.length ? exits[(rnd() * exits.length) | 0] : out[(rnd() * out.length) | 0])[1];
      if (A.S[s].every(x => x < 0)) { wins++; break; }
    }
  }
  return wins / tries;
}
function evaluate(L) {
  const A = analyse(L, 150000);
  if (!A || !A.solvable) return null;
  const extra = A.opt - L.cars.length, nv = naive(A, 150), dead = A.win.filter(x => x < 0).length / A.states;
  return { A, extra, nv, dead, score: extra * 10 + (1 - nv) * 12 + dead * 4 };
}
const keep = [];
const t0 = Date.now(), limit = (+process.argv[3] || 90) * 1000;
while (Date.now() - t0 < limit) {
  let L = { W, H, gates: randomGates(), cars: [] };
  for (let k = 0; k < 9; k++) { const c = carFor(L.gates, freeCells(L.cars, -1)); if (c) L.cars.push(c); }
  let ev = evaluate(L), stall = 0;
  if (!ev) continue;
  while (stall < 150 && Date.now() - t0 < limit) {
    const M = mutate(L), e = evaluate(M);
    if (e && e.score >= ev.score) { if (e.score > ev.score) stall = 0; else stall++; L = M; ev = e; } else stall++;
  }
  if (ev.extra >= 2) keep.push({ opt: ev.A.opt, nc: L.cars.length, extra: ev.extra, naive: ev.nv, dead: +ev.dead.toFixed(2), states: ev.A.states, L });
}
keep.sort((a, b) => b.extra - a.extra || a.naive - b.naive);
console.log(keep.length, 'grilles ;', keep.slice(0, 6).map(k => 'opt ' + k.opt + ' / ' + k.nc + ' voitures, +' + k.extra + ' manœuvres, naïf ' + Math.round(k.naive * 100) + '%, impasses ' + Math.round(k.dead * 100) + '%').join(' | '));
require('fs').writeFileSync(__dirname + '/climb_' + process.argv[2] + '.json', JSON.stringify(keep.slice(0, 20)));
