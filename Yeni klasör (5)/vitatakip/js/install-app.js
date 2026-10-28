/* UYGULAMAYI İNDİR / TELEFONA YÜKLE bölümü
   Android ve iPhone/iPad için tarayıcıdan yükleme (PWA). Mağaza bağlantısı varsa aşağıdaki
   VITA_STORE_LINKS alanlarına yazın; yazılırsa düğmeler doğrudan mağazaya gider. */
(function(){
  'use strict';
  const VITA_STORE_LINKS={
    android:'', /* Örn: https://play.google.com/store/apps/details?id=... */
    ios:''      /* Örn: https://apps.apple.com/app/id... */
  };
  let deferredPrompt=null, modal=null, returnFocus=null, previousOverflow='';

  const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const isSecureContextForInstall=()=>window.isSecureContext||location.hostname==='localhost'||location.hostname==='127.0.0.1';

  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;});
  window.addEventListener('appinstalled',()=>{deferredPrompt=null;const s=document.getElementById('vitaInstallSection');if(s)s.hidden=true;});

  function ensureModal(){
    if(modal)return modal;
    modal=document.createElement('div');
    modal.className='vita-tool-overlay';
    modal.id='vitaInstallModal';
    modal.hidden=true;
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.setAttribute('aria-labelledby','vitaInstallTitle');
    modal.innerHTML=`<section class="vita-tool-dialog">
      <div class="vita-tool-head"><div><h2 id="vitaInstallTitle"></h2><p id="vitaInstallLead"></p></div>
      <button type="button" class="vita-tool-close" data-install-close aria-label="Kapat">Kapat</button></div>
      <ol class="vita-install-steps" id="vitaInstallSteps"></ol>
      <div class="vita-tool-note" id="vitaInstallNote" hidden></div>
    </section>`;
    document.body.appendChild(modal);
    modal.querySelector('[data-install-close]').addEventListener('click',closeModal);
    modal.addEventListener('click',e=>{if(e.target===modal)closeModal();});
    modal.addEventListener('keydown',e=>{
      if(e.key==='Escape'){e.preventDefault();closeModal();return;}
      if(e.key==='Tab'){e.preventDefault();modal.querySelector('[data-install-close]').focus();}
    });
    return modal;
  }
  function closeModal(){
    if(!modal)return;
    modal.hidden=true;
    document.body.style.overflow=previousOverflow;
    if(returnFocus&&typeof returnFocus.focus==='function')returnFocus.focus();
  }
  function openModal(title,lead,steps,trigger){
    const m=ensureModal();
    returnFocus=trigger||document.activeElement;
    previousOverflow=document.body.style.overflow;
    m.querySelector('#vitaInstallTitle').textContent=title;
    m.querySelector('#vitaInstallLead').textContent=lead;
    m.querySelector('#vitaInstallSteps').innerHTML=steps.map(s=>`<li>${s}</li>`).join('');
    const note=m.querySelector('#vitaInstallNote');
    if(!isSecureContextForInstall()){
      note.hidden=false;
      note.innerHTML='<strong>Not:</strong> Bu sayfa şu anda güvenli (HTTPS) bir adresten açılmıyor. Yükleme seçeneği ancak HTTPS bir adresten (veya localhost üzerinden) açıldığında görünür. Uygulamayı bir web sitesine (ör. GitHub Pages, Netlify, Vercel) yükleyip oradan açın.';
    } else { note.hidden=true; note.innerHTML=''; }
    document.body.style.overflow='hidden';
    m.hidden=false;
    m.querySelector('[data-install-close]').focus();
  }

  async function installAndroid(trigger){
    if(VITA_STORE_LINKS.android){window.open(VITA_STORE_LINKS.android,'_blank','noopener');return;}
    if(deferredPrompt){
      const p=deferredPrompt; deferredPrompt=null;
      try{ await p.prompt(); await p.userChoice; }catch(_){}
      return;
    }
    openModal('Android\'e yükle','Tarayıcı menüsünden uygulamayı ana ekranınıza ekleyebilirsiniz.',[
      'Uygulamayı <strong>Chrome</strong> ile açın.',
      'Sağ üstteki <strong>⋮</strong> menüsüne dokunun.',
      '<strong>“Uygulamayı yükle”</strong> veya <strong>“Ana ekrana ekle”</strong> seçeneğini seçin.',
      '<strong>Yükle</strong> düğmesine dokunun; VitaTakip simgesi ana ekranınıza eklenir.'
    ],trigger);
  }
  function installIOS(trigger){
    if(VITA_STORE_LINKS.ios){window.open(VITA_STORE_LINKS.ios,'_blank','noopener');return;}
    openModal('iPhone / iPad\'e ekle','iOS\'ta uygulama Safari üzerinden ana ekrana eklenir.',[
      'Uygulamayı <strong>Safari</strong> ile açın.',
      'Alttaki (iPad\'de üstteki) <strong>Paylaş</strong> simgesine (yukarı oklu kare) dokunun.',
      'Listeyi kaydırıp <strong>“Ana Ekrana Ekle”</strong> seçeneğine dokunun.',
      'Sağ üstteki <strong>Ekle</strong> düğmesine dokunun; VitaTakip simgesi ana ekranınıza eklenir.'
    ],trigger);
  }

  function init(){
    const section=document.getElementById('vitaInstallSection');
    if(!section)return;
    if(isStandalone()){section.hidden=true;return;}
    const a=section.querySelector('[data-install="android"]');
    const i=section.querySelector('[data-install="ios"]');
    if(a)a.addEventListener('click',e=>{e.preventDefault();if(window.SoundEffects&&SoundEffects.playClick)try{SoundEffects.playClick();}catch(_){} installAndroid(a);});
    if(i)i.addEventListener('click',e=>{e.preventDefault();if(window.SoundEffects&&SoundEffects.playClick)try{SoundEffects.playClick();}catch(_){} installIOS(i);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
