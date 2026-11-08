/* Course « sorties limitées » : joue la solution parfaite des niveaux 1 à 4 au doigt et vérifie la victoire à l'objectif. */
const { chromium } = require('playwright');
const E = require('../src/engine.js');
const LV = require('../data/course.json');
const toL = l => ({ W: l.W, H: l.H, gates: l.gates.map(([side, at, color]) => ({ side, at, color })), bars: (l.bars || []).map(([side, at]) => ({ side, at })), buttons: (l.buttons || []).map(([x, y, bar]) => ({ x, y, bar })), cars: l.cars.map(([h, line, pos, len, dir, color]) => ({ h: !!h, line, pos, len, dir, color })) });
const solution = n => { const L = toL(LV[n - 1]), A = E.crAnalyse(L); let s = 0; const seq = []; while (A.win[s] > 0) { const [i, t] = A.E[s].find(([, t]) => A.win[t] === A.win[s] - 1); seq.push(i); s = t; } return seq; };
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '../dist/index.html')); await p.waitForTimeout(500);
  await p.tap('#home-run'); await p.waitForTimeout(400); // quitte l'accueil
  for (let lvl = 1; lvl <= 4; lvl++) {
    for (const i of solution(lvl)) { await p.tap('.car[data-id="' + i + '"]'); await p.waitForTimeout(420); }
    await p.waitForTimeout(900);
    const w = await p.evaluate(() => !document.getElementById('win').hidden);
    console.log('lvl', lvl, 'win', w, 'coups', await p.textContent('#pz-n'), '/', LV[lvl - 1].opt);
    if (!w) break;
    await p.tap('#win-next'); await p.waitForTimeout(300);
    if (await p.evaluate(() => !document.getElementById('ad').hidden)) { await p.waitForTimeout(3300); await p.tap('#ad-close'); await p.waitForTimeout(300); }
  }
  console.log(errs); await b.close();
})();
