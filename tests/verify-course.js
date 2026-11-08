/* Vérifie chaque niveau du mode Course (data/course.json) avec le solveur du jeu :
 * soluble, objectif = vrai minimum, aucune voiture sur un bouton au départ, chaque voiture vise une porte possible. */
const E = require('../src/engine.js');
const LV = require('../data/course.json');
const toL = l => ({
  W: l.W, H: l.H,
  gates: l.gates.map(([side, at, color]) => ({ side, at, color })),
  bars: (l.bars || []).map(([side, at]) => ({ side, at })),
  buttons: (l.buttons || []).map(([x, y, bar]) => ({ x, y, bar })),
  cars: l.cars.map(([h, line, pos, len, dir, color]) => ({ h: !!h, line, pos, len, dir, color }))
});
let bad = 0;
const t0 = Date.now();
LV.forEach((l, i) => {
  const L = toL(l), A = E.crAnalyse(L, null, 600000), err = [];
  if (!A || !A.solvable) err.push('insoluble');
  else if (A.opt !== l.opt) err.push('objectif ' + l.opt + ' ≠ minimum ' + A.opt);
  const occ = E.crOcc(L, E.crStart(L));
  L.buttons.forEach(b => { if (occ[b.y * L.W + b.x] >= 0) err.push('voiture sur un bouton'); });
  L.cars.forEach((c, k) => { const side = c.h ? (c.dir > 0 ? 'R' : 'L') : (c.dir > 0 ? 'B' : 'T'); if (!L.gates.some(g => g.side === side && g.at === c.line && (g.color === 'any' || g.color === c.color))) err.push('voiture ' + k + ' sans porte'); });
  if (err.length) { bad++; console.log('niveau', i + 1, err.join(', ')); }
});
const by = [1, 2, 3].map(c => LV.filter(l => l.city === c));
console.log(LV.length, 'niveaux vérifiés,', bad, 'erreur(s), en', Math.round((Date.now() - t0) / 1000), 's');
by.forEach((v, k) => console.log('ville', k + 1, ':', v.length, 'niveaux, objectif moyen', (v.reduce((a, l) => a + l.opt, 0) / v.length).toFixed(1), 'coups, manœuvres moyennes', (v.reduce((a, l) => a + l.opt - l.cars.length, 0) / v.length).toFixed(1)));
process.exit(bad ? 1 : 0);
