const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();
 const p=await b.newPage({viewport:{width:390,height:780},hasTouch:true});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+require('path').resolve(__dirname,'../dist/index.html')+'');await p.waitForTimeout(500);
 const vis=()=>p.evaluate(()=>!document.getElementById('levels').hidden);
 await p.tap('#btn-levels');console.log('1',await vis());
 await p.tap('#tab-pz');await p.waitForTimeout(100);
 console.log('pz grid kids',await p.evaluate(()=>document.getElementById('pz-grid').children.length));
 await p.tap('#pz-grid .lv:nth-child(1)');await p.waitForTimeout(400);
 console.log('2 closed',!(await vis()));
 await p.tap('#btn-levels');console.log('3',await vis());
 await p.tap('#levels-close');await p.tap('#btn-restart');await p.tap('#btn-levels');console.log('4',await vis());
 await p.tap('#tab-run');await p.tap('#level-grid .lv:nth-child(1)');await p.waitForTimeout(300);
 await p.tap('#btn-levels');console.log('5',await vis());
 console.log(errs);await b.close();
})();
