(function(){
  const PROJECT='mp4oev3u',DATASET='production',API='2023-05-03';
  const grid=document.querySelector('.policy-grid');
  if(!grid)return;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function load(){
    try{
      const q='*[_type=="governanceDocument" && active != false]|order(displayOrder asc,title asc){title,subtitle,financialYear,externalUrl,"pdfUrl":pdf.asset->url}';
      const url=`https://${PROJECT}.api.sanity.io/v${API}/data/query/${DATASET}?perspective=published&query=${encodeURIComponent(q)}&_=${Date.now()}`;
      const r=await fetch(url,{cache:'no-store'}); if(!r.ok)throw new Error('Sanity '+r.status);
      const data=await r.json(); const docs=data.result||[]; if(!docs.length)return;
      grid.innerHTML=docs.map(d=>{
        const href=d.pdfUrl||d.externalUrl||'#';
        const meta=[d.financialYear,d.subtitle].filter(Boolean).join(' · ');
        return `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(d.title||'Governance Document')}<small>${esc(meta||'Direct PDF')}</small></a>`;
      }).join('');
      const note=document.querySelector('.policy-note');
      if(note)note.innerHTML='<b>Document hosting:</b> Governance documents are managed by the Company Secretary through the Tilak Ventures Sanity CMS.';
    }catch(e){/* keep current hard-coded governance links as fallback */}
  }
  load();
})();
