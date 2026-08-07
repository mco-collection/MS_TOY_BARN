const navButtons=document.querySelectorAll('.bottom-nav button');
const homeCard=document.getElementById('homeCard'), productPanel=document.getElementById('productPanel');
const metrics=document.querySelector('.metrics'), hero=document.querySelector('.hero');
let products=[], currentTab='listing', editingId=null;
const yen=n=>'¥'+Number(n||0).toLocaleString('ja-JP');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function calcProfit(p){if(p.status!=='sold'||p.purchasePrice==null||p.shipping==null)return null;return Math.round(p.price*(1-(p.feeRate??.1))-p.shipping-p.purchasePrice)}
async function loadProducts(){
 try{const res=await fetch('./products.json?v=200',{cache:'no-store'});const base=await res.json();const saved=JSON.parse(localStorage.getItem('mstb_products_v2')||'null');products=saved||base;renderAll()}catch(e){console.warn(e)}
}
function save(){localStorage.setItem('mstb_products_v2',JSON.stringify(products));renderAll()}
function renderAll(){
 const listed=products.filter(p=>p.status==='listing'), sold=products.filter(p=>p.status==='sold');
 inventory.innerHTML=`${listed.length}<em>件</em>`;document.getElementById('listed').innerHTML=`${listed.length}<em>件</em>`;
 document.getElementById('listingValue').textContent=yen(listed.reduce((s,p)=>s+Number(p.price||0),0));
 const now=new Date(), month=now.getMonth()+1, year=now.getFullYear(); const ms=sold.filter(p=>p.soldYear===year&&p.soldMonth===month);
 const profits=ms.map(calcProfit).filter(v=>v!=null);document.getElementById('profit').textContent=profits.length?yen(profits.reduce((a,b)=>a+b,0)):'—';
 renderProducts();
}
function renderProducts(){
 const list=products.filter(p=>p.status===currentTab); document.getElementById('productSummary').textContent=`${list.length}件`;
 document.querySelector('.product-head b').textContent=currentTab==='listing'?'📦 出品中の商品':'✅ 販売済み';
 document.getElementById('listingValue').textContent=yen(list.reduce((s,p)=>s+Number(p.price||0),0));
 const tabs=`<div class="tabs"><button class="tab-btn ${currentTab==='listing'?'active':''}" data-tab="listing">出品中</button><button class="tab-btn ${currentTab==='sold'?'active':''}" data-tab="sold">販売済み</button></div>`;
 productList.innerHTML=tabs+list.map(p=>{const pr=calcProfit(p);return `<article class="product-row" data-id="${p.id}"><div><b>${esc(p.name)}${p.status==='sold'?'<span class="status-badge sold-badge">販売済</span>':''}</b><small>${esc(p.series||'')}${p.pop?` ・ #${esc(p.pop)}`:''}</small>${p.status==='sold'?`<div class="sold-info">${p.soldYear||''}年${p.soldMonth||'—'}月${pr==null?'':' ・ 利益 '+yen(pr)}</div>`:''}</div><strong>${yen(p.price)}</strong></article>`}).join('');
 document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{currentTab=b.dataset.tab;renderProducts()});document.querySelectorAll('.product-row[data-id]').forEach(r=>r.onclick=()=>openEdit(r.dataset.id));
}
function showView(view){navButtons.forEach(b=>b.classList.toggle('active',b.dataset.view===view));const x=view==='products';homeCard.hidden=x;metrics.hidden=x;hero.hidden=x;productPanel.hidden=!x;document.querySelector('.dashboard').classList.toggle('products-view',x)}
function openEdit(id){editingId=id;const p=products.find(x=>x.id===id); editTitle.value=p.name||'';editPop.value=p.pop||'';editSeries.value=p.series||'';editPrice.value=p.price||'';editPurchase.value=p.purchasePrice??'';editMemo.value=p.memo||'';soldAction.hidden=p.status==='sold';soldFields.hidden=p.status!=='sold';editSoldMonth.value=p.soldMonth||'';editShipping.value=p.shipping??'';editModal.hidden=false}
function closeModal(){editModal.hidden=true;soldModal.hidden=true}
function applyBasic(){const p=products.find(x=>x.id===editingId);p.name=editTitle.value.trim();p.pop=editPop.value.trim();p.series=editSeries.value.trim();p.price=Number(editPrice.value)||0;p.purchasePrice=editPurchase.value===''?null:Number(editPurchase.value);p.memo=editMemo.value; if(p.status==='sold'){p.soldMonth=Number(editSoldMonth.value)||null;p.shipping=editShipping.value===''?null:Number(editShipping.value)}save();closeModal()}
function openSold(){const p=products.find(x=>x.id===editingId);soldPrice.value=p.price||'';soldMonth.value='';soldShipping.value='';editModal.hidden=true;soldModal.hidden=false}
function confirmSold(){const p=products.find(x=>x.id===editingId);p.status='sold';p.price=Number(soldPrice.value)||p.price;p.soldYear=2026;p.soldMonth=Number(soldMonth.value)||null;p.shipping=soldShipping.value===''?null:Number(soldShipping.value);p.feeRate=.1;save();closeModal();currentTab='sold';renderProducts()}
navButtons.forEach(btn=>btn.addEventListener('click',()=>{if(btn.dataset.view)showView(btn.dataset.view)}));
document.addEventListener('click',e=>{if(e.target.matches('[data-close]'))closeModal()});
window.applyBasic=applyBasic;window.openSold=openSold;window.confirmSold=confirmSold;loadProducts();
if('serviceWorker' in navigator){window.addEventListener('load',async()=>{try{const reg=await navigator.serviceWorker.register('./sw.js?v=200');await reg.update()}catch(e){}})}
