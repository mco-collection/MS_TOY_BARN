const KEY='ms_toy_barn_items_v2';
const demo=[
 {id:'d1',name:'Monkey D. Luffy #98',purchasePrice:2500,listingPrice:4980,shippingFee:750,source:'メルカリ',status:'出品中',createdAt:'2026-08-01'},
 {id:'d2',name:'Brook Wanted Poster',purchasePrice:4200,listingPrice:7980,shippingFee:750,source:'eBay',status:'未出品',createdAt:'2026-08-02'},
 {id:'d3',name:'Pikachu POP',purchasePrice:1800,listingPrice:3980,shippingFee:750,source:'Yahoo!フリマ',status:'発送待ち',createdAt:'2026-08-03'},
 {id:'d4',name:'White Rabbit Black Light',purchasePrice:3000,listingPrice:6480,shippingFee:750,source:'eBay',status:'売却済み',createdAt:'2026-08-04'},
 {id:'d5',name:'Monkey D. Luffy Gear Five',purchasePrice:2100,listingPrice:4980,shippingFee:750,source:'店舗',status:'出品中',createdAt:'2026-08-05'}
];
let items=loadItems();
let view='home';
let filter='すべて';
const app=document.querySelector('#app');
const dialog=document.querySelector('#itemDialog');
const yen=n=>'¥'+Math.round(Number(n||0)).toLocaleString('ja-JP');
function loadItems(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');return Array.isArray(v)?v:structuredClone(demo)}catch{return structuredClone(demo)}}
const save=()=>localStorage.setItem(KEY,JSON.stringify(items));
const count=s=>items.filter(x=>x.status===s).length;
const fee=x=>Math.round((x.listingPrice||0)*.1);
const profitOf=x=>Math.max(0,(x.listingPrice||0)-(x.purchasePrice||0)-fee(x)-(x.shippingFee||0));
const sold=()=>items.filter(x=>x.status==='売却済み');
const totalSales=()=>sold().reduce((a,x)=>a+(x.listingPrice||0),0);
const totalProfit=()=>sold().reduce((a,x)=>a+profitOf(x),0);
function toast(msg){const t=document.querySelector('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.id);toast.id=setTimeout(()=>t.classList.remove('show'),1700)}
function setView(v){if(v==='add'){openAdd();return}view=v;document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===v));render();window.scrollTo({top:0,behavior:'smooth'})}
function render(){({home,inventory,sales,settings}[view]||home)()}
function page(title,sub,body,action=''){app.innerHTML=`<section class="page"><header class="screen-head"><div><h1>${title}</h1><p>${sub}</p></div>${action}</header>${body}</section>`}
function statusClass(s){return s==='出品中'?'listed':s==='発送待ち'?'shipping':s==='売却済み'?'sold':'unlisted'}
function metric(cls,ico,label,value,unit,delta,art,go,money=false){return `<button class="metric ${cls}" data-go="${go}"><div class="metric-head"><span class="metric-icon">${ico}</span>${label}</div><strong class="${money?'money-big':''}">${value}<span class="unit">${unit}</span></strong><span class="delta">↗ ${delta}</span><span class="metric-art">${art}</span></button>`}
function home(){
 const inventoryCount=items.filter(x=>x.status!=='売却済み').length;
 const listed=count('出品中'), shipping=count('発送待ち'), profit=totalProfit();
 app.innerHTML=`<section class="page home-page">
  <header class="topbar"><div class="brand"><div class="brand-logo">m</div><div class="brand-title">M's TOY BARN<small>MERCARI MANAGER</small></div></div><div class="top-actions"><button class="icon-btn" data-go="settings">⚙</button><button class="icon-btn">♢<span class="notify-dot">${shipping}</span></button></div></header>
  <div class="greeting"><div class="sun">☀️</div><div><h1>今日もええ感じでいこか！</h1><p>仕入れ・在庫・売上をここでまとめて管理 ✨</p></div></div>
  <button class="notice" data-go="inventory"><span class="party">🎉</span><b>今日のチェック</b><span>${shipping?`発送待ちが ${shipping}件あるで。忘れず発送しよ！`:'発送待ちはゼロ。ええ感じ！'}</span><span class="chev">›</span></button>
  <div class="metric-grid">
   ${metric('pink','□','在庫数',inventoryCount,'点','在庫を確認','📦','inventory')}
   ${metric('yellow','◇','出品中',listed,'点','販売チャンス','🛍️','inventory')}
   ${metric('green','¥','今月の利益',yen(profit),'','売却済から集計','🐷','sales',true)}
   ${metric('blue','▰','発送待ち',shipping,'件',shipping?'要チェック':'完了','🚚','inventory')}
  </div>
  ${salesChart()}
  <section class="section-card quick-card"><div class="section-head"><div class="section-title"><span class="mini-ico">✓</span>クイックアクション</div></div><div class="quick-grid">
   <button class="quick" data-go="add"><span class="qico">＋</span>商品登録</button><button class="quick" data-go="inventory"><span class="qico">□</span>在庫確認</button><button class="quick" data-filter="発送待ち"><span class="qico">▰</span>発送リスト</button><button class="quick" data-go="sales"><span class="qico">↗</span>売上確認</button>
  </div></section>
 </section>`;
 bindActions();
}
function salesChart(){
 const base=Math.max(totalSales(),28940);
 const vals=[.34,.53,.78,.62,.88].map(v=>Math.round(base*v/5));
 const max=Math.max(...vals,1); const xs=[24,82,140,198,256]; const w=28; const h=105; const y0=130;
 const bars=vals.map((v,i)=>{const bh=Math.max(10,h*v/max);return `<rect x="${xs[i]}" y="${y0-bh}" width="${w}" height="${bh}" rx="6" fill="url(#barGrad)"/><text class="chart-value" x="${xs[i]+w/2}" y="${y0-bh-6}" text-anchor="middle" fill="#ff5364">${yen(v)}</text>`}).join('');
 const points=vals.map((v,i)=>`${xs[i]+w/2},${145-(v/max)*45}`).join(' ');
 return `<section class="section-card"><div class="section-head"><div class="section-title"><span class="mini-ico">↗</span>売上推移</div><div class="segmented"><button>日別</button><button class="active">週別</button><button>月別</button></div></div><div class="chart-wrap"><svg viewBox="0 0 310 165" role="img" aria-label="売上推移グラフ"><defs><linearGradient id="barGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ff7180"/><stop offset="1" stop-color="#ffb2ba"/></linearGradient></defs><line x1="18" x2="292" y1="130" y2="130" stroke="#e9e8ec"/>${bars}<polyline points="${points}" fill="none" stroke="#348ce8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>${xs.map((x,i)=>`<circle cx="${x+w/2}" cy="${145-(vals[i]/max)*45}" r="3.5" fill="#348ce8"/><text class="chart-label" x="${x+w/2}" y="158" text-anchor="middle">W${i+1}</text>`).join('')}</svg></div><div class="chart-footer"><div class="sum-pill"><small>今月の売上合計</small><strong>${yen(totalSales())}</strong></div><div class="sum-pill blue"><small>今月の利益合計</small><strong>${yen(totalProfit())}</strong></div></div></section>`
}
function inventory(){
 const filters=['すべて','未出品','出品中','発送待ち','売却済み']; const shown=filter==='すべて'?items:items.filter(x=>x.status===filter);
 page('商品管理','仕入れから発送までまとめて確認',`${`<div class="filter-row">${filters.map(f=>`<button class="chip ${filter===f?'active':''}" data-filter="${f}">${f} ${f==='すべて'?items.length:count(f)}</button>`).join('')}</div>`}<div class="list">${shown.length?shown.map(x=>`<div class="item"><span class="item-icon">📦</span><span><b>${escapeHtml(x.name)}</b><small>${escapeHtml(x.source||'その他')} ・ 仕入 ${yen(x.purchasePrice)}</small><span class="status ${statusClass(x.status)}">${x.status}</span></span><span class="money">${x.listingPrice?yen(x.listingPrice):'—'}<small>${x.status==='売却済み'?`利益 ${yen(profitOf(x))}`:''}</small></span></div>`).join(''):'<div class="empty">この状態の商品はまだないで</div>'}</div>`,`<button class="head-action" data-go="add">＋ 登録</button>`);bindActions();
}
function sales(){
 const soldItems=sold(); const expected=items.filter(x=>x.status==='出品中').reduce((a,x)=>a+profitOf(x),0);
 page('売上管理','利益まで自動計算',`<div class="kpi-row"><div class="kpi"><small>売上合計</small><strong>${yen(totalSales())}</strong></div><div class="kpi"><small>確定利益</small><strong>${yen(totalProfit())}</strong></div><div class="kpi"><small>出品中予想利益</small><strong>${yen(expected)}</strong></div><div class="kpi"><small>売却件数</small><strong>${soldItems.length}件</strong></div></div>${salesChart()}<div class="section-card sales-table"><div class="section-title">売却済み商品</div>${soldItems.length?soldItems.map(x=>`<div class="sale-line"><span><b>${escapeHtml(x.name)}</b><small>販売 ${yen(x.listingPrice)} − 原価 ${yen(x.purchasePrice)} − 手数料 ${yen(fee(x))} − 送料 ${yen(x.shippingFee)}</small></span><span class="profit">+${yen(profitOf(x))}</span></div>`).join(''):'<div class="empty">売却済み商品はまだないで</div>'}</div>`);bindActions();
}
function settings(){page('設定','M\'s TOY BARN 管理',`<div class="settings-card"><h2>利益計算ルール</h2><p>販売価格 − 仕入価格 − メルカリ販売手数料10% − 発送費 で利益を自動計算するで。</p></div><div class="settings-card"><h2>データ保存</h2><p>登録した商品データはこの端末のブラウザ内に保存される。ページを閉じても残るで。</p></div><div class="settings-card"><h2>デモデータ</h2><p>試しに触れるサンプルデータへ戻せる。</p><button class="danger" id="resetDemo">デモデータを初期状態に戻す</button></div>`);document.querySelector('#resetDemo').onclick=()=>{items=structuredClone(demo);save();toast('デモデータに戻したで');setView('home')}}
function openAdd(){dialog.showModal()}
function bindActions(){document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>setView(b.dataset.go));document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;setView('inventory')})}
function escapeHtml(s=''){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
document.querySelectorAll('.nav-item').forEach(b=>b.onclick=()=>setView(b.dataset.view));
document.querySelector('[data-close]').onclick=()=>dialog.close();
document.querySelector('#itemForm').onsubmit=e=>{e.preventDefault();items.unshift({id:crypto.randomUUID?crypto.randomUUID():Date.now().toString(),name:document.querySelector('#name').value,purchasePrice:+document.querySelector('#purchasePrice').value||0,listingPrice:+document.querySelector('#listingPrice').value||0,shippingFee:+document.querySelector('#shippingFee').value||0,source:document.querySelector('#source').value,status:document.querySelector('#status').value,memo:document.querySelector('#memo').value,createdAt:new Date().toISOString().slice(0,10)});save();e.target.reset();document.querySelector('#shippingFee').value=750;dialog.close();toast('商品を登録したで 📦');setView('home')};
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
home();
