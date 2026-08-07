const navButtons=document.querySelectorAll('.bottom-nav button');
const homeCard=document.getElementById('homeCard'), productPanel=document.getElementById('productPanel'), salesPanel=document.getElementById('salesPanel');
const metrics=document.querySelector('.metrics'), hero=document.querySelector('.hero');
let products=[], currentTab='listing', editingId=null, salesMonth=0;
const DATA_VERSION=300;
const yen=n=>'¥'+Number(n||0).toLocaleString('ja-JP');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function calcProfit(p){if(p.status!=='sold'||p.purchasePrice==null||p.shipping==null)return null;return Math.round(p.price*(1-(p.feeRate??.1))-p.shipping-p.purchasePrice)}
async function loadProducts(){
 try{
  const res=await fetch('./products.json?v=300',{cache:'no-store'}), base=await res.json();
  const saved=JSON.parse(localStorage.getItem('mstb_products_v2')||'null'), ver=Number(localStorage.getItem('mstb_data_version')||0);
  if(saved&&ver===DATA_VERSION){products=saved}
  else if(saved){
   const byId=new Map(saved.map(x=>[x.id,x]));
   products=base.map(b=>{
    const old=byId.get(b.id); if(!old)return b;
    if(/^s\d+$/.test(b.id)) return {...old,...b,memo:old.memo??b.memo};
    return {...b,...old};
   });
   const ids=new Set(products.map(x=>x.id)); saved.forEach(x=>{if(!ids.has(x.id))products.push(x)});
   persist();
  }else{products=base;persist()}
  renderAll();
 }catch(e){console.warn(e)}
}
function persist(){localStorage.setItem('mstb_products_v2',JSON.stringify(products));localStorage.setItem('mstb_data_version',String(DATA_VERSION))}
function save(){persist();renderAll()}
function renderAll(){
 const listed=products.filter(p=>p.status==='listing'), sold=products.filter(p=>p.status==='sold');
 inventory.innerHTML=`${listed.length}<em>件</em>`;document.getElementById('listed').innerHTML=`${listed.length}<em>件</em>`;
 document.getElementById('shipping').innerHTML=`0<em>件</em>`;
 const now=new Date(), month=now.getMonth()+1, year=now.getFullYear(); const ms=sold.filter(p=>p.soldYear===year&&p.soldMonth===month);
 const profits=ms.map(calcProfit).filter(v=>v!=null);document.getElementById('profit').textContent=profits.length?yen(profits.reduce((a,b)=>a+b,0)):'—';
 renderProducts();renderSales();
}
function renderProducts(){
 const list=products.filter(p=>p.status===currentTab); document.getElementById('productSummary').textContent=`${list.length}件`;
 document.querySelector('.product-head b').textContent=currentTab==='listing'?'📦 出品中の商品':'✅ 販売済み';
 document.getElementById('listingValue').textContent=yen(list.reduce((s,p)=>s+Number(p.price||0),0));
 const tabs=`<div class="tabs"><button class="tab-btn ${currentTab==='listing'?'active':''}" data-tab="listing">出品中</button><button class="tab-btn ${currentTab==='sold'?'active':''}" data-tab="sold">販売済み</button></div>`;
 productList.innerHTML=tabs+list.map(p=>{const pr=calcProfit(p);return `<article class="product-row" data-id="${p.id}"><div><b>${esc(p.name)}${p.status==='sold'?'<span class="status-badge sold-badge">販売済</span>':''}</b><small>${esc(p.series||'')}${p.pop?` ・ #${esc(p.pop)}`:''}</small>${p.status==='sold'?`<div class="sold-info">${p.soldYear||''}年${p.soldMonth||'—'}月${pr==null?' ・ 利益未確定':' ・ 利益 '+yen(pr)}</div>`:''}</div><strong>${yen(p.price)}</strong></article>`}).join('');
 document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{currentTab=b.dataset.tab;renderProducts()});document.querySelectorAll('.product-row[data-id]').forEach(r=>r.onclick=()=>openEdit(r.dataset.id));
}
function monthlyData(){return Array.from({length:12},(_,i)=>{const month=i+1,xs=products.filter(p=>p.status==='sold'&&p.soldYear===2026&&p.soldMonth===month),profits=xs.map(calcProfit).filter(v=>v!=null);return {month,count:xs.length,sales:xs.reduce((s,p)=>s+Number(p.price||0),0),profit:profits.reduce((a,b)=>a+b,0),known:profits.length}})}
function renderSales(){
 const sold=products.filter(p=>p.status==='sold'&&p.soldYear===2026), profits=sold.map(calcProfit).filter(v=>v!=null), md=monthlyData();
 yearSales.textContent=yen(sold.reduce((s,p)=>s+Number(p.price||0),0));yearProfit.textContent=yen(profits.reduce((a,b)=>a+b,0));yearSoldCount.textContent=`${sold.length}件`;yearProfitKnown.textContent=`${profits.length}/${sold.length}件`;
 const max=Math.max(...md.map(x=>x.sales),1), W=600,H=180,left=28,bottom=28,plotH=125,step=(W-left-8)/12,barW=Math.max(12,step*.5);
 let bars='',linePts=[];
 md.forEach((d,i)=>{const x=left+i*step+step/2, bh=d.sales/max*plotH, py=H-bottom-(d.profit/max*plotH);bars+=`<rect x="${x-barW/2}" y="${H-bottom-bh}" width="${barW}" height="${bh}" rx="5"/><text x="${x}" y="${H-9}">${i+1}月</text>`;linePts.push(`${x},${py}`)});
 salesChart.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="2026年月別売上と利益"><g class="sales-grid"><line x1="${left}" y1="${H-bottom-plotH}" x2="${W}" y2="${H-bottom-plotH}"/><line x1="${left}" y1="${H-bottom-plotH/2}" x2="${W}" y2="${H-bottom-plotH/2}"/><line x1="${left}" y1="${H-bottom}" x2="${W}" y2="${H-bottom}"/></g><g class="sales-bars">${bars}</g><polyline class="sales-profit-line" points="${linePts.join(' ')}"/></svg>`;
 monthFilter.innerHTML=`<button class="${salesMonth===0?'active':''}" data-month="0">全部</button>`+md.filter(d=>d.count).map(d=>`<button class="${salesMonth===d.month?'active':''}" data-month="${d.month}">${d.month}月 <b>${d.count}</b></button>`).join('');
 document.querySelectorAll('[data-month]').forEach(b=>b.onclick=()=>{salesMonth=Number(b.dataset.month);renderSales()});
 const list=sold.filter(p=>!salesMonth||p.soldMonth===salesMonth).sort((a,b)=>(b.soldMonth||0)-(a.soldMonth||0));
 salesList.innerHTML=list.map(p=>{const pr=calcProfit(p);return `<article class="sale-row" data-id="${p.id}"><div><span>${p.soldMonth}月</span><b>${esc(p.name)}</b><small>売上 ${yen(p.price)}${p.purchasePrice==null?' ・ 仕入 未入力':' ・ 仕入 '+yen(p.purchasePrice)}${p.shipping==null?' ・ 送料 未入力':' ・ 送料 '+yen(p.shipping)}</small></div><strong class="${pr==null?'pending':''}">${pr==null?'利益未確定':yen(pr)}</strong></article>`}).join('')||'<p class="empty">販売データはまだありません</p>';
 document.querySelectorAll('.sale-row[data-id]').forEach(r=>r.onclick=()=>openEdit(r.dataset.id));
}
function showView(view){
 navButtons.forEach(b=>b.classList.toggle('active',b.dataset.view===view));
 const isProducts=view==='products', isSales=view==='sales', isHome=view==='home';
 homeCard.hidden=!isHome;metrics.hidden=!isHome;hero.hidden=!isHome;productPanel.hidden=!isProducts;salesPanel.hidden=!isSales;
 document.querySelector('.dashboard').classList.toggle('products-view',isProducts);document.querySelector('.dashboard').classList.toggle('sales-view',isSales);
 if(isSales)renderSales();
}
function openEdit(id){editingId=id;const p=products.find(x=>x.id===id); editTitle.value=p.name||'';editPop.value=p.pop||'';editSeries.value=p.series||'';editPrice.value=p.price||'';editPurchase.value=p.purchasePrice??'';editMemo.value=p.memo||'';soldAction.hidden=p.status==='sold';soldFields.hidden=p.status!=='sold';editSoldMonth.value=p.soldMonth||'';editShipping.value=p.shipping??'';editModal.hidden=false}
function closeModal(){editModal.hidden=true;soldModal.hidden=true}
function applyBasic(){const p=products.find(x=>x.id===editingId);p.name=editTitle.value.trim();p.pop=editPop.value.trim();p.series=editSeries.value.trim();p.price=Number(editPrice.value)||0;p.purchasePrice=editPurchase.value===''?null:Number(editPurchase.value);p.memo=editMemo.value; if(p.status==='sold'){p.soldMonth=Number(editSoldMonth.value)||null;p.shipping=editShipping.value===''?null:Number(editShipping.value)}save();closeModal()}
function openSold(){const p=products.find(x=>x.id===editingId);soldPrice.value=p.price||'';soldMonth.value='';soldShipping.value='';editModal.hidden=true;soldModal.hidden=false}
function confirmSold(){const p=products.find(x=>x.id===editingId);p.status='sold';p.price=Number(soldPrice.value)||p.price;p.soldYear=2026;p.soldMonth=Number(soldMonth.value)||null;p.shipping=soldShipping.value===''?null:Number(soldShipping.value);p.feeRate=.1;save();closeModal();currentTab='sold';showView('sales')}
navButtons.forEach(btn=>btn.addEventListener('click',()=>{if(btn.dataset.view)showView(btn.dataset.view)}));
document.addEventListener('click',e=>{if(e.target.matches('[data-close]'))closeModal()});
window.applyBasic=applyBasic;window.openSold=openSold;window.confirmSold=confirmSold;loadProducts();
if('serviceWorker' in navigator){window.addEventListener('load',async()=>{try{const reg=await navigator.serviceWorker.register('./sw.js?v=300');await reg.update()}catch(e){}})}
