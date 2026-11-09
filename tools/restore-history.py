"""Verify and restore a source repository's complete locally accessible history.
Never pushes, deletes or overwrites any original repository.
"""
from pathlib import Path
import argparse,json,hashlib,tempfile,subprocess
p=argparse.ArgumentParser();p.add_argument('repository');p.add_argument('destination');args=p.parse_args()
root=Path(__file__).resolve().parents[1];dest=Path(args.destination).resolve()
if dest.exists():raise SystemExit('Destination exists; originals will not be overwritten.')
manifest=json.loads((root/'backup-manifest.json').read_text());history=next((h for h in manifest['histories'] if h['repo']==args.repository),None)
if not history:raise SystemExit('Unknown repository in backup manifest.')
with tempfile.TemporaryDirectory(prefix='saltik-history-') as tmp:
 bundle=Path(tmp)/'history.bundle';digest=hashlib.sha256()
 with bundle.open('wb') as output:
  for part in history['parts']:
   data=(root/part['path']).read_bytes()
   if len(data)!=part['bytes'] or hashlib.sha256(data).hexdigest()!=part['sha256']:raise SystemExit('Invalid part: '+part['path'])
   output.write(data);digest.update(data)
 if digest.hexdigest()!=history['bundle_sha256']:raise SystemExit('Invalid combined bundle.')
 subprocess.run(['git','clone','--mirror',str(bundle),str(dest)],check=True)
 subprocess.run(['git','-C',str(dest),'fsck','--full'],check=True)
print('Verified source history restored locally:',dest)
