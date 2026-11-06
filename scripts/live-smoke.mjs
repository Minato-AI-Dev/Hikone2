// Public-site smoke on Hikone2 only. No paid Google/OpenAI APIs are called
// with valid credentials, and no existing Hikone1 endpoint is contacted.
const base=process.env.HIKONE2_LIVE_URL||'https://hikone2.vercel.app';
const assert=(condition,message)=>{if(!condition)throw Error(message)};
async function fetchTimeout(path,options={}){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),12000);
 try{return await fetch(base+path,{...options,redirect:'manual',signal:controller.signal});}
 finally{clearTimeout(timer)}
}
async function retry(path,options={},condition=r=>r.status===200){
 let last;
 for(let i=0;i<9;i++){
  try{const response=await fetchTimeout(path,options);last=response;
   if(condition(response))return response;
  }catch(e){last=e}
  await new Promise(resolve=>setTimeout(resolve,3000));
 }
 throw Error(path+': expected response not reached (last='+String(last?.status??last)+')');
}
const home=await retry('/');
const html=await home.text();
assert(html.includes('次の彦根'),'HTML title not found');
assert(html.includes('id="root"'),'Frontend root absent');
const assets=[...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(x=>x[1]);
assert(assets.length>0,'Built assets absent');
for(const asset of assets.slice(0,3)){const r=await fetchTimeout(asset);assert(r.status===200,'Missing static bundle: '+asset+' '+r.status)}
console.log('PASS live Hikone2 homepage and bundles');
const json=body=>({method:'POST',headers:{'Origin':base,'Content-Type':'application/json'},body:JSON.stringify(body)});
const routingBody={pairs:[{from:'S01',to:'D01'}]};
const blocked=await fetchTimeout('/api/walking-routes',{...json(routingBody),headers:{'Origin':'https://hikone-routes.vercel.app','Content-Type':'application/json'}});
assert(blocked.status===403,'Hikone1 origin must be denied (actual='+blocked.status+')');
console.log('PASS old Hikone1 Vercel origin rejected (403)');
// Test input validation without making a billable Google/OpenAI/Places request.
const routeInvalid=await fetchTimeout('/api/walking-routes',json({pairs:[]}));
assert(routeInvalid.status===400,'Independent walking route API must validate requests (actual='+routeInvalid.status+')');
console.log('PASS independent routing API validates input (400)');
const aiInvalid=await fetchTimeout('/api/hikone-ai',json({mode:'wrong',message:'hello'}));
assert(aiInvalid.status===400,'Independent AI API must validate requests (actual='+aiInvalid.status+')');
console.log('PASS independent AI API validates input (400)');
const shopInvalid=await fetchTimeout('/api/shop-hours',json({shopIds:['NOT_A_SHOP']}));
assert(shopInvalid.status===400,'Shop-status API must reject unrecognized shops (actual='+shopInvalid.status+')');
console.log('PASS independent shop API rejects unknown IDs');

