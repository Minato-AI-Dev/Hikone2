// One-time verification of Hikone2's production AI bridge. No secrets or user data.
const root='https://hikone2.vercel.app';
const abort=new AbortController();
const timeout=setTimeout(()=>abort.abort(),29000);
async function post(body){
 const response=await fetch(root+'/api/hikone-ai',{
  method:'POST',
  headers:{Origin:root,'Content-Type':'application/json'},
  body:JSON.stringify(body),
  signal:abort.signal
 });
 const value=await response.json().catch(()=>({}));
 if(response.status!==200){
  const short=typeof value.error==='string'?value.error:'unknown';
  throw new Error('Hikone2 AI response status '+response.status+' ('+short+'). No API credentials logged.');
 }
 return value;
}
try {
 const understood=await post({mode:'extract-v4',message:'彦根城を出た。あと35分で彦根駅に戻る。街歩きをしたい。'});
 if(typeof understood.message!=='string'||!understood.answers||typeof understood.answers!=='object')throw Error('Unexpected extract schema');
 const a=understood.answers;
 if(a.currentNodeId&&a.currentNodeId!=='S01')throw Error('AI selected unexpected origin node');
 if(a.finalNodeId&&a.finalNodeId!=='D01')throw Error('AI selected unexpected final node');
 if(a.remainingTimeMin!==undefined&&a.remainingTimeMin!==35)throw Error('AI misunderstood remaining minutes');
 console.log(JSON.stringify({mode:'extract-v4',status:'passed',outputKeys:Object.keys(a).sort()}));
 const candidates=[{id:'A01',node:'夢京橋キャッスルロード',action:'街並みを眺める',layer:'L1',detourMinutes:8,matchingTags:['街歩き']}];
 const presented=await post({mode:'present-v4',message:'あと35分で彦根駅に戻る。街歩きをしたい。',candidates});
 if(typeof presented.intro!=='string'||typeof presented.reasons!=='object'||presented.reasons===null)throw Error('Unexpected present schema');
 if(Object.keys(presented.reasons).some(id=>id!=='A01'))throw Error('AI attempted to introduce an unknown candidate');
 console.log(JSON.stringify({mode:'present-v4',status:'passed',hasIntro:presented.intro.length>0,candidateCount:Object.keys(presented.reasons).length}));
}finally{clearTimeout(timeout)}
