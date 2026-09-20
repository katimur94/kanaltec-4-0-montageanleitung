"""Install the secret-free skill for this user; never copy private configuration."""
import argparse,os,shutil
from pathlib import Path

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--replace',action='store_true');args=parser.parse_args()
 source=Path(__file__).resolve().parents[1]
 legacy=Path(os.environ.get('CODEX_HOME',Path.home()/'.codex'))/'skills/telegram-delivery'
 target=legacy if legacy.is_dir() else Path.home()/'.agents/skills/telegram-delivery'
 files=['SKILL.md','agents/openai.yaml','scripts/store.py','scripts/configure.py','scripts/send.py','scripts/install.py']
 if source==target.resolve():print('Already installed.');return
 if target.exists() and not args.replace:raise RuntimeError('Skill exists; use --replace to update its skill files')
 for name in files:
  dest=target/name;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source/name,dest)
 print('Telegram delivery skill installed for this user. Credentials unchanged. Run send.py --check on this computer.')

if __name__=='__main__':main()
