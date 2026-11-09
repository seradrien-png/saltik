// Home-screen installation stays browser-owned and always follows a user tap.
export function setupHomeShortcut(){
  const buttons=[...document.querySelectorAll('[data-install-shortcut]')];
  const dialog=document.getElementById('install-guide');
  if(!buttons.length||!dialog)return;
  const instructions=document.getElementById('install-instructions');
  const browserMode=document.body.dataset.launchMode==='browser';
  const publicRoot='https://saltik-v2-matin-dore.ser-adrien.chatgpt.site/';
  const gameURL=publicRoot+(browserMode?'android.html':'');
  const chromeIntent=url=>'intent://'+url.slice('https://'.length)+'#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url='+encodeURIComponent(url)+';end';
  const browserLink=document.getElementById('install-open-browser');
  const fallbackLink=document.getElementById('install-android-fallback');
  const address=document.getElementById('install-address');
  const copyStatus=document.getElementById('install-copy-status');
  const standalone=window.matchMedia('(display-mode: standalone)');
  let offeredPrompt=null,pending=false,installed=false,opener=null;
  const sync=()=>buttons.forEach(button=>{button.hidden=installed||standalone.matches||navigator.standalone===true;button.disabled=pending;});
  function showGuide(){
    const ua=navigator.userAgent;
    const apple=/iPad|iPhone|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
    const android=/Android/.test(ua);
    const steps=apple?[
      'Ouvrez le jeu dans Safari.',
      'Touchez Partager, puis « Sur l’écran d’accueil ». Le menu peut aussi proposer « Ajouter à l’écran d’accueil ».',
      'Gardez « Ouvrir comme app » activé si cette option apparaît, puis touchez Ajouter.'
    ]:android&&browserMode?[
      'Ouvrez cette page dans Chrome avec le bouton ci-dessous.',
      'Dans le menu ⋮, choisissez « Installer et créer un raccourci », puis « Créer un raccourci ». Selon la version de Chrome, choisissez « Ajouter à l’écran d’accueil ».',
      'Nommez le raccourci SALTIK, puis touchez Ajouter. Cette nouvelle icône ouvrira le jeu dans Chrome.'
    ]:android?[
      'Ouvrez le jeu dans Chrome avec le bouton ci-dessous.',
      'Dans le menu ⋮, choisissez « Installer et créer un raccourci », puis Installer. Selon la version de Chrome, choisissez « Ajouter à l’écran d’accueil ».',
      'Si votre icône ne réagit pas, utilisez « Créer un raccourci Android simple » ci-dessous.'
    ]:[
      'Ouvrez ce lien sur votre smartphone.',
      'Sur Android : menu ⋮ de Chrome → Ajouter à l’écran d’accueil.',
      'Sur iPhone : Partager dans Safari → Sur l’écran d’accueil → Ajouter.'
    ];
    browserLink.href=android?chromeIntent(gameURL):gameURL;
    browserLink.textContent=android?'Ouvrir dans Chrome ↗':'Ouvrir le lien du jeu ↗';
    if(android)browserLink.removeAttribute('target');else browserLink.target='_blank';
    fallbackLink.hidden=!android||browserMode;
    fallbackLink.href=chromeIntent(publicRoot+'android.html');
    document.getElementById('install-browser-note').textContent=android
      ?'Si le bouton ne lance pas Chrome, copiez le lien et collez-le dans Chrome.'
      :'Depuis ChatGPT, ouvrez d’abord le lien dans le navigateur de votre téléphone.';
    address.hidden=true;copyStatus.textContent='';
    instructions.replaceChildren(...steps.map(text=>{const item=document.createElement('li');item.textContent=text;return item;}));
    if(!dialog.open)dialog.showModal();
  }
  async function addShortcut(event){
    if(pending)return;
    opener=event.currentTarget;
    if(!offeredPrompt){showGuide();return;}
    const prompt=offeredPrompt;offeredPrompt=null;pending=true;sync();
    try{await prompt.prompt();await prompt.userChoice;}
    catch{showGuide();}
    finally{pending=false;sync();}
  }
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();if(!browserMode)offeredPrompt=event;sync();});
  window.addEventListener('appinstalled',()=>{installed=true;offeredPrompt=null;sync();if(dialog.open)dialog.close();});
  standalone.addEventListener?.('change',sync);
  buttons.forEach(button=>button.addEventListener('click',addShortcut));
  document.getElementById('install-close').addEventListener('click',()=>dialog.close());
  document.getElementById('install-copy-link').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(gameURL);copyStatus.textContent='Lien copié. Collez-le dans votre navigateur.';}
    catch{address.value=gameURL;address.hidden=false;address.focus();address.select();copyStatus.textContent='Sélectionnez et copiez ce lien, puis collez-le dans votre navigateur.';}
  });
  dialog.addEventListener('close',()=>{if(opener&&!opener.hidden)opener.focus({preventScroll:true});});
  dialog.addEventListener('keydown',event=>event.stopPropagation());
  sync();
}
