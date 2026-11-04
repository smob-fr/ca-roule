/* Experience : variante "la voiture glisse puis s'arrete devant l'obstacle".
 * Les coups ne sont plus interchangeables : deplacer une voiture peut en bloquer une autre.
 * On compte, par parcours en largeur, la longueur de la meilleure solution et
 * le nombre de solutions de cette longueur. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const DIRS = ['R', 'L', 'U', 'D'];

function randomBoard(W, H, k, r) {
  const cars = [], occ = new Set();
  for (let tries = 0; tries < 400 && cars.length < k; tries++) {
    const len = r() < 0.3 ? 3 : 2;
    const dir = DIRS[(r() * 4) | 0];
    const horiz = dir === 'R' || dir === 'L';
    const x = (r() * (W - (horiz ? len - 1 : 0))) | 0;
    const y = (r() * (H - (horiz ? 0 : len - 1))) | 0;
    const cells = [];
    for (let i = 0; i < len; i++) cells.push(horiz ? [x + i, y] : [x, y + i]);
    if (cells.some(([cx, cy]) => occ.has(cx + ',' + cy))) continue;
    cells.forEach(([cx, cy]) => occ.add(cx + ',' + cy));
    cars.push({ x, y, len, dir });
  }
  return cars;
}

function analyze(cars, W, H, cap) {
  const n = cars.length;
  const dx = { R: 1, L: -1, U: 0, D: 0 }, dy = { R: 0, L: 0, U: -1, D: 1 };
  const maxShift = cars.map(c =>
    c.dir === 'R' ? W - c.x : c.dir === 'L' ? c.x + c.len : c.dir === 'D' ? H - c.y : c.y + c.len);
  const cellsAt = (c, s) => {
    const out = [];
    const horiz = c.dir === 'R' || c.dir === 'L';
    for (let i = 0; i < c.len; i++) {
      out.push(horiz ? [c.x + i + dx[c.dir] * s, c.y] : [c.x, c.y + i + dy[c.dir] * s]);
    }
    return out;
  };
  const key = S => S.reduce((a, v) => a * 16 + v, 0);
  const start = new Array(n).fill(0);
  const goalKey = key(maxShift);

  function moves(S) {
    const out = [];
    for (let i = 0; i < n; i++) {
      if (S[i] >= maxShift[i]) continue;
      const occ = new Set();
      for (let j = 0; j < n; j++) {
        if (j === i || S[j] >= maxShift[j]) continue;
        for (const [cx, cy] of cellsAt(cars[j], S[j])) occ.add(cx + ',' + cy);
      }
      const c = cars[i];
      let s = S[i], gone = false;
      for (;;) {
        const t = s + 1;
        const front = c.dir === 'R' ? [c.x + c.len - 1 + t, c.y]
          : c.dir === 'L' ? [c.x - t, c.y]
          : c.dir === 'D' ? [c.x, c.y + c.len - 1 + t]
          : [c.x, c.y - t];
        if (front[0] < 0 || front[1] < 0 || front[0] >= W || front[1] >= H) { gone = true; break; }
        if (occ.has(front[0] + ',' + front[1])) break;
        s = t;
      }
      const ns = gone ? maxShift[i] : s;
      if (ns === S[i]) continue;
      const next = S.slice();
      next[i] = ns;
      out.push(next);
    }
    return out;
  }

  const dist = new Map([[key(start), 0]]);
  const cnt = new Map([[key(start), 1]]);
  let frontier = [start];
  let d = 0;
  while (frontier.length) {
    if (dist.size > cap) return null;
    const nextFrontier = [];
    for (const S of frontier) {
      const ks = key(S);
      for (const T of moves(S)) {
        const kt = key(T);
        if (!dist.has(kt)) {
          dist.set(kt, d + 1);
          cnt.set(kt, cnt.get(ks));
          nextFrontier.push(T);
        } else if (dist.get(kt) === d + 1) {
          cnt.set(kt, cnt.get(kt) + cnt.get(ks));
        }
      }
    }
    d++;
    if (dist.has(goalKey)) return { opt: dist.get(goalKey), ways: cnt.get(goalKey), states: dist.size };
    frontier = nextFrontier;
  }
  return { opt: Infinity, ways: 0, states: dist.size };
}

const r = rng(2026);
const t0 = Date.now();
for (const [W, H, k, N] of [[5, 5, 6, 1500], [6, 6, 7, 1500], [6, 6, 9, 1200]]) {
  let tested = 0, solvable = 0, unique = 0, skipped = 0;
  const byOpt = {};
  let best = null;
  for (let i = 0; i < N; i++) {
    const cars = randomBoard(W, H, k, r);
    if (cars.length < k) continue;
    const res = analyze(cars, W, H, 300000);
    if (!res) { skipped++; continue; }
    tested++;
    if (res.opt === Infinity) continue;
    solvable++;
    if (res.ways === 1) {
      unique++;
      byOpt[res.opt] = (byOpt[res.opt] || 0) + 1;
      if (!best || res.opt > best.opt) best = { opt: res.opt, cars, states: res.states };
    }
  }
  console.log(`${W}x${H}, ${k} voitures : ${tested} grilles, ${solvable} solubles, ${unique} avec une solution optimale unique` +
    (skipped ? ` (${skipped} trop grosses ignorees)` : ''));
  console.log('  coups de la solution unique ->', JSON.stringify(byOpt));
  if (best) console.log('  la plus longue :', best.opt, 'coups,', best.states, 'etats explores');
}
console.log('duree', Date.now() - t0, 'ms');
