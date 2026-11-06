// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import App from '../src/App';

vi.mock('../src/QrScanner',()=>({
 default:({mode,onDecoded,onCancel}:{mode:string;onDecoded?:(code:string)=>void;onCancel:()=>void})=>
  <section><h2>QRコードを読み取る</h2><p>モックのカメラ画面</p>
   <button onClick={()=>onDecoded?.('https://evil.example/?test=1')}>モックQRを読み取る</button>
   <button onClick={onCancel}>読み取りをやめる</button>
   <p>モード:{mode}</p>
  </section>
}));
beforeEach(()=>{localStorage.clear();vi.clearAllMocks();vi.stubGlobal('fetch',vi.fn(async()=>({ok:true})));});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});

it('displays QR contents without opening the URL or creating a visit record',async()=>{
 render(<App/>);
 fireEvent.click(screen.getByRole('button',{name:'協力せずにはじめる'}));
 fireEvent.click(screen.getByRole('button',{name:'次の彦根'}));
 fireEvent.click(screen.getByRole('button',{name:/QRコードを読み取る/}));
 await screen.findByText('モックのカメラ画面');
 fireEvent.click(screen.getByRole('button',{name:'モックQRを読み取る'}));
 await screen.findByRole('heading',{name:'読み取った内容'});
 expect(screen.getByText('https://evil.example/?test=1')).toBeTruthy();
 expect(screen.getByText(/リンクは自動で開きません/)).toBeTruthy();
 expect(localStorage.getItem('hikone2-next-history-v1')).toBeNull();
 expect(fetch).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'ホームへ戻る'}));
 expect(screen.getByRole('button',{name:/QRコードを読み取る/})).toBeTruthy();
});
