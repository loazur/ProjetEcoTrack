const express=require('express'),cors=require('cors'),fs=require('fs');
const {Pool}=require('pg');
const app=express();app.use(cors());app.use(express.json({limit:'32kb'}));
const password=process.env.POSTGRES_PASSWORD_FILE?fs.readFileSync(process.env.POSTGRES_PASSWORD_FILE,'utf8').trim():process.env.POSTGRES_PASSWORD;
if(!password)throw Error('Configurer POSTGRES_PASSWORD_FILE ou POSTGRES_PASSWORD dans api.');
const pool=new Pool({host:process.env.POSTGRES_HOST||'db',port:Number(process.env.POSTGRES_PORT||5432),database:process.env.POSTGRES_DB||'appdb',user:process.env.POSTGRES_USER||'etudiant',password,connectionTimeoutMillis:3000});
pool.on('error',e=>console.error(e.message));
const worker=process.env.WORKER_URL||'http://worker:8000';
app.get('/health',(_req,res)=>res.json({status:'ok'}));
app.get('/status',async(_req,res)=>{try{await pool.query('SELECT 1');const reply=await fetch(worker+'/health',{signal:AbortSignal.timeout(5000)});if(!reply.ok)throw Error('Worker indisponible');res.json({api:'ok',db:'ok',worker:'ok'});}catch(e){console.error(e.message);res.status(503).json({error:'Base ou worker indisponible.'});}});
app.get('/history',async(_req,res)=>{try{res.json((await pool.query('SELECT * FROM analyses ORDER BY id DESC LIMIT 50')).rows);}catch(e){console.error(e.message);res.status(503).json({error:'Historique indisponible.'});}});
app.post('/analyze',async(req,res)=>{
 const numbers=req.body&&req.body.numbers;
 if(!Array.isArray(numbers)||!numbers.length||numbers.length>1000||numbers.some(x=>typeof x!=='number'||!Number.isFinite(x)||Math.abs(x)>1e12))return res.status(400).json({error:'Fournir 1 à 1000 nombres finis entre -10^12 et 10^12.'});
 let result;
 try{const reply=await fetch(worker+'/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({numbers}),signal:AbortSignal.timeout(5000)});if(!reply.ok)throw Error('Erreur worker');result=await reply.json();if(!Number.isFinite(result.average)||!Number.isFinite(result.maximum))throw Error('Résultat invalide');}
 catch(e){console.error(e.message);return res.status(502).json({error:'Le service Python ne répond pas correctement.'});}
 try{const saved=await pool.query('INSERT INTO analyses(numbers,average,maximum) VALUES($1::jsonb,$2,$3) RETURNING *',[JSON.stringify(numbers),result.average,result.maximum]);res.status(201).json(saved.rows[0]);}
 catch(e){console.error(e.message);res.status(503).json({error:'Impossible de sauvegarder le résultat.'});}
});
app.use((error,_req,res,_next)=>res.status(error.status===413?413:400).json({error:'Requête JSON invalide ou trop volumineuse.'}));
async function start(){for(let attempt=1;attempt<=30;attempt++){try{
 await pool.query('CREATE TABLE IF NOT EXISTS analyses(id SERIAL PRIMARY KEY,numbers JSONB NOT NULL,average DOUBLE PRECISION NOT NULL,maximum DOUBLE PRECISION NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
 app.listen(5000,'0.0.0.0',()=>console.log('EcoTrack API sur le port 5000'));return;
 }catch(e){console.error('Attente PostgreSQL '+attempt+'/30 : '+e.message);await new Promise(r=>setTimeout(r,1000));}}
 await pool.end();process.exitCode=1;}
start();
