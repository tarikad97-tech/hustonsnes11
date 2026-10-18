(async()=>{const q=(new URLSearchParams(location.search).get('q')||'').trim().toLowerCase();
const box=document.getElementById('q'),out=document.getElementById('results');if(box)box.value=q;if(!q)return;
try{const idx=await (await fetch('/search-index.json')).json();const terms=q.split(/\s+/);
const hits=idx.filter(i=>{const h=(i.t+' '+i.d+' '+i.c+' '+i.k.join(' ')).toLowerCase();return terms.every(t=>h.includes(t))});
out.innerHTML=hits.length?'<ul class="results">'+hits.map(()=>'<li><a></a><p></p></li>').join('')+'</ul>':'<p>No guides match your search yet. Try a broader word like "parks" or browse a category.</p>';
hits.forEach((i,n)=>{const li=out.querySelectorAll('li')[n];const a=li.querySelector('a');a.href=i.u;a.textContent=i.t;li.querySelector('p').textContent=i.d});
}catch{out.textContent='Search is unavailable right now. Please browse the categories instead.'}})();
