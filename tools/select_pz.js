const E = require('../src/engine.js');
const a = [...require('../data/candidates/pz_1.json'), ...require('../data/candidates/pz_2.json')];
const targets = [4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,14,15,16,17,17,18,19,20,20,21,21,22,22,23,23,24,25,26,27,28,28,29,29,30,33,34,37,38,46,48,49];
const used = new Set(), out = [];
const rnd = (() => { let s = 12345; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; })();
for (const t of targets) {
  let pool = a.filter(x => x.opt === t && !used.has(JSON.stringify(x.cars)));
  if (!pool.length) pool = a.filter(x => x.opt === t + 1 && !used.has(JSON.stringify(x.cars)));
  const minW = Math.min(...pool.map(x => x.ways));
  let best = pool.filter(x => x.ways === minW);
  if (minW > 1) best = pool.filter(x => x.ways <= minW * 3);
  best.sort((p, q) => t <= 10 ? p.cars.length - q.cars.length : q.cars.length - p.cars.length);
  const top = best.slice(0, Math.max(1, Math.min(8, best.length)));
  const pickd = top[(rnd() * top.length) | 0];
  used.add(JSON.stringify(pickd.cars));
  // re-verify
  const cs = pickd.cars.map(c => ({ h: !!c[0], fixed: c[1], len: c[3] }));
  const r = E.pzSolve(cs, pickd.cars.map(c => c[2]), 2e6);
  if (!r || r.opt !== pickd.opt || r.ways !== pickd.ways) throw new Error('mismatch ' + t);
  out.push({ opt: r.opt, ways: r.ways, cars: pickd.cars });
}
require('fs').writeFileSync(require('path').join(__dirname, '../data/puzzles.json'), JSON.stringify(out));
console.log(out.map((x, i) => (i + 1) + ':' + x.opt + (x.ways === 1 ? '*' : '(' + x.ways + ')') + '/' + x.cars.length).join(' '));
console.log('unique:', out.filter(x => x.ways === 1).length, 'bytes', JSON.stringify(out).length);
