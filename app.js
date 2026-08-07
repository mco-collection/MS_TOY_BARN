const buttons=document.querySelectorAll('.bottom-nav button,.mini-btn');
buttons.forEach(btn=>btn.addEventListener('click',()=>{
  if(btn.closest('.bottom-nav')){
    document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    setTimeout(()=>{document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.remove('active'));document.querySelector('.bottom-nav button').classList.add('active')},450);
  }
}));
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));}
