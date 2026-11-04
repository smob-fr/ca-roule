const {chromium}=require('playwright');
const E=require('../src/engine.js');
const PZ=require('../data/puzzles.json');
(async()=>{
 const b=await chromium.launch();
 const p=await b.newPage({viewport:{width:390,height:780},hasTouch:false});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));
 const N=3;const L=PZ[N-1];
 await p.addInitScript(n=>{localStorage.setItem('caroule.v1',JSON.stringify({level:1,max:1,test:true,seen:{},mode:'puzzle',pz:{level:n,max:n,stars:{}}}))},N);
 await p.goto('file://'+require('path').resolve(__dirname,'../dist/index.html')+'');await p.waitForTimeout(500);
 await p.click('#home-pz');await p.waitForTimeout(400); // quitte l'accueil
 const cars=L.cars.map(c=>({h:!!c[0],fixed:c[1],len:c[3]}));
 const r=E.pzSolve(cars,L.cars.map(c=>c[2]),2e6);
 const pos=L.cars.map(c=>c[2]);
 for(const s of r.path){
  const box=await p.evaluate(j=>{const n=document.querySelectorAll('.pcar')[j].getBoundingClientRect();return {x:n.x+n.width/2,y:n.y+n.height/2,cell:document.getElementById('board').getBoundingClientRect().width/6}},s.car);
  const d=(s.to-pos[s.car])*box.cell;const h=cars[s.car].h;
  await p.mouse.move(box.x,box.y);await p.mouse.down();
  await p.mouse.move(box.x+(h?d/2:0),box.y+(h?0:d/2),{steps:3});
  await p.mouse.move(box.x+(h?d:0),box.y+(h?0:d),{steps:3});
  await p.mouse.up();pos[s.car]=s.to;await p.waitForTimeout(250);
 }
 await p.waitForTimeout(1200);
 console.log('moves',await p.textContent('#pz-n'),'opt',r.opt,'win visible',await p.evaluate(()=>!document.getElementById('win').hidden),await p.textContent('#win-stat'));
 await p.screenshot({path:'/tmp/pz3.png'});
 console.log(errs);await b.close();
})();
