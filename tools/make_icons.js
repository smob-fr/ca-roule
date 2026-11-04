/* Génère les icônes de l'appli web (assets/icons/*.png) à partir des voitures du jeu.
 * Usage : npm run build && node tools/make_icons.js   (nécessite Playwright) */
const { chromium } = require('playwright');
const path = require('path');
const root = path.resolve(__dirname, '..');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file://' + path.join(root, 'dist/index.html'));
  await p.waitForTimeout(600);
  /* une voiture rouge (héroïne du Casse-tête) et un cône, pris dans le jeu lui-même */
  await p.evaluate(() => { document.getElementById('home-pz').click(); });
  await p.waitForTimeout(500);
  const car = await p.evaluate(() => document.querySelector('.pcar.hero .car-in').innerHTML);
  const cone = await p.evaluate(() => document.querySelector('#mascot-main').innerHTML);
  const defs = await p.evaluate(() => document.querySelector('svg.defs').outerHTML);
  const page = (size, pad) => `<!doctype html><html><head><style>
    html,body{margin:0;width:${size}px;height:${size}px;overflow:hidden}
    .bg{position:relative;width:100%;height:100%;background:radial-gradient(90% 80% at 30% 10%,#5a5fd0 0%,#2a2d7a 55%,#15173d 100%);overflow:hidden}
    .road{position:absolute;left:-10%;right:-10%;top:47%;height:${size * 0.3}px;background:linear-gradient(180deg,#43475f,#2f3348);transform:rotate(-12deg);box-shadow:0 ${size * 0.012}px 0 #7a80a6,0 -${size * 0.012}px 0 #7a80a6}
    .road::before{content:"";position:absolute;left:0;right:0;top:50%;height:${size * 0.018}px;margin-top:-${size * 0.009}px;background:repeating-linear-gradient(90deg,rgba(255,255,255,.6) 0 ${size * 0.07}px,transparent ${size * 0.07}px ${size * 0.13}px)}
    .car{position:absolute;left:${size * 0.18 + pad}px;top:${size * 0.47}px;width:${size * 0.62 - pad * 2}px;height:${(size * 0.62 - pad * 2) / 2}px;transform:rotate(-12deg);filter:drop-shadow(0 ${size * 0.02}px ${size * 0.02}px rgba(0,0,0,.5))}
    .car svg{width:100%;height:100%;overflow:visible}
    .cone{position:absolute;left:${size * 0.1 + pad}px;top:${size * 0.1 + pad}px;width:${size * 0.36 - pad}px;height:${size * 0.36 - pad}px}
    .cone svg{width:100%;height:100%;overflow:visible}
    .cone .mascot{animation:none!important}
  </style></head><body>${defs}<div class="bg"><div class="road"></div><div class="cone">${cone}</div><div class="car">${car}</div></div></body></html>`;
  const shots = [['icon-512.png', 512, 0], ['icon-192.png', 192, 0], ['maskable-512.png', 512, 46], ['apple-touch-icon.png', 180, 0]];
  for (const [name, size, pad] of shots) {
    const q = await b.newPage({ viewport: { width: size, height: size } });
    await q.setContent(page(size, pad));
    await q.addStyleTag({ content: (await p.evaluate(() => [...document.styleSheets].map(s => { try { return [...s.cssRules].map(r => r.cssText).join('\n'); } catch (e) { return ''; } }).join('\n'))) });
    await q.addStyleTag({ content: 'html,body{background:none!important;padding:0!important;display:block!important}' });
    await q.waitForTimeout(150);
    await q.screenshot({ path: path.join(root, 'assets/icons', name) });
    await q.close();
  }
  await b.close();
  console.log('icônes écrites dans assets/icons');
})();
