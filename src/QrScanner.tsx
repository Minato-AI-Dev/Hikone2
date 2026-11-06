import { useEffect, useId, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

type Props =
  | { mode:'read'; onDecoded:(text:string)=>void; onCancel:()=>void }
  | { mode:'checkpoint'; experienceId:string; experienceName:string; onMatched:(text:string)=>void; onCancel:()=>void };

// Check-in QR text is an identifier only, not a cryptographic proof of presence.
// Reject unrelated origins and URLs with unexpected parameters.
export function matchesCheckpoint(decodedText:string, experienceId:string):boolean {
  if(!/^[A-Za-z0-9_-]{1,128}$/.test(experienceId))return false;
  const value=decodedText.trim();
  if(value===`hikone://checkin/${experienceId}`)return true;
  try{
    const url=new URL(value);
    return url.protocol==='https:' && url.hostname==='hikone2.vercel.app'
      && url.pathname==='/' && url.searchParams.size===1
      && url.searchParams.get('checkin')===experienceId
      && !url.username && !url.password && !url.hash;
  }catch{return false;}
}

export default function QrScanner(props:Props){
  const readerId=useId().replace(/:/g,'-');
  const scannerRef=useRef<Html5Qrcode|null>(null);
  const callbackRef=useRef<(value:string)=>void>(()=>{});
  callbackRef.current=props.mode==='read'?props.onDecoded:props.onMatched;
  const experienceId=props.mode==='checkpoint'?props.experienceId:null;
  const verifiedRef=useRef(false);
  const [message,setMessage]=useState('カメラを起動しています…');
  const [manualCode,setManualCode]=useState('');
  const [cameraError,setCameraError]=useState(false);

  useEffect(()=>{
    let cancelled=false;
    let started=false;
    const scanner=new Html5Qrcode(readerId,{formatsToSupport:[Html5QrcodeSupportedFormats.QR_CODE],verbose:false});
    scannerRef.current=scanner;
    const stop=async()=>{
      try{if(started){await scanner.stop();started=false;}}catch{/* already stopped */}
      try{await scanner.clear();}catch{/* already cleared */}
    };
    const accept=async(code:string)=>{
      if(cancelled||verifiedRef.current)return;
      if(experienceId!==null&&!matchesCheckpoint(code,experienceId)){
        setMessage('この寄り道のチェックイン用コードと一致しません。');
        return;
      }
      verifiedRef.current=true;
      setMessage(experienceId!==null?'コードが一致しました（現地訪問の証明ではありません）。':'QRの内容を読み取りました。');
      await stop();
      if(!cancelled)callbackRef.current(code.trim());
    };
    const start=async()=>{
      try{
        await scanner.start({facingMode:'environment'},{fps:8,qrbox:{width:240,height:240},aspectRatio:1},text=>void accept(text),()=>undefined);
        started=true;
        if(cancelled){await stop();return;}
        setCameraError(false);
        setMessage('QRコードを枠の中に入れてください。');
      }catch{
        if(!cancelled){setCameraError(true);setMessage('カメラを使えませんでした。ブラウザのカメラ許可をご確認ください。');}
      }
    };
    void start();
    return()=>{cancelled=true;void stop();scannerRef.current=null;};
  },[readerId,experienceId]);

  const manual=()=>{
    const code=manualCode.trim();
    if(!code||verifiedRef.current)return;
    if(experienceId!==null&&!matchesCheckpoint(code,experienceId)){
      setMessage('入力した文字列は、この寄り道のコードと一致しません。');
      return;
    }
    verifiedRef.current=true;
    callbackRef.current(code);
  };

  return <section className="center qr-screen">
    <p className="eyebrow">{experienceId!==null?'実証用チェックイン':'QRコード読み取り'}</p>
    <h2>{props.mode==='checkpoint'?props.experienceName:'QRコードを読み取る'}</h2>
    <p>{experienceId!==null?'寄り道に対応するQRコードを読み取ります。':'カメラでQRコードの内容を確認できます。リンクは自動で開きません。'}</p>
    {experienceId!==null&&<p className="note">現地QRが未設置の場合は照合できません。コード一致は現地到着の証明ではなく、訪問記録はご本人の申告です。</p>}
    <div id={readerId} className="qr-reader" aria-label="QRコード読み取りカメラ"/>
    <p role="status" className={cameraError?'qr-message error':'qr-message'}>{message}</p>
    <details className="qr-fallback">
      <summary>カメラが使えない場合</summary>
      <p className="muted">{experienceId!==null?'QRの下に表示された文字列を入力してください（試験用）。':'QRの内容を文字列で入力して動作を確認できます。'}</p>
      <input aria-label="QRコードの文字列" value={manualCode} maxLength={2048} onChange={e=>setManualCode(e.target.value)} placeholder={experienceId!==null?'確認コード':'QRに記載された文字列'} autoCapitalize="none" autoCorrect="off"/>
      <button className="secondary" onClick={manual} disabled={!manualCode.trim()}>文字列を確認する</button>
    </details>
    <button className="link" onClick={props.onCancel}>読み取りをやめる</button>
  </section>;
}
