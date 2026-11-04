/* Chercheur de casse-tete : escalade de colline.
 * On part d'une grille aleatoire, on la modifie un peu a chaque essai et on garde les
 * variantes qui demandent plus de coups, avec moins de solutions equivalentes.
 * Usage : node gen_puzzles.js <graine> <secondes> */
const fs = require('fs');
const E = require('../src/engine.js');

const seed = +process.argv[2] || 1;
const seconds = +process.argv[3] || 300;
const N = E.PZ_N;

function rng(s) {
  let a = s >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r = rng(seed * 7919 + 5);

const cellsOf = c => {
  const out = [];
  for (let i = 0; i < c.len; i++) out.push(c.h ? c.fixed * N + c.pos + i : (c.pos + i) * N + c.fixed);
  return out;
};
function fits(cars, nc, skip) {
  if (nc.h && nc.fixed === 2) return false;
  const used = new Set();
  cars.forEach((c, i) => { if (i !== skip) cellsOf(c).forEach(x => used.add(x)); });
  return cellsOf(nc).every(x => !used.has(x));
}
function randomCar(len) {
  const h = r() < 0.5;
  return { h, fixed: (r() * N) | 0, pos: (r() * (N - len + 1)) | 0, len };
}
function randomBoard(k) {
  const cars = [{ h: true, fixed: 2, pos: (r() * 3) | 0, len: 2 }];
  for (let t = 0; t < 300 && cars.length < k; t++) {
    const nc = randomCar(r() < 0.25 ? 3 : 2);
    if (fits(cars, nc, -1)) cars.push(nc);
  }
  return cars;
}
function mutate(cars) {
  const c = cars.map(x => ({ ...x }));
  const n = c.length, op = r();
  if (op < 0.5 && n > 1) {                 /* petit decalage d'une voiture */
    const i = 1 + ((r() * (n - 1)) | 0);
    const nc = { ...c[i] };
    const kind = r();
    if (kind < 0.6) nc.pos = Math.max(0, Math.min(N - nc.len, nc.pos + (r() < 0.5 ? -1 : 1) * (1 + ((r() * 2) | 0))));
    else nc.fixed = Math.max(0, Math.min(N - 1, nc.fixed + (r() < 0.5 ? -1 : 1)));
    if (fits(c, nc, i)) c[i] = nc;
  } else if (op < 0.7 && n > 1) {          /* une voiture change de place ou de taille */
    const i = 1 + ((r() * (n - 1)) | 0);
    for (let t = 0; t < 25; t++) {
      const nc = randomCar(r() < 0.3 ? 3 : 2);
      if (fits(c, nc, i)) { c[i] = nc; break; }
    }
  } else if (op < 0.85 && n < 14) {        /* ajout */
    for (let t = 0; t < 25; t++) {
      const nc = randomCar(r() < 0.25 ? 3 : 2);
      if (fits(c, nc, -1)) { c.push(nc); break; }
    }
  } else if (op < 0.95 && n > 8) {         /* retrait */
    c.splice(1 + ((r() * (n - 1)) | 0), 1);
  } else {                                 /* la rouge change de depart */
    c[0].pos = (r() * 3) | 0;
    if (!fits(c, c[0], 0)) return cars;
  }
  return c;
}
const canon = cars => cars[0].pos + '|' + cars.slice(1).map(c => [c.h ? 1 : 0, c.fixed, c.pos, c.len].join(':')).sort().join(',');
function evaluate(cars) {
  const res = E.pzSolve(cars.map(c => ({ h: c.h, fixed: c.fixed, len: c.len })), cars.map(c => c.pos), 250000);
  if (!res || res.opt === Infinity || res.opt < 1) return null;
  return res;
}
const wayWeight = +process.argv[4] || 20; /* plus il est grand, plus on cherche une solution unique */
const score = res => res.opt * 100 - Math.log2(res.ways) * wayWeight;

const archive = new Map();
const t0 = Date.now();
let evals = 0, bestOpt = 0;
const save = () => {
  const list = [...archive.values()].filter(x => x.opt >= 4);
  fs.writeFileSync(require('path').join(__dirname, '../data/candidates', `pz_${seed}.json`), JSON.stringify(list));
};
let lastSave = Date.now();

while (Date.now() - t0 < seconds * 1000) {
  let cur = randomBoard(8 + ((r() * 4) | 0));
  let ev = evaluate(cur);
  if (!ev) continue;
  let curScore = score(ev), bestRun = curScore, stagnation = 0;
  while (stagnation < 250 && Date.now() - t0 < seconds * 1000) {
    const cand = mutate(cur);
    if (cand === cur) { stagnation++; continue; }
    const res = evaluate(cand);
    evals++;
    if (!res) { stagnation++; continue; }
    const k = canon(cand);
    if (!archive.has(k)) {
      archive.set(k, { opt: res.opt, ways: res.ways, cars: cand.map(c => [c.h ? 1 : 0, c.fixed, c.pos, c.len]) });
    }
    if (res.opt > bestOpt) { bestOpt = res.opt; console.log(`[${seed}] ${Math.round((Date.now() - t0) / 1000)}s : ${res.opt} coups, ${res.ways} solution(s), ${evals} essais`); }
    const s = score(res);
    if (s >= curScore || r() < 0.02) {
      cur = cand; curScore = s;
      if (s > bestRun) { bestRun = s; stagnation = 0; } else stagnation++;
    } else stagnation++;
    if (Date.now() - lastSave > 20000) { save(); lastSave = Date.now(); }
  }
}
save();
console.log(`[${seed}] fini : ${evals} essais, ${archive.size} grilles gardees, record ${bestOpt} coups`);
