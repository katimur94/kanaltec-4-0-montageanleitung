const http=require('http'),fs=require('fs'),path=require('path');
const root=process.argv[2]||'.';
const capDir=path.join(__dirname,'captures'); fs.mkdirSync(capDir,{recursive:true});
http.createServer((req,res)=>{
  const [p0,qs]=req.url.split('?'); let p=decodeURIComponent(p0);
  if(req.method==='POST' && p==='/save'){
    const name=(new URLSearchParams(qs||'').get('name')||'cap').replace(/[^a-z0-9_\-]/gi,'_');
    let body=''; req.on('data',c=>body+=c); req.on('end',()=>{
      const m=body.match(/^data:image\/(\w+);base64,(.*)$/s);
      if(!m){ res.writeHead(400); res.end('bad'); return; }
      const f=path.join(capDir,name+'.'+(m[1]==='jpeg'?'jpg':m[1]));
      fs.writeFileSync(f,Buffer.from(m[2],'base64')); res.writeHead(200,{'Content-Type':'text/plain'}); res.end('saved '+f);
    });
    return;
  }
  if(p==='/') p='/Kanaltec_4_0_Montageanleitung_3D.html';
  const f=path.join(root,p);
  fs.readFile(f,(e,d)=>{ if(e){res.writeHead(404);res.end('nf');return;} res.writeHead(200,{'Content-Type':f.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream'}); res.end(d); });
}).listen(8765,()=>console.log('serving',root,'on 8765'));
