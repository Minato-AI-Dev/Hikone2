// Browser smoke test on an emulated phone. This is not a physical-device test.
// Requires installed Playwright Chromium and a Vite production build in dist/.
import {chromium,devices} from 'playwright';
import {spawn} from 'node:child_process';

const target='http://127.0.0.1:4173/';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173','--strictPort'],{stdio:'pipe'});
let output='';
server.stdout.on('data',part=>output+=String(part));
server.stderr.on('data',part=>output+=String(part));
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function ready(){
 for(let i=0;i<70;i++){
  if(server.exitCode!==null)throw Error('Vite preview process stopped: '+output);
  try{const r=await fetch(target);if(r.status===200)return;}catch{}
  await pause(250);
 }
 throw Error('Vite preview unavailable: '+output);
}
let browser;
try{
 await ready();
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({...devices['iPhone 13'],locale:'ja-JP'});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const assert=async(locator,what)=>{if(!await locator.isVisible()){const headings=await page.locator('h1,h2').allTextContents();const text=await page.locator('body').innerText();throw Error('Not visible: '+what+'; headings='+JSON.stringify(headings)+'; errors='+JSON.stringify(errors)+'; body='+text.slice(0,500)+'; url='+page.url())}};
 await page.goto(target,{waitUntil:'networkidle'});
 await assert(page.getByRole('heading',{name:/調査に.*協力しますか/}),'research consent');
 await page.getByRole('button',{name:'協力せずにはじめる'}).click();
 await assert(page.getByRole('heading',{name:'今どこにいますか？'}),'six-question entry');
 await page.getByRole('button',{name:'次の彦根'}).click();
 await assert(page.getByRole('heading',{name:/彦根に寄り道しませんか/}),'home heading');
 await page.getByRole('button',{name:/AIに相談する/}).click();
 await assert(page.getByRole('heading',{name:'今の気分を教えてください。'}),'AI screen');
 await page.getByRole('button',{name:'戻る'}).click();
 await page.getByRole('button',{name:/場所から探す/}).click();
 await assert(page.getByRole('heading',{name:'次は、どんな彦根を見る？'}),'catalog');
 await page.getByPlaceholder('例：仏壇、ひこにゃん、芹川、近代建築').fill('芹川');
 await assert(page.locator('.catalog-count'),'filtered destination count');
 await page.getByRole('button',{name:'ホームへ戻る'}).click();
 await page.getByRole('button',{name:/旅の記録を見る/}).click();
 await assert(page.getByRole('heading',{name:'あなたの彦根の記録'}),'history');
 await page.getByRole('button',{name:'ホームへ戻る'}).click();
 await page.getByRole('button',{name:/寄り道を探す/}).click();
 for(let i=0;i<5;i++)await page.getByRole('button',{name:'次へ'}).click();
 await assert(page.getByRole('heading',{name:'歩く速さ・今日の状況は？'}),'final question');
 await page.getByRole('button',{name:'おすすめを見る'}).click();
 await assert(page.getByRole('heading',{name:/寄り道なしが安心です/}),'fail-closed recommendation without paid external API');
 if(errors.length)throw Error('Client-side errors: '+errors.join(' | '));
 if(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2))
  throw Error('Horizontal overflow in iPhone viewport');
 console.log('PASS: mobile Chromium workflow (consent, questions, AI, catalog, history, safe API-unconfigured fallback).');
 await context.close();
}finally{
 await browser?.close();
 server.kill('SIGTERM');
}
