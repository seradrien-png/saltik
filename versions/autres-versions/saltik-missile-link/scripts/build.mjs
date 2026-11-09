import {mkdir,copyFile,cp,readFile,writeFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const file of ['index.html','style.css','favicon.svg','manifest.webmanifest'])await copyFile(file,`dist/${file}`);
// A regular Chrome bookmark is an alternative when Android's installed app will not open.
// Generate it from the same page so controls, artwork and gameplay cannot drift apart.
const browserPage=(await readFile('index.html','utf8'))
  .replace('<body>','<body data-launch-mode="browser">')
  .replace(/<title>[^<]*<\/title>/,'<title>SALTIK V2 — Missile Link</title>')
  .replace(/<link rel="manifest"[^>]*>/g,'')
  .replace(/<meta name="(?:mobile-web-app-capable|apple-mobile-web-app-[^"]+)"[^>]*>/g,'')
  .replace(/^[ \t]+$/gm,'')
  .replace('<link rel="icon" href="./favicon.svg" type="image/svg+xml">','<link rel="icon" href="./icons/saltik-192.png" type="image/png" sizes="192x192">');
await writeFile('dist/android.html',browserPage);
await cp('icons','dist/icons',{recursive:true});
await cp('src','dist/src',{recursive:true});
console.log('Buildless game prepared in dist/; local art preserved.');
