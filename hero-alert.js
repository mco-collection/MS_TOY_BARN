(function(){
  const hero=document.querySelector('.hero');
  if(!hero)return;
  const original=hero.innerHTML;
  let last='';

  const STORAGE_KEY='mstb_products_v3';
  const SYNC_FIELDS=['status','price','purchasePrice','shipping','feeRate','series','pop','mercariId','memo','soldYear','soldMonth','mercariSyncedAt'];

  async function fetchJson(url){
    const res=await fetch(`${url}?sync=${Date.now()}`,{cache:'no-store'});
    if(!res.ok)return null;
    return res.json();
  }

  async function syncFromGitHub(){
    try{
      const [base,state]=await Promise.all([
        fetchJson('./products.json'),
        fetchJson('./mercari-state.json')
      ]);
      const remote=Array.isArray(base)?base:[];
      const overrides=state&&Array.isArray(state.items)?state.items:[];
      if(!remote.length&&!overrides.length)return;

      let local=[];
      try{local=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');}catch(e){local=[];}
      if(!Array.isArray(local))local=[];

      const byId=new Map(local.map(p=>[p.id,p]));
      let changed=false;

      // Base inventory first, then Mercari state as the authoritative override.
      for(const r of [...remote,...overrides]){
        const l=byId.get(r.id);
        if(!l){
          local.push({...r});
          byId.set(r.id,local[local.length-1]);
          changed=true;
          continue;
        }
        for(const k of SYNC_FIELDS){
          if(Object.prototype.hasOwnProperty.call(r,k)&&JSON.stringify(l[k])!==JSON.stringify(r[k])){
            l[k]=r[k];
            changed=true;
          }
        }
      }

      if(changed){
        localStorage.setItem(STORAGE_KEY,JSON.stringify(local));
        if(!sessionStorage.getItem('mstb_github_sync_reload')){
          sessionStorage.setItem('mstb_github_sync_reload','1');
          location.reload();
          return;
        }
      }
      sessionStorage.removeItem('mstb_github_sync_reload');
    }catch(e){/* keep app usable offline */}
  }

  const style=document.createElement('style');
  style.textContent=`
    .hero.hero-alert{align-items:center;gap:12px;cursor:default}
    .hero.hero-alert .hero-alert-copy{min-width:0;flex:1}
    .hero.hero-alert .hero-alert-copy small{display:block;margin-bottom:4px;font-weight:800;letter-spacing:.06em}
    .hero.hero-alert .hero-alert-copy h1{margin:0 0 5px;font-size:clamp(20px,5.2vw,29px);line-height:1.16}
    .hero.hero-alert .hero-alert-copy p{margin:0;font-size:13px;font-weight:700;opacity:.76}
    .hero.hero-alert .hero-alert-btn{border:0;border-radius:999px;padding:11px 15px;background:#fff;color:#d94a61;font-weight:900;box-shadow:0 5px 14px rgba(130,48,64,.14);white-space:nowrap}
  `;
  document.head.appendChild(style);

  function incomplete(){
    if(typeof products==='undefined'||!Array.isArray(products))return [];
    return products.filter(p=>p.status==='sold'&&(p.shipping==null||p.purchasePrice==null));
  }

  function openNext(){
    const list=incomplete();
    if(!list.length)return;
    const p=list.find(x=>x.shipping==null)||list[0];
    if(typeof openEdit==='function'){
      openEdit(p.id);
      setTimeout(()=>{
        const target=p.shipping==null?document.getElementById('editShipping'):document.getElementById('editPurchase');
        if(target){target.focus();target.scrollIntoView({block:'center',behavior:'smooth'});}
      },120);
    }
  }

  function render(){
    const list=incomplete();
    const ship=list.filter(p=>p.shipping==null).length;
    const purchase=list.filter(p=>p.purchasePrice==null).length;
    const sig=`${ship}:${purchase}`;
    if(sig===last)return;
    last=sig;

    if(!list.length){
      hero.classList.remove('hero-alert');
      hero.innerHTML=original;
      return;
    }

    const details=[ship?`送料 ${ship}件`:null,purchase?`仕入れ値 ${purchase}件`:null].filter(Boolean).join(' ・ ');
    hero.classList.add('hero-alert');
    hero.innerHTML=`<div class="hero-alert-copy"><small>⚠️ CHECK</small><h1>未入力リスト</h1><p>${details}</p></div><button type="button" class="hero-alert-btn">今すぐ入力</button>`;
    hero.querySelector('.hero-alert-btn').addEventListener('click',e=>{e.stopPropagation();openNext();});
  }

  syncFromGitHub();
  setInterval(syncFromGitHub,60000);
  setInterval(render,400);
  render();
})();
