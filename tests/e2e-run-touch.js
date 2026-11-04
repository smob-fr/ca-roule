const {chromium}=require('playwright');
const E=require('../src/engine.js');
(async()=>{
 const b=await chromium.launch();
 const p=await b.newPage({viewport:{width:390,height:780},hasTouch:true,isMobile:true});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+require('path').resolve(__dirname,'../dist/index.html')+'');await p.waitForTimeout(500);
 for (let lvl=1; lvl<=4; lvl++){
  const L=E.generate(lvl); const order=E.solve(L.cars,L.W,L.H,L.rocks);
  for (const id of order){ const c=L.cars[id]; if(c.taps>1||true){ const n=c.taps>1?2:1; for(let k=0;k<n;k++){ await p.tap('.car[data-id="'+id+'"]'); await p.waitForTimeout(120);} } await p.waitForTimeout(500); }
  await p.waitForTimeout(900);
  const w=await p.evaluate(()=>!document.getElementById('win').hidden);
  console.log('lvl',lvl,'win',w,'hearts',await p.evaluate(()=>document.querySelectorAll('.heart.lost').length));
  if(!w) break;
  await p.tap('#win-next');await p.waitForTimeout(300);
  if(await p.evaluate(()=>!document.getElementById('ad').hidden)){await p.waitForTimeout(3300);await p.tap('#ad-close');await p.waitForTimeout(300);}
 }
 console.log(errs);await b.close();
})();
