import argparse,json,re,sys
from pathlib import Path
from store import save_credentials
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--env-file',required=True);ap.add_argument('--replace',action='store_true');a=ap.parse_args()
 values={}
 for line in Path(a.env_file).read_text(encoding='utf-8-sig').splitlines():
  if '=' in line and not line.lstrip().startswith('#'):
   k,v=line.split('=',1)
   if k.strip() in ('TELEGRAM_BOT_TOKEN','TELEGRAM_CHAT_ID','ALLOWED_USER_ID'):values[k.strip()]=v.strip().strip('"').strip("'")
 token=values.get('TELEGRAM_BOT_TOKEN','');chat=values.get('TELEGRAM_CHAT_ID') or values.get('ALLOWED_USER_ID','')
 if not re.fullmatch(r'\d+:[A-Za-z0-9_-]+',token) or not re.fullmatch(r'-?\d+',chat):raise RuntimeError('Required Telegram token or numeric recipient is missing')
 save_credentials(dict(token=token,chat=chat),a.replace)
 print(json.dumps({'ok':True,'encrypted':True,'configuration':'telegram-delivery'}))
if __name__=='__main__':
 try:main()
 except Exception as e:print(json.dumps({'ok':False,'error_type':type(e).__name__}));sys.exit(1)
