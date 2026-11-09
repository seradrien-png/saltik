"""Prepare only the unchanged playable web exports for GitHub Pages."""
from pathlib import Path
import json,shutil,sys
root=Path(__file__).resolve().parents[1]
dest=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else root/'_site'
if dest.exists():raise SystemExit('Destination exists; choose an empty new destination.')
dest.mkdir(parents=True)
manifest=json.loads((root/'backup-manifest.json').read_text())
for project in manifest['projects']:
 source=root/project['export_path']/'dist';target=dest/project['export_path']/'dist'
 target.parent.mkdir(parents=True,exist_ok=True);shutil.copytree(source,target)
shutil.copy2(root/'index.html',dest/'index.html');shutil.copy2(root/'README.md',dest/'README.md');(dest/'.nojekyll').touch()
print('Unchanged independent web builds prepared:',dest)
