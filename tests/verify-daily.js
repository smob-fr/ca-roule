/* Vérifie chaque défi du jour avec le solveur du jeu : soluble, et en exactement `opt` coups. */
const E = require('../src/engine.js');
const D = require('../data/daily.json');
let bad = 0;
const t0 = Date.now();
D.forEach((p, i) => {
  const r = E.pzSolve(p.cars.map(c => ({ h: !!c[0], fixed: c[1], len: c[3] })), p.cars.map(c => c[2]), 4e6);
  if (!r || r.opt !== p.opt || p.opt < 30) { bad++; console.log('défi', i, 'KO', p.opt, r && r.opt); }
});
console.log(D.length, 'défis vérifiés,', bad, 'erreur(s), en', Math.round((Date.now() - t0) / 1000), 's');
process.exit(bad ? 1 : 0);
