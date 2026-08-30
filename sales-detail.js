(function(){
  const YEAR=2026;
  const STORAGE_KEY='mstb_products_v3';
  const yen=n=>'¥'+Number(n||0).toLocaleString('ja-JP');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const style=document.createElement('style');
  style.textContent=`
  .sales-chart{cursor:pointer}
  .sales-month-detail{position:fixed;inset:0;z-index:90;background:rgba(20,22,28,.42);display:grid;align-items:end;padding:0}
  .sales-month-detail[hidden]{display:none}
  .sales-month-sheet{width:100%;max-height:min(82dvh,720px);background:#fff;border-radius:24px 24px 0 0;box-shadow:0 -18px 50px rgba(20,25,35,.16);overflow:hidden;display:grid;grid-template-rows:auto auto 1fr;animation:salesSheetIn .18s ease-out}
  @keyframes salesSheetIn{from{transform:translateY(16px);opacity:.4}to{transform:none;opacity:1}}
  .sales-detail-head{display:flex;align-items:center;justify-content:space-between;padding:16px 18px 10px;border-bottom:1px solid #f0eef1}
  .sales-detail-head b{font-size:17px;letter-spacing:-.03em}.sales-detail-close{width:34px;height:34px;border:0;border-radius:50%;background:#f6f4f5;font-size:20px;line-height:1}
  .sales-detail-summary{display:grid;grid-template-columns:repeat(3,1fr);margin:12px 14px;background:#faf9fa;border:1px solid #efedef;border-radius:16px;overflow:hidden}
  .sales-detail-summary>div{padding:12px 8px;text-align:center;border-right:1px solid #ece9ec}.sales-detail-summary>div:last-child{border-right:0}.sales-detail-summary small{display:block;font-size:8px;color:#8c8992;font-weight:800}.sales-detail-summary strong{display:block;margin-top:5px;font-size:14px;white-space:nowrap}.sales-detail-summary .sales-v{color:#ff4056}.sales-detail-summary .profit-v{color:#348ce8}.sales-detail-summary .count-v{color:#d98a00}
  .sales-detail-body{min-height:0;overflow:auto;-webkit-overflow-scrolling:touch;padding:0 14px 18px}.sales-detail-body h3{font-size:12px;margin:2px 2px 8px}.sales-detail-row{display:grid;grid-template-columns:1fr auto;gap:8px;padding:11px 4px;border-bottom:1px solid #f0eef1;align-items:center}.sales-detail-row b{display:block;font-size:11px}.sales-detail-row small{display:block;margin-top:4px;font-size:8px;color:#8c8992}.sales-detail-row strong{font-size:12px;white-space:nowrap}.sales-detail-row em{font-style:normal;color:#23844a;font-weight:900}.sales-detail-row em.pending{color:#aaa}.sales-detail-empty{padding:28px 8px;text-align:center;color:#999;font-size:11px}
  @media(min-width:700px){.sales-month-detail{align-items:center;justify-items:center;padding:24px}.sales-month-sheet{max-width:520px;border-radius:24px;max-height:80vh}}
  `;
  document.head.appendChild(style);

  const modal=document.createElement('div');
  modal.className='sales-month-detail';
  modal.hidden=true;
  modal.innerHTML='<section class="sales-month-sheet" role="dialog" aria-modal="true"><div class="sales-detail-head"><b id="salesDetailTitle">月の詳細</b><button class="sales-detail-close" type="button" aria-label="閉じる">×</button></div><div class="sales-detail-summary" id="salesDetailSummary"></div><div class="sales-detail-body" id="salesDetailBody"></div></section>';
  document.body.appendChild(modal);

  function sourceProducts(){
    if(typeof products!=='undefined'&&Array.isArray(products))return products;
    try{const x=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');return Array.isArray(x)?x:[];}catch(e){return []}
  }
  function profitOf(p){
    if(p.status!=='sold'||p.purchasePrice==null||p.shipping==null)return null;
    return Math.round(Number(p.price||0)*(1-Number(p.feeRate??.1))-Number(p.shipping||0)-Number(p.purchasePrice||0));
  }
  function openMonth(month){
    const list=sourceProducts().filter(p=>p.status==='sold'&&Number(p.soldYear)===YEAR&&Number(p.soldMonth)===month);
    const sales=list.reduce((s,p)=>s+Number(p.price||0),0);
    const ps=list.map(profitOf).filter(v=>v!=null);
    const profit=ps.reduce((a,b)=>a+b,0);
    const known=ps.length;
    document.getElementById('salesDetailTitle').textContent=`${YEAR}年${month}月の詳細`;
    document.getElementById('salesDetailSummary').innerHTML=`<div><small>売上</small><strong class="sales-v">${yen(sales)}</strong></div><div><small>確定利益</small><strong class="profit-v">${known?yen(profit):'—'}</strong></div><div><small>販売件数</small><strong class="count-v">${list.length}件</strong></div>`;
    const rows=list.slice().sort((a,b)=>Number(b.price||0)-Number(a.price||0)).map(p=>{const pr=profitOf(p);return `<article class="sales-detail-row" data-product-id="${esc(p.id)}"><div><b>${esc(p.name||'商品名未設定')}${p.pop?` #${esc(p.pop)}`:''}</b><small>${esc(p.series||'')}${pr==null?' ・ 利益未確定':` ・ 利益 ${yen(pr)}`}</small></div><strong>${yen(p.price)}</strong></article>`}).join('');
    document.getElementById('salesDetailBody').innerHTML=`<h3>売れた商品一覧（${list.length}件）${known<list.length?` ・ 利益確定 ${known}/${list.length}件`:''}</h3>${rows||'<div class="sales-detail-empty">この月の販売データはまだありません</div>'}`;
    modal.hidden=false;
    document.body.style.overflow='hidden';
  }
  function close(){modal.hidden=true;document.body.style.overflow='';}
  modal.querySelector('.sales-detail-close').addEventListener('click',close);
  modal.addEventListener('click',e=>{if(e.target===modal)close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)close();});
  modal.addEventListener('click',e=>{const row=e.target.closest('.sales-detail-row');if(!row)return;const id=row.dataset.productId;if(id&&typeof openEdit==='function'){close();openEdit(id);}});

  function bindChart(){
    const chart=document.getElementById('salesChart');
    if(!chart||chart.dataset.monthDetailBound)return;
    chart.dataset.monthDetailBound='1';
    chart.setAttribute('title','月をタップして詳細表示');
    chart.addEventListener('click',e=>{
      const svg=chart.querySelector('svg');
      if(!svg)return;
      const r=svg.getBoundingClientRect();
      if(!r.width)return;
      const vb=svg.viewBox&&svg.viewBox.baseVal?svg.viewBox.baseVal:null;
      const W=vb&&vb.width?vb.width:600;
      const x=(e.clientX-r.left)/r.width*W;
      const left=28, step=(600-left-8)/12;
      let month=Math.floor((x-left)/step)+1;
      month=Math.max(1,Math.min(12,month));
      openMonth(month);
    });
  }
  const observer=new MutationObserver(bindChart);
  const sales=document.getElementById('salesChart');
  if(sales)observer.observe(sales,{childList:true,subtree:true});
  bindChart();
})();
