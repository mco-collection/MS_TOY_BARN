const KEY='ms_toy_barn_items_v1';
const demo=[
 {id:'d1',name:'Monkey D. Luffy POP',purchasePrice:2500,listingPrice:4980,source:'メルカリ',status:'出品中'},
 {id:'d2',name:'Retro Robot Toy',purchasePrice:1200,listingPrice:2980,source:'店舗',status:'未出品'},
 {id:'d3',name:'Dinosaur Figure',purchasePrice:1800,listingPrice:3600,source:'Yahoo!フリマ',status:'発送待ち'},
 {id:'d4',name:'Teddy Bear Collectible',purchasePrice:900,listingPrice:2400,source:'eBay',status:'出品中'}
];
let items=JSON.parse(localStorage.getItem(KEY)||'null')||demo;
let view='home';
const app=document.querySelector('#app');
const dialog=document.querySelector('#itemDialog');
const yen=n=>'¥'+Number(n||0).toLocaleString('ja-JP');
const save=()=>localStorage.setItem(KEY,JSON.stringify(items));
const count=s=>items.filter(x=>x.status===s).length;
function toast(msg){const t=document.querySelector('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.id);toast.id=setTimeout(()=>t.classList.remove('show'),1800)}
function setView(v){view=v;document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===v));render()}
function render(){if(view==='home')home();if(view==='inventory')inventory();if(view==='add')openAdd();if(view==='sales')sales();if(view==='settings')settings()}
function page(title,body,action=''){app.innerHTML=`<section class="page"><header class="screen-head"><h1>${title}</h1>${action}</header>${body}</section>`}
function home(){
 const inventory=items.filter(x=>x.status!=='売却済み').length, listed=count('出品中'), shipping=count('発送待ち');
 const profit=items.filter(x=>x.status==='売却済み').reduce((a,x)=>a+(x.listingPrice-x.purchasePrice),0);
 app.innerHTML=`<section class="page"><div class="hero"><button class="gear" data-go="settings">⚙️</button></div>
 <div class="welcome"><div class="mascot">🧸</div><div class="speech">今日もおつかれさま！<br>ええ仕入れできたかな？ 😊</div></div>
 <button class="mini-chart" data-go="sales"><div class="chart-head"><span>今月の売上推移</span><span>+${yen(Math.max(profit,32800))}</span></div><svg class="chart-svg" viewBox="0 0 360 90" aria-label="売上推移"><path d="M10 76 L55 65 L100 54 L145 39 L190 56 L235 65 L280 43 L350 18" fill="none" stroke="#3c7d3e" stroke-width="4"/><path d="M10 76 L55 65 L100 54 L145 39 L190 56 L235 65 L280 43 L350 18 L350 87 L10 87Z" fill="rgba(60,125,62,.12)"/></svg></button>
 <div class="metric-grid">
 ${metric('blue','📦','在庫数',inventory+'点','inventory')}${metric('green','🛒','出品中',listed+'点','inventory')}
 ${metric('orange','💰','今月の利益',yen(profit||32800),'sales')}${metric('purple','🚚','発送待ち',shipping+'件','inventory')}
 </div>
 <h2 class="wood-title">📋 今日やること</h2><div class="tasks">
 ${task('🚚','発送する',shipping+'件','購入者を待たせちゃダメ！','inventory')}${task('📷','出品する',items.filter(x=>x.status==='未出品').length+'件','早く出品して回転させよう！','inventory')}${task('📦','仕入れを登録する','','新しい商品を追加しよう！','add')}
 </div></section>`;
 bindGo();
}
function metric(c,i,l,v,g){return `<button class="metric ${c}" data-go="${g}"><span class="ico">${i}</span><span><small>${l}</small><strong>${v}</strong></span><span class="arrow">›</span></button>`}
function task(i,t,n,s,g){return `<button class="task" data-go="${g}"><span class="round">${i}</span><span><b>${t}${n?'（'+n+'）':''}</b><small>${s}</small></span>${n?`<span class="badge">${parseInt(n)||0}</span>`:'<span></span>'}<span>›</span></button>`}
function inventory(){page('🗄️ 棚・在庫',`<div class="panel">${items.length?items.map(x=>`<div class="item"><span class="item-icon">📦</span><span><b>${x.name}</b><small>${x.source}・${x.status}</small></span><span class="money">${yen(x.purchasePrice)}</span></div>`).join(''):'<div class="empty">まだ在庫がないで</div>'}</div><button class="primary" id="addStock">＋ 新しい仕入れを登録</button>`);document.querySelector('#addStock').onclick=openAdd}
function sales(){const expected=items.reduce((a,x)=>a+Math.max(0,x.listingPrice-x.purchasePrice),0);page('🧾 レシート・売上',`<div class="panel"><h2>予想利益</h2><div style="font-size:34px;font-weight:900">${yen(expected)}</div><p>登録済み商品の出品価格 − 仕入価格</p></div><div class="panel"><b>今月の売上推移</b><svg class="chart-svg" viewBox="0 0 360 90"><path d="M10 76 L55 65 L100 54 L145 39 L190 56 L235 65 L280 43 L350 18" fill="none" stroke="#3c7d3e" stroke-width="4"/></svg></div>`)}
function settings(){page('🏚️ 倉庫・その他',`<div class="panel"><h2>M's TOY BARN</h2><p>EST. 2024<br>第一段階・触れるHOME試作版</p></div><div class="panel"><button class="primary" id="resetDemo">デモデータを初期状態に戻す</button></div>`);document.querySelector('#resetDemo').onclick=()=>{items=structuredClone(demo);save();toast('デモデータを戻したで');home()}}
function openAdd(){dialog.showModal();view='home';document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view==='home'))}
function bindGo(){document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>setView(b.dataset.go))}
document.querySelectorAll('.nav-item').forEach(b=>b.onclick=()=>setView(b.dataset.view));
document.querySelector('[data-close]').onclick=()=>dialog.close();
document.querySelector('#itemForm').onsubmit=e=>{e.preventDefault();items.unshift({id:crypto.randomUUID(),name:name.value,purchasePrice:+purchasePrice.value||0,listingPrice:+listingPrice.value||0,source:source.value,status:status.value,memo:memo.value});save();e.target.reset();dialog.close();toast('仕入れを登録したで 📦');home()};
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
home();
