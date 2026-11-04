/* Assemble dist/index.html : src/template.html + src/engine.js + data/puzzles.json + data/daily.json. */
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
let t = fs.readFileSync(path.join(root, 'src/template.html'), 'utf8');
t = t.replace('/*ENGINE*/', () => fs.readFileSync(path.join(root, 'src/engine.js'), 'utf8'));
t = t.replace('/*PUZZLES*/[]', () => fs.readFileSync(path.join(root, 'data/puzzles.json'), 'utf8'));
t = t.replace('/*DAILY*/[]', () => fs.readFileSync(path.join(root, 'data/daily.json'), 'utf8'));
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/index.html'), t);
/* verification de syntaxe des scripts embarques */
const scripts = [...t.matchAll(/<script>([\s\S]*?)<\/script>/g)];
scripts.forEach((m, i) => { try { new Function(m[1]); } catch (e) { console.error('Erreur de syntaxe script', i, e.message); process.exit(1); } });
console.log('dist/index.html', t.length, 'octets,', scripts.length, 'scripts OK');

/* ---------- site/ : version web installable (GitHub Pages) ----------
   Page complète (doctype, viewport mobile), manifeste d'appli, icônes et service worker hors ligne.
   dist/index.html reste le fichier unique utilisé pour l'artefact claude.ai. */
const site = path.join(root, 'site');
fs.rmSync(site, { recursive: true, force: true });
fs.mkdirSync(path.join(site, 'icons'), { recursive: true });
const version = require('crypto').createHash('sha1').update(t).digest('hex').slice(0, 10);
const head = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#1f2259">
<meta name="description" content="Ça Roule : le casse-tête du parking. 1000 niveaux de Course, 50 énigmes et un défi expert chaque jour.">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Ça Roule">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
`;
const body = t;
const reg = `<script>
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
</script>
`;
fs.writeFileSync(path.join(site, 'index.html'), head + body.replace('</style>', 'html,body{height:100%}body{min-height:100%;padding-top:max(10px,env(safe-area-inset-top,0px));padding-bottom:max(10px,env(safe-area-inset-bottom,0px))}\n</style>').replace(/<\/script>\s*$/, '</script>\n' + reg) + '\n</html>\n');
fs.writeFileSync(path.join(site, 'manifest.webmanifest'), JSON.stringify({
  name: 'Ça Roule', short_name: 'Ça Roule', lang: 'fr',
  description: 'Le casse-tête du parking : Course, Casse-tête et défi du jour.',
  start_url: './', scope: './', display: 'standalone', orientation: 'portrait',
  background_color: '#15173d', theme_color: '#1f2259',
  icons: [
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ]
}, null, 2));
for (const f of fs.readdirSync(path.join(root, 'assets/icons'))) fs.copyFileSync(path.join(root, 'assets/icons', f), path.join(site, 'icons', f));
/* service worker : la page d'abord depuis le réseau (les testeurs ont toujours la dernière version),
   sinon depuis le cache ; polices et icônes en cache. */
fs.writeFileSync(path.join(site, 'sw.js'), `const CACHE = 'caroule-${version}';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put('index.html', c)); return r; }).catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === 'opaque') { const c = r.clone(); caches.open(CACHE).then(k => k.put(req, c)); }
    return r;
  })));
});
`);
fs.writeFileSync(path.join(site, '.nojekyll'), '');
console.log('site/ prêt (version ' + version + ')');
