import argparse,hashlib,json,mimetypes,sys,urllib.request,urllib.error,uuid
from pathlib import Path
from store import ROOT,load_credentials
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--text',default='');ap.add_argument('--file');ap.add_argument('--check',action='store_true');ap.add_argument('--resend',action='store_true');a=ap.parse_args()
 cfg=load_credentials();token,chat=cfg['token'],cfg['chat']
 if a.check:print(json.dumps({'ok':True,'credentials_readable':True}));return
 p=Path(a.file).resolve() if a.file else None
 if not p and not a.text:raise ValueError('No content')
 if len(a.text)>(1024 if p else 4096):raise ValueError('Caption/message too long')
 if p and (not p.is_file() or p.stat().st_size>=49_000_000):raise ValueError('File missing or too large')
 raw=p.read_bytes() if p else b'';key=hashlib.sha256((chat+a.text+(p.name if p else '')).encode()+raw).hexdigest()
 ROOT.mkdir(parents=True,exist_ok=True,mode=0o700)
 lp=ROOT/'receipts.json';ledger=json.loads(lp.read_text()) if lp.exists() else {};old=ledger.get(key,{})
 if not a.resend and old.get('ok'):print(json.dumps(dict(old,already_sent=True)));return
 if not a.resend and old.get('status') in ('pending','uncertain'):raise RuntimeError('Delivery uncertain; do not retry without checking')
 method='sendMessage';fields={'chat_id':chat,'text':a.text};ctype='application/json'
 if p:
  method='sendVideo' if p.suffix.lower()=='.mp4' else 'sendPhoto' if p.suffix.lower() in ('.png','.jpg','.jpeg') and len(raw)<9_000_000 else 'sendDocument'
  field={'sendVideo':'video','sendPhoto':'photo','sendDocument':'document'}[method];fields={'chat_id':chat,'caption':a.text}
  if method=='sendVideo':fields['supports_streaming']='true'
  boundary='----delivery'+uuid.uuid4().hex;body=bytearray()
  for k,v in fields.items():body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
  filename=p.name.replace('"','').replace('\r','').replace('\n','');mime=mimetypes.guess_type(filename)[0] or 'application/octet-stream'
  body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="{field}"; filename="{filename}"\r\nContent-Type: {mime}\r\n\r\n'.encode());body.extend(raw);body.extend(f'\r\n--{boundary}--\r\n'.encode());ctype='multipart/form-data; boundary='+boundary
 else:body=json.dumps(fields).encode()
 def save(record):ledger[key]=record;tmp=lp.with_suffix('.tmp');tmp.write_text(json.dumps(ledger,indent=2),encoding='utf-8');tmp.replace(lp)
 save({'ok':False,'status':'pending','file':p.name if p else None})
 try:
  req=urllib.request.Request('https://api.telegram.org/bot'+token+'/'+method,data=bytes(body),headers={'Content-Type':ctype})
  with urllib.request.urlopen(req,timeout=300) as response:result=json.load(response)
 except urllib.error.HTTPError as e:
  save({'ok':False,'status':'rejected','http_status':e.code});print(json.dumps(ledger[key]));sys.exit(1)
 except Exception:
  save({'ok':False,'status':'uncertain'});print(json.dumps(ledger[key]));sys.exit(1)
 record={'ok':bool(result.get('ok')),'status':'sent' if result.get('ok') else 'rejected','message_id':result.get('result',{}).get('message_id'),'file':p.name if p else None};save(record);print(json.dumps(record));
 if not record['ok']:sys.exit(1)
if __name__=='__main__':
 try:main()
 except Exception as e:print(json.dumps({'ok':False,'error_type':type(e).__name__}));sys.exit(1)
