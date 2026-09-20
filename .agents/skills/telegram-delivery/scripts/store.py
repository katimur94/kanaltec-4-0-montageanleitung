import ctypes,os,pathlib,json
from ctypes import wintypes
ROOT=pathlib.Path.home()/'.codex/private/telegram-delivery'
class Blob(ctypes.Structure):
 _fields_=[('size',wintypes.DWORD),('data',ctypes.POINTER(ctypes.c_ubyte))]
def crypt(data,decrypt=False):
 if os.name!='nt':raise RuntimeError('Windows user context required')
 buf=ctypes.create_string_buffer(data);src=Blob(len(data),ctypes.cast(buf,ctypes.POINTER(ctypes.c_ubyte)));dst=Blob()
 api=ctypes.windll.crypt32.CryptUnprotectData if decrypt else ctypes.windll.crypt32.CryptProtectData
 if not api(ctypes.byref(src),None,None,None,None,1,ctypes.byref(dst)):raise RuntimeError('Credential protection unavailable in this user context')
 try:return ctypes.string_at(dst.data,dst.size)
 finally:ctypes.windll.kernel32.LocalFree(dst.data)

def vault():
 import keyring
 backend=keyring.get_keyring()
 name=type(backend).__module__
 if not name.startswith(('keyring.backends.macOS','keyring.backends.SecretService','keyring.backends.kwallet')):
  raise RuntimeError('Configure a secure OS keyring backend')
 return keyring

def load_credentials():
 token=os.environ.get('TELEGRAM_BOT_TOKEN');chat=os.environ.get('TELEGRAM_CHAT_ID') or os.environ.get('ALLOWED_USER_ID')
 if token and chat:return dict(token=token,chat=chat)
 if os.name=='nt':return json.loads(crypt((ROOT/'credentials.bin').read_bytes(),True))
 value=vault().get_password('codex-telegram-delivery','bot-and-recipient')
 if not value:raise RuntimeError('Telegram configuration missing')
 return json.loads(value)

def save_credentials(config,replace=False):
 raw=json.dumps(config)
 if os.name=='nt':
  dest=ROOT/'credentials.bin'
  if dest.exists() and not replace:raise RuntimeError('Configuration already exists')
  encrypted=crypt(raw.encode());ROOT.mkdir(parents=True,exist_ok=True);dest.write_bytes(encrypted)
  assert crypt(dest.read_bytes(),True)==raw.encode()
 else:
  backend=vault()
  if backend.get_password('codex-telegram-delivery','bot-and-recipient') and not replace:raise RuntimeError('Configuration already exists')
  backend.set_password('codex-telegram-delivery','bot-and-recipient',raw)
