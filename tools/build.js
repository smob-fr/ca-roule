/* Assemble dist/index.html : src/template.html + src/engine.js + data/puzzles.json. */
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
let t = fs.readFileSync(path.join(root, 'src/template.html'), 'utf8');
t = t.replace('/*ENGINE*/', () => fs.readFileSync(path.join(root, 'src/engine.js'), 'utf8'));
t = t.replace('/*PUZZLES*/[]', () => fs.readFileSync(path.join(root, 'data/puzzles.json'), 'utf8'));
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/index.html'), t);
/* verification de syntaxe des scripts embarques */
const scripts = [...t.matchAll(/<script>([\s\S]*?)<\/script>/g)];
scripts.forEach((m, i) => { try { new Function(m[1]); } catch (e) { console.error('Erreur de syntaxe script', i, e.message); process.exit(1); } });
console.log('dist/index.html', t.length, 'octets,', scripts.length, 'scripts OK');
