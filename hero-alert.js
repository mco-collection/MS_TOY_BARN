(function(){
  const hero=document.querySelector('.hero');
  if(!hero)return;
  const original=hero.innerHTML;
  let last='';

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

  setInterval(render,400);
  render();
})();
