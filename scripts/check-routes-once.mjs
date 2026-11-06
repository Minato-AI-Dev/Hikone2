// One explicitly scoped live Routes API request to verify Hikone2's own server.
const endpoint='https://hikone2.vercel.app/api/walking-routes';
const controller=new AbortController();
const timeout=setTimeout(()=>controller.abort(),25000);
try{
 const response=await fetch(endpoint,{
  method:'POST',
  headers:{Origin:'https://hikone2.vercel.app','Content-Type':'application/json'},
  body:JSON.stringify({pairs:[{from:'S01',to:'D01'}]}),
  signal:controller.signal
 });
 const payload=await response.json().catch(()=>({}));
 if(response.status!==200)throw Error('Live Hikone2 Routes API returned HTTP '+response.status+', error='+String(payload.error||'unspecified'));
 const leg=payload.legs?.['S01>D01'];
 if(typeof leg?.seconds!=='number'||leg.seconds<=0||typeof leg?.meters!=='number'||leg.meters<=0)throw Error('Live route response did not include a valid distance and duration');
 console.log(JSON.stringify({routing:'passed',seconds:leg.seconds,meters:leg.meters,source:payload.locationVerification,partial:payload.partial}));
}finally{clearTimeout(timeout);}
