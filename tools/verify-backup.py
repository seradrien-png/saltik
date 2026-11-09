"""Verify every exported original file and history part without external services."""
from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parents[1];manifest=json.loads((root/'backup-manifest.json').read_text());total=0
for project in manifest['projects']:
 for path,meta in project['files'].items():
  file=root/project['export_path']/path;data=file.read_bytes()
  if len(data)!=meta['size'] or hashlib.sha256(data).hexdigest()!=meta['sha256']:raise SystemExit('Invalid file: '+str(file))
  total+=1
 print('Verified:',project['slug'],project['file_count'],'files')
for history in manifest['histories']:
 combined=hashlib.sha256()
 for part in history['parts']:
  data=(root/part['path']).read_bytes()
  if len(data)!=part['bytes'] or hashlib.sha256(data).hexdigest()!=part['sha256']:raise SystemExit('Invalid history part: '+part['path'])
  combined.update(data)
 if combined.hexdigest()!=history['bundle_sha256']:raise SystemExit('Invalid combined history: '+history['repo'])
 print('Verified history:',history['repo'],history['commits'],'commits')
print('OK:',total,'original files and all history parts verified.')
