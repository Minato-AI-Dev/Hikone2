import {afterEach,expect,it,vi} from 'vitest';
import {prepareJson,type ApiRequest,type ApiResponse} from '../server/http';
import {readFileSync} from 'node:fs';

const req=(origin:string):ApiRequest=>({method:'POST',headers:{origin,'content-type':'application/json'},body:{pairs:[{from:'S01',to:'D01'}]}});
const res=()=>({code:0,body:null as unknown,headers:{} as Record<string,string>,setHeader(k:string,v:string){this.headers[k]=v;return this;},status(c:number){this.code=c;return this;},json(data:unknown){this.body=data;return this;},end(){return this;}}) as ApiResponse & {code:number;headers:Record<string,string>};
afterEach(()=>vi.unstubAllEnvs());
it('accepts only Hikone2 owned deployment origins when Vercel has no manual origin configured',()=>{
 vi.stubEnv('HIKONE_ALLOWED_ORIGIN','');
 vi.stubEnv('VERCEL','1');
 vi.stubEnv('VERCEL_URL','hikone2-test-vintage-projects.vercel.app');
 vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL','hikone2.vercel.app');
 const preview=res();
 expect(prepareJson(req('https://hikone2-test-vintage-projects.vercel.app'),preview)).toBe(true);
 expect(preview.headers['Access-Control-Allow-Origin']).toBe('https://hikone2-test-vintage-projects.vercel.app');
 const prod=res();
 expect(prepareJson(req('https://hikone2.vercel.app'),prod)).toBe(true);
 const old=res();
 expect(prepareJson(req('https://hikone-routes.vercel.app'),old)).toBe(false);
 expect(old.code).toBe(403);
 const fake=res();
 expect(prepareJson(req('https://evil.example'),fake)).toBe(false);
 expect(fake.code).toBe(403);
});
it('fails closed if there is no approved Vercel domain',()=>{
 vi.stubEnv('HIKONE_ALLOWED_ORIGIN','');
 vi.stubEnv('VERCEL','1');
 vi.stubEnv('VERCEL_URL','evil.example');
 vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL','');
 const response=res();
 expect(prepareJson(req('https://evil.example'),response)).toBe(false);
 expect(response.code).toBe(503);
});
it('ships both frontend and API without using Hikone1 frontend origin',()=>{
 const config=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
 expect(config.buildCommand).toContain('npm run build && npm run build:backend && cp -R dist/. backend-public/');
 expect(readFileSync(new URL('../vite.config.ts',import.meta.url),'utf8')).toContain("process.env.VERCEL === '1' ? '/' : '/Hikone2/'");
 for(const file of ['walkingRoutes.ts','hikoneAI.ts']){
  const source=readFileSync(new URL('../src/lib/'+file,import.meta.url),'utf8');
  expect(source).toContain("import.meta.env.BASE_URL==='/'");
 }
});
