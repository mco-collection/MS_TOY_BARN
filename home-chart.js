(function(){
  const YEAR=2026;
  const STORAGE_KEY='mstb_products_v3';
  const yen=n=>'¥'+Number(n||0).toLocaleString('ja-JP');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let lastSig='';

  const style=document.createElement('style');
  style.textContent=`
    #homeCard{overflow:hidden}
    #homeCard .chart-wrap{cursor:pointer;padding:2px 0 0}
    #homeCard .home-grid line{stroke:#f1eef1;stroke-width:1;stroke-dasharray:3 5}
    #homeCard .home-grid,#homeCard .home-profit-area,#homeCard .home-profit-line{pointer-events:none}
    #homeCard .home-track{fill:#f7f4f6}
    #homeCard .home-bar{fill:url(#homeSalesGrad)}
    #homeCard .home-profit-area{fill:url(#homeProfitArea)}
    #homeCard .home-profit-line{fill:none;stroke:#348ce8;stroke-width:2.7;stroke-linecap:round;stroke-linejoin:round}
    #homeCard .home-profit-point{fill:#fff;stroke:#348ce8;stroke-width:2.3}
    #homeCard .home-month text{font-size:8px;fill:#8c8992;text-anchor:middle;font-weight:800}
    #homeCard .home-month.current text{fill:#ff596a;font-weight:950}
    #homeCard .home-month .home-hit{fill:transparent}
    #homeCard .home-month.current .home-track{fill:#fff0f3}
    #homeCard .home-value{font-size:7px;fill:#ff596a;text-anchor:middle;font-weight:900}
    #homeCard .chart-head small{font-weight:800}
    #homeCard .home-tap-hint{font-size:7px;color:#aaa;margin-left:6px}
    #homeCard .totals>div{transition:transform .15s ease}
    #homeCard .totals>div:active{transform:scale(.98)}
  `;
  document.head.appendChild(style);

  function sourceProducts(){
    if(typeof products!=='undefined'&&Array.isArray(products))return products;
    try{const x=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');return Array.isArray(x)?x:[];}catch(e){return []}
  }
  function profitOf(p){
    if(p.status!=='sold'||p.purchasePrice==null||p.shipping==null)return null;
    return Math.round(Number(p.price||0)*(1-Number(p.feeRate??.1))-Number(p.shipping||0)-Number(p.purchasePrice||0));
  }
  function monthData(month){
    const xs=sourceProducts().filter(p=>p.status==='sold'&&Number(p.soldYear)===YEAR&&Number(p.soldMonth)===month);
    const ps=xs.map(profitOf).filter(v=>v!=null);
    return {month,count:xs.length,sales:xs.reduce((s,p)=>s+Number(p.price||0),0),profit:ps.reduce((a,b)=>a+b,0),known:ps.length};
  }
  function visibleMonths(){
    const now=new Date();
    let end=now.getFullYear()===YEAR?now.getMonth()+1:12;
    end=Math.max(5,Math.min(12,end));
    return Array.from({length:5},(_,i)=>end-4+i);
  }
  function openMonth(month){
    const modal=document.querySelector('.sales-month-detail');
    const title=document.getElementById('salesDetailTitle');
    const summary=document.getElementById('salesDetailSummary');
    const body=document.getElementById('salesDetailBody');
    if(!modal||!title||!summary||!body)return;
    const list=sourceProducts().filter(p=>p.status==='sold'&&Number(p.soldYear)===YEAR&&Number(p.soldMonth)===month);
    const ps=list.map(profitOf).filter(v=>v!=null),profit=ps.reduce((a,b)=>a+b,0),known=ps.length;
    const sales=list.reduce((s,p)=>s+Number(p.price||0),0);
    title.textContent=`${YEAR}年${month}月の詳細`;
    summary.innerHTML=`<div><small>売上</small><strong class="sales-v">${yen(sales)}</strong></div><div><small>確定利益</small><strong class="profit-v">${known?yen(profit):'—'}</strong></div><div><small>販売件数</small><strong class="count-v">${list.length}件</strong></div>`;
    const rows=list.slice().sort((a,b)=>Number(b.price||0)-Number(a.price||0)).map(p=>{const pr=profitOf(p);return `<article class="sales-detail-row" data-product-id="${esc(p.id)}"><div><b>${esc(p.name||'商品名未設定')}${p.pop?` #${esc(p.pop)}`:''}</b><small>${esc(p.series||'')}${pr==null?' ・ 利益未確定':` ・ 利益 ${yen(pr)}`}</small></div><strong>${yen(p.price)}</strong></article>`}).join('');
    body.innerHTML=`<h3>売れた商品一覧（${list.length}件）${known<list.length?` ・ 利益確定 ${known}/${list.length}件`:''}</h3>${rows||'<div class="sales-detail-empty">この月の販売データはまだありません</div>'}`;
    modal.hidden=false;
    document.body.style.overflow='hidden';
  }
  function render(){
    const card=document.getElementById('homeCard');
    if(!card)return;
    const months=visibleMonths(),md=months.map(monthData);
    const sig=JSON.stringify(md.map(x=>[x.month,x.sales,x.profit,x.count,x.known]));
    if(sig===lastSig)return;
    lastSig=sig;

    const headSmall=card.querySelector('.chart-head small');
    if(headSmall)headSmall.textContent=`${months[0]}月〜${months[4]}月`;
    const legend=card.querySelector('.legend');
    if(legend)legend.innerHTML='<span class="sale-dot"></span>売上 <span class="profit-dot"></span>利益 <span class="home-tap-hint">月をタップ</span>';

    const W=340,H=120,left=18,right=8,top=12,bottom=22,baseY=H-bottom,plotH=baseY-top,step=(W-left-right)/5,barW=22;
    const max=Math.max(...md.flatMap(d=>[d.sales,d.profit]),1);
    let groups='',linePts=[];
    const currentMonth=new Date().getFullYear()===YEAR?new Date().getMonth()+1:-1;
    md.forEach((d,i)=>{
      const x=left+i*step+step/2,bh=d.sales/max*plotH,py=baseY-d.profit/max*plotH;
      const cls=d.month===currentMonth?'home-month current':'home-month';
      groups+=`<g class="${cls}" data-month="${d.month}"><rect class="home-hit" x="${left+i*step}" y="0" width="${step}" height="${H}"/><rect class="home-track" x="${x-barW/2}" y="${top}" width="${barW}" height="${plotH}" rx="11"/><rect class="home-bar" x="${x-barW/2}" y="${baseY-bh}" width="${barW}" height="${bh}" rx="11"/>${d.sales?`<text class="home-value" x="${x}" y="${Math.max(9,baseY-bh-4)}">${Math.round(d.sales/1000)}k</text>`:''}<text x="${x}" y="${H-7}">${d.month}月</text></g>`;
      linePts.push(`${x},${py}`);
    });
    const firstX=left+step/2,lastX=left+4*step+step/2;
    const points=md.map((d,i)=>{const x=left+i*step+step/2,py=baseY-d.profit/max*plotH;return `<circle class="home-profit-point" cx="${x}" cy="${py}" r="3.2" data-month="${d.month}"/>`}).join('');
    const svg=`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="直近5か月の売上と利益"><defs><linearGradient id="homeSalesGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5b70"/><stop offset="1" stop-color="#ffb4bf"/></linearGradient><linearGradient id="homeProfitArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4c9ff5" stop-opacity=".20"/><stop offset="1" stop-color="#4c9ff5" stop-opacity="0"/></linearGradient></defs><g class="home-grid"><line x1="${left}" y1="${top+plotH*.33}" x2="${W-right}" y2="${top+plotH*.33}"/><line x1="${left}" y1="${top+plotH*.66}" x2="${W-right}" y2="${top+plotH*.66}"/></g>${groups}<path class="home-profit-area" d="M ${firstX} ${baseY} L ${linePts.join(' L ')} L ${lastX} ${baseY} Z"/><polyline class="home-profit-line" points="${linePts.join(' ')}"/><g>${points}</g></svg>`;
    const wrap=card.querySelector('.chart-wrap');
    if(wrap)wrap.innerHTML=svg;
    const totalSales=md.reduce((s,d)=>s+d.sales,0),totalProfit=md.reduce((s,d)=>s+d.profit,0);
    const totals=card.querySelector('.totals');
    if(totals)totals.innerHTML=`<div><small>5か月売上</small><b>${yen(totalSales)}</b></div><div><small>確定利益</small><b>${yen(totalProfit)}</b></div>`;
  }

  const card=document.getElementById('homeCard');
  if(card){
    card.addEventListener('click',e=>{const hit=e.target.closest('[data-month]');if(hit)openMonth(Number(hit.dataset.month));});
    render();
    setInterval(render,800);
  }
})();
