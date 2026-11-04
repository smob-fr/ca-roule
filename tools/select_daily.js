/* Assemble data/daily.json à partir des recherches data/daily/d_*.json :
 * dédoublonne, écarte les énigmes déjà dans la campagne, garde 30 coups et plus,
 * puis mélange de façon fixe (le défi d'un jour donné ne change jamais tant que la liste est la même).
 * Usage : node tools/select_daily.js [nombre=366] */
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '../data/daily');
const want = +process.argv[2] || 366;
const all = fs.readdirSync(dir).filter(f => /^d_\d+\.json$/.test(f)).flatMap(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
const canon = p => p.cars[0][2] + '|' + p.cars.slice(1).map(c => c.join(':')).sort().join(',');
const layout = p => p.cars.slice(1).map(c => [c[0], c[1], c[3]].join(':')).sort().join(',');
const campaign = new Set(require('../data/puzzles.json').map(canon));
const seen = new Set(), seenLayout = new Set(), pool = [];
for (const p of all.sort((a, b) => b.opt - a.opt)) {
  const k = canon(p), l = layout(p);
  if (p.opt < 30 || seen.has(k) || seenLayout.has(l) || campaign.has(k)) continue;
  seen.add(k); seenLayout.add(l);
  pool.push({ opt: p.opt, cars: p.cars });
}
let s = 20260101;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
for (let i = pool.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [pool[i], pool[j]] = [pool[j], pool[i]]; }
const out = pool.slice(0, want);
fs.writeFileSync(path.join(__dirname, '../data/daily.json'), JSON.stringify(out));
const h = {};
out.forEach(p => { h[p.opt] = (h[p.opt] || 0) + 1; });
console.log(all.length, 'trouvés,', pool.length, 'distincts,', out.length, 'gardés ; coups :', JSON.stringify(h), '; octets', JSON.stringify(out).length);
