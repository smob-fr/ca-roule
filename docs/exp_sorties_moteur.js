/* Prototype de la règle « sorties limitées » (expérience du 6 novembre 2026), remplacé par crSlide/crAnalyse dans src/engine.js. */
/* Règle « sorties limitées » : une voiture touchée avance jusqu'au premier obstacle ;
   elle sort si elle arrive au bord face à une porte de sa couleur (ou une porte verte « toutes couleurs »). */
function makeLevel(W, H, cars, gates) { return { W, H, cars, gates }; }
const gateAt = (L, side, line) => L.gates.find(g => g.side === side && g.at === line);
function occ(L, P, skip) {
  const g = new Int8Array(L.W * L.H).fill(-1);
  L.cars.forEach((c, i) => { if (i === skip || P[i] < 0) return; for (let k = 0; k < c.len; k++) g[c.h ? c.line * L.W + P[i] + k : (P[i] + k) * L.W + c.line] = i; });
  return g;
}
/* résultat d'un toucher : nouvelle position, -1 si sortie, ou null si la voiture ne bouge pas */
function slide(L, P, i, g) {
  const c = L.cars[i], N = c.h ? L.W : L.H;
  g = g || occ(L, P, -1);
  let p = P[i];
  for (;;) {
    const front = c.dir > 0 ? p + c.len : p - 1;
    if (front < 0 || front >= N) {
      const side = c.h ? (c.dir > 0 ? 'R' : 'L') : (c.dir > 0 ? 'B' : 'T'), gt = gateAt(L, side, c.line);
      if (gt && (gt.color === 'any' || gt.color === c.color)) return -1;
      break;
    }
    const cell = c.h ? c.line * L.W + front : front * L.W + c.line;
    if (g[cell] >= 0) break;
    p += c.dir;
  }
  return p === P[i] ? null : p;
}
const key = P => P.join(',');
/* exploration complète (les voitures n'avancent que dans un sens : graphe fini) */
function analyse(L, cap) {
  const start = L.cars.map(c => c.pos), idx = new Map([[key(start), 0]]), S = [start], E = [];
  for (let s = 0; s < S.length; s++) {
    if (S.length > (cap || 400000)) return null;
    const P = S[s], g = occ(L, P, -1), out = [];
    for (let i = 0; i < P.length; i++) {
      if (P[i] < 0) continue;
      const r = slide(L, P, i, g);
      if (r === null) continue;
      const T = P.slice(); T[i] = r;
      const k = key(T);
      let t = idx.get(k);
      if (t === undefined) { t = S.length; idx.set(k, t); S.push(T); }
      out.push([i, t]);
    }
    E.push(out);
  }
  /* distance jusqu'à la victoire (toutes sorties), calculée à rebours */
  const n = S.length, win = new Int32Array(n).fill(-1), goal = S.findIndex(P => P.every(x => x < 0));
  if (goal < 0) return { solvable: false, states: n };
  const rev = Array.from({ length: n }, () => []);
  E.forEach((out, s) => out.forEach(([, t]) => rev[t].push(s)));
  win[goal] = 0;
  let q = [goal];
  while (q.length) { const nq = []; for (const t of q) for (const s of rev[t]) if (win[s] < 0) { win[s] = win[t] + 1; nq.push(s); } q = nq; }
  return { solvable: win[0] >= 0, opt: win[0], states: n, S, E, win };
}
module.exports = { makeLevel, slide, occ, analyse, key };
