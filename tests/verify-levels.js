/* Verifie les 1000 niveaux avec une simulation independante du moteur :
 * chaque voiture avance case par case, sans reutiliser pathOf ni solve.
 * Les plots sont des obstacles permanents. */
const E = require('../src/engine.js');

const STEP = { R: [1, 0], L: [-1, 0], U: [0, -1], D: [0, 1] };

function occupied(car) {
  const out = [];
  for (let i = 0; i < car.len; i++) {
    out.push(car.dir === 'R' || car.dir === 'L' ? [car.x + i, car.y] : [car.x, car.y + i]);
  }
  return out;
}

function canExit(car, others, rockCells, W, H) {
  const taken = new Set(rockCells.map(([x, y]) => x + ',' + y));
  for (const o of others) for (const [x, y] of occupied(o)) taken.add(x + ',' + y);
  let c = { ...car };
  const [dx, dy] = STEP[car.dir];
  for (let guard = 0; guard < 40; guard++) {
    const cells = occupied(c);
    if (cells.every(([x, y]) => x < 0 || y < 0 || x >= W || y >= H)) return true;
    const front = car.dir === 'R' || car.dir === 'D' ? cells[cells.length - 1] : cells[0];
    const nx = front[0] + dx, ny = front[1] + dy;
    if (nx >= 0 && ny >= 0 && nx < W && ny < H && taken.has(nx + ',' + ny)) return false;
    c = { ...c, x: c.x + dx, y: c.y + dy };
  }
  return false;
}

function verify(L, seed) {
  const { W, H, cars } = L;
  const rockCells = L.rocks.map(i => [i % W, Math.floor(i / W)]);
  const seen = new Set();
  for (const [x, y] of rockCells) {
    if (x < 0 || y < 0 || x >= W || y >= H) return 'plot hors grille';
    const k = x + ',' + y;
    if (seen.has(k)) return 'plots superposes';
    seen.add(k);
  }
  for (const c of cars) {
    for (const [x, y] of occupied(c)) {
      if (x < 0 || y < 0 || x >= W || y >= H) return 'hors grille';
      const k = x + ',' + y;
      if (seen.has(k)) return 'chevauchement';
      seen.add(k);
    }
    if (c.mystery && c.taps) return 'bachee et deux touches';
  }
  /* parties aleatoires : tout choix de voiture libre doit mener a la victoire */
  let s = seed;
  const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  for (let run = 0; run < 3; run++) {
    let left = cars.slice();
    while (left.length) {
      const free = left.filter(c => canExit(c, left.filter(o => o !== c), rockCells, W, H));
      if (!free.length) return 'bloque';
      const pick = free[(rand() * free.length) | 0];
      left = left.filter(c => c !== pick);
    }
  }
  return null;
}

const t0 = Date.now();
const problems = [];
const sigs = new Set();
const bands = {};
let minCars = 99, maxCars = 0;

for (let n = 1; n <= E.MAX_LEVEL; n++) {
  const L = E.generate(n);
  const again = E.generate(n);
  if (JSON.stringify(L) !== JSON.stringify(again)) problems.push([n, 'non deterministe']);
  const err = verify(L, n * 97 + 1);
  if (err) problems.push([n, err]);
  if (!L.cars.length) problems.push([n, 'vide']);
  sigs.add(JSON.stringify([L.cars.map(c => [c.x, c.y, c.len, c.dir]), L.rocks]) + L.W + 'x' + L.H);
  minCars = Math.min(minCars, L.cars.length);
  maxCars = Math.max(maxCars, L.cars.length);
  const b = Math.floor((n - 1) / 100) * 100 + 1;
  (bands[b] = bands[b] || []).push({
    cars: L.cars.length, depth: L.depth, W: L.W, H: L.H, rocks: L.rocks.length,
    mystery: L.cars.filter(c => c.mystery).length, twoTap: L.cars.filter(c => c.taps > 1).length
  });
}

console.log('Niveaux verifies : ' + E.MAX_LEVEL + ' en ' + (Date.now() - t0) + ' ms');
console.log('Problemes : ' + problems.length, problems.slice(0, 5));
console.log('Niveaux distincts : ' + sigs.size);
console.log('Voitures par niveau : min ' + minCars + ', max ' + maxCars);
for (const b of Object.keys(bands)) {
  const a = bands[b];
  const avg = k => (a.reduce((s, x) => s + x[k], 0) / a.length).toFixed(1);
  console.log('niveaux ' + b + '-' + (+b + 99) + ' : voitures ' + avg('cars') + ', profondeur ' + avg('depth') +
    ', plots ' + avg('rocks') + ', bachees ' + avg('mystery') + ', deux touches ' + avg('twoTap'));
}
process.exit(problems.length ? 1 : 0);
