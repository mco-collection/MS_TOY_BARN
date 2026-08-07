const navButtons=document.querySelectorAll('.bottom-nav button');
const homeCard=document.getElementById('homeCard');
const productPanel=document.getElementById('productPanel');
const metrics=document.querySelector('.metrics');
const hero=document.querySelector('.hero');
let products=[];

const yen=n=>'¥'+Number(n).toLocaleString('ja-JP');

async function loadProducts(){
  try{
    const res=await fetch('./products.json?v=110',{cache:'no-store'});
    products=await res.json();
    const listed=products.filter(p=>p.status==='listing');
    document.getElementById('inventory').innerHTML=`${listed.length}<em>件</em>`;
    document.getElementById('listed').innerHTML=`${listed.length}<em>件</em>`;
    document.getElementById('productSummary').textContent=`${listed.length}件`;
    document.getElementById('listingValue').textContent=yen(listed.reduce((s,p)=>s+p.price,0));
    document.getElementById('productList').innerHTML=listed.map(p=>`<article class="product-row"><div><b>${p.name}</b><small>${p.series}${p.pop?` ・ #${p.pop}`:''}${p.quantity>1?` ・ ${p.quantity}体セット`:''}</small></div><strong>${yen(p.price)}</strong></article>`).join('');
  }catch(e){console.warn('products.json load failed',e)}
}

function showView(view){
  navButtons.forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  const isProducts=view==='products';
  homeCard.hidden=isProducts;
  metrics.hidden=isProducts;
  hero.hidden=isProducts;
  productPanel.hidden=!isProducts;
  document.querySelector('.dashboard').classList.toggle('products-view',isProducts);
}

navButtons.forEach(btn=>btn.addEventListener('click',()=>{
  if(btn.dataset.view) showView(btn.dataset.view);
}));
document.querySelectorAll('.mini-btn').forEach(btn=>btn.addEventListener('click',()=>{}));
loadProducts();
if('serviceWorker' in navigator){window.addEventListener('load',async()=>{try{const reg=await navigator.serviceWorker.register('./sw.js?v=110'); await reg.update();}catch(e){console.warn('service worker update failed',e)}});}
