/* Experience : casse-tete a la "Rush Hour". Les voitures glissent dans les deux sens
 * sur leur file ; il faut sortir la voiture rouge (ligne 3, sortie a droite).
 * Un deplacement = une voiture qui glisse de 1 a N cases. Parcours en largeur :
 * on obtient le nombre minimal de coups et le nombre de solutions de cette longueur. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const N = 6;

function randomBoard(k, r) {
  /* voiture 0 = rouge, horizontale, ligne 2 */
  const cars = [{ h: true, fixed: 2, pos: (r() * 3) | 0, len: 2 }];
  const occ = new Set();
  const mark = c => { for (let i = 0; i < c.len; i++) occ.add(c.h ? (c.pos + i) + ',' + c.fixed : c.fixed + ',' + (c.pos + i)); };
  const free = c => { for (let i = 0; i < c.len; i++) if (occ.has(c.h ? (c.pos + i) + ',' + c.fixed : c.fixed + ',' + (c.pos + i))) return false; return true; };
  mark(cars[0]);
  for (let tries = 0; tries < 300 && cars.length < k; tries++) {
    const len = r() < 0.25 ? 3 : 2;
    const h = r() < 0.5;
    const c = { h, fixed: (r() * N) | 0, pos: (r() * (N - len + 1)) | 0, len };
    if (h && c.fixed === 2) continue; /* la ligne de sortie reste libre devant la rouge */
    if (!free(c)) continue;
    mark(c);
    cars.push(c);
  }
  return cars;
}

function analyze(cars, cap) {
  const n = cars.length;
  const key = P => P.reduce((a, v) => a * 8 + v, 0);
  const start = cars.map(c => c.pos);
  const isGoal = P => P[0] >= N - 2; /* la rouge touche la sortie */
  const dist = new Map([[key(start), 0]]);
  const cnt = new Map([[key(start), 1]]);
  let frontier = [start], d = 0;
  while (frontier.length) {
    if (dist.size > cap) return null;
    const nextF = [];
    for (const P of frontier) {
      const kp = key(P);
      const occ = new Set();
      for (let j = 0; j < n; j++) {
        const c = cars[j];
        for (let i = 0; i < c.len; i++) occ.add(c.h ? (P[j] + i) + ',' + c.fixed : c.fixed + ',' + (P[j] + i));
      }
      for (let j = 0; j < n; j++) {
        const c = cars[j];
        for (const step of [-1, 1]) {
          let p = P[j];
          for (;;) {
            const front = step > 0 ? p + c.len : p - 1;
            if (front < 0 || front >= N) break;
            if (occ.has(c.h ? front + ',' + c.fixed : c.fixed + ',' + front)) break;
            p += step;
            const T = P.slice();
            T[j] = p;
            const kt = key(T);
            if (!dist.has(kt)) {
              dist.set(kt, d + 1);
              cnt.set(kt, cnt.get(kp));
              nextF.push(T);
            } else if (dist.get(kt) === d + 1) {
              cnt.set(kt, cnt.get(kt) + cnt.get(kp));
            }
          }
        }
      }
    }
    d++;
    let best = null;
    for (const T of nextF) if (isGoal(T)) { best = true; }
    if (best) {
      let ways = 0;
      for (const T of nextF) if (isGoal(T)) ways += cnt.get(key(T));
      return { opt: d, ways, states: dist.size };
    }
    frontier = nextF;
  }
  return { opt: Infinity, ways: 0, states: dist.size };
}

const r = rng(77);
const t0 = Date.now();
const hist = {};
let tested = 0, solvable = 0, skipped = 0, unique = 0;
let hardest = null;
const uniqueList = [];
for (let i = 0; i < 700 && Date.now() - t0 < 230000; i++) {
  const cars = randomBoard(11, r);
  if (cars.length < 9) continue;
  const res = analyze(cars, 400000);
  if (!res) { skipped++; continue; }
  tested++;
  if (res.opt === Infinity) continue;
  solvable++;
  const b = res.opt >= 20 ? '20+' : res.opt >= 15 ? '15-19' : res.opt >= 10 ? '10-14' : res.opt >= 5 ? '5-9' : '<5';
  hist[b] = (hist[b] || 0) + 1;
  if (res.ways === 1) { unique++; uniqueList.push(res.opt); }
  if (!hardest || res.opt > hardest.opt) hardest = { opt: res.opt, ways: res.ways, cars };
}
console.log(`${tested} grilles testees (${skipped} trop grosses ignorees), ${solvable} solubles`);
console.log('repartition du nombre minimal de coups :', JSON.stringify(hist));
console.log('solution minimale strictement unique :', unique, uniqueList.length ? '(coups : ' + uniqueList.join(', ') + ')' : '');
console.log('la plus dure : ' + hardest.opt + ' coups minimum, ' + hardest.ways + ' facon(s) de la resoudre en ' + hardest.opt + ' coups');
console.log('duree', Date.now() - t0, 'ms');
