const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();
 const p=await b.newPage({viewport:{width:390,height:780},deviceScaleFactor:2});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.addInitScript(()=>{localStorage.setItem('caroule.v1',JSON.stringify({level:1,max:1,test:true,seen:{},mode:'puzzle',pz:{level:12,max:12,stars:{1:3,2:2}}}))});
 await p.goto('file://'+require('path').resolve(__dirname,'../dist/index.html')+'');
 await p.waitForTimeout(600);
 await p.screenshot({path:'/tmp/pz1.png'});
 // drag test: find a car with a range
 const r=await p.evaluate(()=>[...document.querySelectorAll('.pcar')].map(n=>n.getBoundingClientRect().toJSON()));
 console.log(JSON.stringify(r.slice(0,3)));
 await p.click('#btn-levels');await p.waitForTimeout(300);
 await p.screenshot({path:'/tmp/pz2.png'});
 console.log(errs);
 await b.close();
})();
