import React,{useState,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
const API=window.location.protocol+'//'+window.location.hostname+':5000';
function App(){
 const [input,setInput]=useState('10, 20, 30'),[rows,setRows]=useState([]),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 async function call(route,options){const res=await fetch(API+route,options);const data=await res.json();if(!res.ok)throw Error(data.error||'Erreur HTTP');return data;}
 async function history(){setRows(await call('/history'));}
 useEffect(()=>{history().catch(e=>setMessage(e.message));},[]);
 async function calculate(e){e.preventDefault();setBusy(true);setMessage('');try{
 const parts=input.split(',').map(x=>x.trim());if(parts.some(x=>!x))throw Error('Saisissez des nombres séparés par des virgules.');
 const numbers=parts.map(Number);if(numbers.some(x=>!Number.isFinite(x)))throw Error('Saisie invalide.');
 const result=await call('/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({numbers})});
 setMessage('Moyenne : '+result.average+' | Maximum : '+result.maximum);await history();
 }catch(e){setMessage(e.message);}finally{setBusy(false);}}
 return <main style={{fontFamily:'Arial',maxWidth:800,margin:'40px auto',padding:20}}><h1>EcoTrack Analytics</h1><p>Analysez vos mesures et consultez les résultats enregistrés.</p>
 <form onSubmit={calculate}><label htmlFor="numbers">Mesures séparées par des virgules</label><br/><input id="numbers" value={input} onChange={e=>setInput(e.target.value)} style={{padding:10,width:'65%',margin:'12px 0'}}/><button disabled={busy} style={{padding:10,marginLeft:10}}>{busy?'Calcul…':'Analyser'}</button></form>
 <p role="status">{message}</p><h2>Historique</h2><button onClick={()=>history().catch(e=>setMessage(e.message))}>Actualiser</button>
 <ul>{rows.map(row=><li key={row.id}>{new Date(row.created_at).toLocaleString('fr-FR')} — [{row.numbers.join(', ')}] — Moyenne : {row.average} ; Maximum : {row.maximum}</li>)}</ul></main>;
}
createRoot(document.getElementById('root')).render(<App/>);
