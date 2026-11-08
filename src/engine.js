/* Moteur du jeu : generation de niveaux garantis solubles.
 *
 * Une voiture occupe `len` cases (2 ou 3) sur une ligne ou une colonne et sort
 * par l'avant (dir = R, L, U ou D). Elle est bloquee si une autre voiture ou un
 * plot (obstacle fixe) se trouve sur son chemin jusqu'au bord de la grille.
 * Un niveau est soluble si on peut retirer toutes les voitures une par une :
 * retirer une voiture ne bloque jamais personne, donc un retrait glouton suffit
 * a le prouver. Les pieges (voitures bachees, voitures a deux touches) ne
 * changent pas la solvabilite : ils cachent ou ralentissent, sans bloquer.
 */
(function (root) {
  'use strict';

  const MAX_LEVEL = 1000;
  const PALETTE_SIZE = 9;
  const DIRS = ['R', 'L', 'U', 'D'];
  const DX = { R: 1, L: -1, U: 0, D: 0 };
  const DY = { R: 0, L: 0, U: -1, D: 1 };

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function isHoriz(c) { return c.dir === 'R' || c.dir === 'L'; }

  function cellIdx(c, W) {
    const out = [];
    for (let i = 0; i < c.len; i++) {
      out.push(isHoriz(c) ? c.y * W + c.x + i : (c.y + i) * W + c.x);
    }
    return out;
  }

  /* Cases devant la voiture, de la plus proche jusqu'au bord. */
  function pathOf(c, W, H) {
    let x, y;
    if (c.dir === 'R') { x = c.x + c.len; y = c.y; }
    else if (c.dir === 'L') { x = c.x - 1; y = c.y; }
    else if (c.dir === 'D') { x = c.x; y = c.y + c.len; }
    else { x = c.x; y = c.y - 1; }
    const out = [];
    while (x >= 0 && y >= 0 && x < W && y < H) {
      out.push(y * W + x);
      x += DX[c.dir];
      y += DY[c.dir];
    }
    return out;
  }

  /* -1 = libre, -2 = plot, sinon identifiant de la voiture. */
  function makeGrid(cars, W, H, rocks) {
    const g = new Int16Array(W * H).fill(-1);
    if (rocks) for (const i of rocks) g[i] = -2;
    for (const c of cars) for (const i of cellIdx(c, W)) g[i] = c.id;
    return g;
  }

  /* Ordre de sortie possible, ou null si le niveau est bloque. */
  function solve(cars, W, H, rocks) {
    const g = makeGrid(cars, W, H, rocks);
    const left = cars.slice();
    const order = [];
    let moved = true;
    while (left.length && moved) {
      moved = false;
      for (let k = left.length - 1; k >= 0; k--) {
        const c = left[k];
        if (pathOf(c, W, H).every(i => g[i] === -1)) {
          for (const i of cellIdx(c, W)) g[i] = -1;
          order.push(c.id);
          left.splice(k, 1);
          moved = true;
        }
      }
    }
    return left.length ? null : order;
  }

  /* Nombre de vagues de sorties : plus il est grand, plus le niveau est profond. */
  function rounds(cars, W, H, rocks) {
    const g = makeGrid(cars, W, H, rocks);
    let left = cars.slice();
    let n = 0;
    while (left.length) {
      const free = left.filter(c => pathOf(c, W, H).every(i => g[i] === -1));
      if (!free.length) return Infinity;
      for (const c of free) for (const i of cellIdx(c, W)) g[i] = -1;
      const set = new Set(free);
      left = left.filter(c => !set.has(c));
      n++;
    }
    return n;
  }

  function params(n) {
    const t = Math.min(1, (n - 1) / 180);
    let W, H;
    if (n <= 2) { W = 4; H = 4; }
    else if (n <= 4) { W = 5; H = 5; }
    else if (n <= 8) { W = 5; H = 6; }
    else if (n <= 14) { W = 6; H = 7; }
    else if (n <= 22) { W = 6; H = 8; }
    else if (n <= 35) { W = 7; H = 8; }
    else if (n <= 55) { W = 7; H = 9; }
    else if (n <= 80) { W = 8; H = 9; }
    else { W = 8; H = 10; }
    const r = rng(n * 31 + 7);
    if (n > 8) {
      const j = r();
      if (j < 0.2 && W > 5) W--;
      else if (j > 0.85 && W < 8) W++;
    }
    let fill = 0.42 + 0.27 * t;
    if (n % 10 === 0) fill -= 0.07;   /* niveau de repos */
    if (n % 25 === 0) fill += 0.05;   /* niveau costaud */
    const long = 0.14 + 0.33 * t;
    const depth = n <= 2 ? 1 : n <= 5 ? 2 : Math.min(9, 2 + Math.floor((n - 3) / 8));
    /* pieges : plots des le niveau 12, voitures bachees des 20, deux touches des 30 */
    const rocks = n < 12 ? 0 : Math.min(6, 1 + Math.floor((n - 12) / 18));
    const mystery = n < 20 ? 0 : Math.min(5, 1 + Math.floor((n - 20) / 25));
    const twoTap = n < 30 ? 0 : Math.min(5, 1 + Math.floor((n - 30) / 30));
    const minCars = Math.max(2, Math.floor((W * H * fill - rocks) / 2.6));
    return { W, H, fill, long, depth, minCars, rocks, mystery, twoTap };
  }

  function build(P, r) {
    const W = P.W, H = P.H;
    const rocks = [];
    while (rocks.length < P.rocks) {
      const i = (r() * W * H) | 0;
      if (!rocks.includes(i)) rocks.push(i);
    }
    const cars = [];
    const grid = new Int16Array(W * H).fill(-1);
    rocks.forEach(i => { grid[i] = -2; });
    const target = Math.round(W * H * P.fill) - rocks.length;
    let filled = 0;
    for (let tries = 0; tries < 500 && filled < target; tries++) {
      const len = r() < P.long ? 3 : 2;
      const dir = DIRS[(r() * 4) | 0];
      const horiz = dir === 'R' || dir === 'L';
      const x = (r() * (W - (horiz ? len - 1 : 0))) | 0;
      const y = (r() * (H - (horiz ? 0 : len - 1))) | 0;
      const car = { id: cars.length, x, y, len, dir };
      const idx = cellIdx(car, W);
      if (idx.some(i => grid[i] !== -1)) continue;
      idx.forEach(i => { grid[i] = car.id; });
      cars.push(car);
      if (solve(cars, W, H, rocks) === null) {
        idx.forEach(i => { grid[i] = -1; });
        cars.pop();
        continue;
      }
      filled += len;
    }
    return { cars, rocks };
  }

  function generate(n) {
    n = Math.max(1, Math.min(MAX_LEVEL, n | 0));
    const P = params(n);
    const r = rng(n * 7919 + 13);
    let best = null;
    let bestScore = -1;
    for (let attempt = 0; attempt < 40; attempt++) {
      const built = build(P, r);
      const depth = rounds(built.cars, P.W, P.H, built.rocks);
      const score = Math.min(depth, P.depth) * 1000 + built.cars.length;
      if (score > bestScore) { bestScore = score; best = { cars: built.cars, rocks: built.rocks, depth }; }
      if (depth >= P.depth && built.cars.length >= P.minCars) break;
    }
    const palette = [];
    for (let i = 0; i < PALETTE_SIZE; i++) palette.push(i);
    for (let i = palette.length - 1; i > 0; i--) {
      const j = (r() * (i + 1)) | 0;
      const tmp = palette[i]; palette[i] = palette[j]; palette[j] = tmp;
    }
    best.cars.forEach((c, i) => { c.color = palette[i % PALETTE_SIZE]; });

    /* voitures bachees (sens cache) puis voitures a deux touches, jamais les deux */
    const ids = best.cars.map(c => c.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = (r() * (i + 1)) | 0;
      const tmp = ids[i]; ids[i] = ids[j]; ids[j] = tmp;
    }
    const nMystery = Math.min(P.mystery, Math.max(0, ids.length - 2));
    const nTwoTap = Math.min(P.twoTap, Math.max(0, ids.length - nMystery - 1));
    ids.slice(0, nMystery).forEach(id => { best.cars[id].mystery = true; });
    ids.slice(nMystery, nMystery + nTwoTap).forEach(id => { best.cars[id].taps = 2; });

    return { n, W: P.W, H: P.H, cars: best.cars, rocks: best.rocks, depth: best.depth };
  }

  /* ---------- mode casse-tete (glissement dans les deux sens, grille 6x6) ----------
   * cars[i] = { h: horizontale ?, fixed: ligne ou colonne, len }, positions[i] = case de tete.
   * La voiture 0 est la rouge, sur la ligne 2 ; elle sort par la droite.
   * Un coup = une voiture qui glisse de 1 a N cases. Parcours en largeur : nombre minimal
   * de coups, nombre de solutions de cette longueur et un chemin optimal. */
  const PZ_N = 6;
  function pzSolve(cars, start, cap) {
    const n = cars.length;
    const goalPos = PZ_N - cars[0].len;
    const key = P => { let k = 0; for (let i = 0; i < n; i++) k = k * 8 + P[i]; return k; };
    const states = [start.slice()], parent = [-1], mv = [null], dist = [0], cnt = [1];
    const index = new Map([[key(start), 0]]);
    const occ = new Uint8Array(PZ_N * PZ_N);
    let frontier = [0], d = 0;
    if (start[0] >= goalPos) return { opt: 0, ways: 1, path: [], states: 1 };
    while (frontier.length) {
      if (states.length > cap) return null;
      const next = [];
      for (const si of frontier) {
        const P = states[si];
        occ.fill(0);
        for (let j = 0; j < n; j++) {
          const c = cars[j];
          for (let i = 0; i < c.len; i++) occ[c.h ? c.fixed * PZ_N + P[j] + i : (P[j] + i) * PZ_N + c.fixed] = 1;
        }
        for (let j = 0; j < n; j++) {
          const c = cars[j];
          for (let step = -1; step <= 1; step += 2) {
            let p = P[j];
            for (;;) {
              const front = step > 0 ? p + c.len : p - 1;
              if (front < 0 || front >= PZ_N) break;
              if (occ[c.h ? c.fixed * PZ_N + front : front * PZ_N + c.fixed]) break;
              p += step;
              const T = P.slice();
              T[j] = p;
              const kt = key(T);
              const ti = index.get(kt);
              if (ti === undefined) {
                index.set(kt, states.length);
                states.push(T); parent.push(si); mv.push([j, p]); dist.push(d + 1); cnt.push(cnt[si]);
                next.push(states.length - 1);
              } else if (dist[ti] === d + 1) cnt[ti] += cnt[si];
            }
          }
        }
      }
      d++;
      let goal = -1, ways = 0;
      for (const ti of next) {
        if (states[ti][0] >= goalPos) { ways += cnt[ti]; if (goal < 0) goal = ti; }
      }
      if (goal >= 0) {
        const path = [];
        for (let s = goal; parent[s] !== -1; s = parent[s]) path.push({ car: mv[s][0], to: mv[s][1] });
        path.reverse();
        return { opt: d, ways, path, states: states.length };
      }
      frontier = next;
    }
    return { opt: Infinity, ways: 0, path: null, states: states.length };
  }


  /* ---------- mode Course « sorties limitées » ----------
   * Niveau L = { W, H, cars:[{h, line, pos, len, dir, color}], gates:[{side, at, color}], bars:[{side, at}], buttons:[{x, y, bar}] }
   * side ∈ T, B, L, R ; at = colonne (T/B) ou ligne (L/R) ; color = 'any' ou une couleur ; dir = +1 (droite/bas) ou -1.
   * Toucher une voiture : elle avance jusqu'au premier obstacle. Elle sort si elle arrive au bord face à une porte
   * de sa couleur (ou « toutes couleurs ») que ne ferme aucune barrière. Une barrière s'ouvre pour de bon quand une voiture
   * s'arrête sur son bouton. État = positions (−1 = sortie) + masque des barrières ouvertes en dernière case. */
  function crOcc(L, P) {
    const g = new Int8Array(L.W * L.H).fill(-1);
    for (let i = 0; i < L.cars.length; i++) {
      const c = L.cars[i];
      if (P[i] < 0) continue;
      for (let k = 0; k < c.len; k++) g[c.h ? c.line * L.W + P[i] + k : (P[i] + k) * L.W + c.line] = i;
    }
    return g;
  }
  const crSide = c => (c.h ? (c.dir > 0 ? 'R' : 'L') : (c.dir > 0 ? 'B' : 'T'));
  function crGateOpen(L, P, side, at, color) {
    const g = L.gates.find(x => x.side === side && x.at === at);
    if (!g || !(g.color === 'any' || g.color === color)) return false;
    const mask = P[L.cars.length] || 0, bars = L.bars || [];
    for (let b = 0; b < bars.length; b++) if (bars[b].side === side && bars[b].at === at && !(mask & (1 << b))) return false;
    return true;
  }
  /* glissade de la voiture i ; back = marche arrière (aide) : elle recule et ne peut pas sortir */
  function crSlide(L, P, i, g, back) {
    const c = L.cars[i], N = c.h ? L.W : L.H, dir = back ? -c.dir : c.dir;
    if (P[i] < 0) return null;
    g = g || crOcc(L, P);
    let p = P[i];
    for (;;) {
      const front = dir > 0 ? p + c.len : p - 1;
      if (front < 0 || front >= N) {
        if (!back && crGateOpen(L, P, crSide(c), c.line, c.color)) return -1;
        break;
      }
      if (g[c.h ? c.line * L.W + front : front * L.W + c.line] >= 0) break;
      p += dir;
    }
    return p === P[i] ? null : p;
  }
  /* état après le coup (ou null si la voiture ne bouge pas) : gère l'ouverture des barrières */
  function crApply(L, P, i, back, g) {
    const r = crSlide(L, P, i, g, back);
    if (r === null) return null;
    const T = P.slice();
    T[i] = r;
    if (r >= 0 && L.buttons) {
      const c = L.cars[i];
      L.buttons.forEach(bt => {
        for (let k = 0; k < c.len; k++) {
          const x = c.h ? r + k : c.line, y = c.h ? c.line : r + k;
          if (x === bt.x && y === bt.y) T[L.cars.length] = (T[L.cars.length] || 0) | (1 << bt.bar);
        }
      });
    }
    return T;
  }
  const crStart = L => L.cars.map(c => c.pos).concat([0]);
  /* exploration complète depuis P (les voitures n'avancent que vers l'avant : graphe fini) ;
   * win[s] = coups minimum jusqu'à la victoire depuis l'état s (−1 = impasse) */
  function crAnalyse(L, P, cap) {
    P = P || crStart(L);
    const n = L.cars.length, key = Q => Q.join(','), idx = new Map([[key(P), 0]]), S = [P], E = [];
    for (let s = 0; s < S.length; s++) {
      if (S.length > (cap || 300000)) return null;
      const Q = S[s], g = crOcc(L, Q), out = [];
      for (let i = 0; i < n; i++) {
        if (Q[i] < 0) continue;
        const T = crApply(L, Q, i, false, g);
        if (!T) continue;
        const k = key(T);
        let t = idx.get(k);
        if (t === undefined) { t = S.length; idx.set(k, t); S.push(T); }
        out.push([i, t]);
      }
      E.push(out);
    }
    const win = new Int32Array(S.length).fill(-1), rev = Array.from({ length: S.length }, () => []);
    E.forEach((out, s) => out.forEach(([, t]) => rev[t].push(s)));
    let q = [];
    S.forEach((Q, s) => { let all = true; for (let i = 0; i < n; i++) if (Q[i] >= 0) { all = false; break; } if (all) { win[s] = 0; q.push(s); } });
    while (q.length) { const nq = []; for (const t of q) for (const s of rev[t]) if (win[s] < 0) { win[s] = win[t] + 1; nq.push(s); } q = nq; }
    return { opt: win[0], solvable: win[0] >= 0, S, E, win, states: S.length };
  }
  /* meilleur coup depuis P : { left: coups restants au mieux (Infinity = impasse), car } */
  function crBest(L, P) {
    const A = crAnalyse(L, P, 200000);
    if (!A || A.win[0] < 0) return { left: Infinity, car: null };
    const mv = A.E[0].find(([, t]) => A.win[t] === A.win[0] - 1);
    return { left: A.win[0], car: mv ? mv[0] : null };
  }

  const api = { MAX_LEVEL, PALETTE_SIZE, PZ_N, generate, solve, rounds, pathOf, cellIdx, makeGrid, params, pzSolve, crOcc, crSlide, crApply, crStart, crAnalyse, crBest };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CarEngine = api;
})(typeof window !== 'undefined' ? window : this);
