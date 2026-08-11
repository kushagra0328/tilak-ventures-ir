export async function onRequest(context) {
  const url = new URL(context.request.url);
  const response = await context.next();
  if (url.pathname !== '/investors.html' && url.pathname !== '/investor-centre.html') return response;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;
  const html = await response.text();
  if (html.includes('data-bse-complaints-patch')) return new Response(html, response);
  const patch = `
<script data-bse-complaints-patch>
(function(){
  function init(){
    const button=[...document.querySelectorAll('.investor-sidebar button')].find(b=>b.dataset.category==='Investor Complaints');
    if(!button)return;
    button.addEventListener('click',function(){
      setTimeout(async function(){
        try{
          let view=document.getElementById('bseComplaintsView');
          if(!view){
            view=document.createElement('div');
            view.id='bseComplaintsView';
            view.className='results-wrap';
            const list=document.getElementById('feedList');
            if(list&&list.parentNode)list.parentNode.insertBefore(view,list);
          }
          const list=document.getElementById('feedList');
          const controls=document.getElementById('feedControls');
          view.hidden=false;
          if(list)list.hidden=true;
          if(controls)controls.hidden=true;
          const esc=v=>{const d=document.createElement('div');d.textContent=v??'';return d.innerHTML;};
          const safe=v=>{try{const u=new URL(v,location.href);return /^https?:$/.test(u.protocol)?u.href:'#';}catch{return '#';}};
          const dt=v=>{if(!v)return '—';const d=new Date(String(v).replace('T',' '));if(Number.isNaN(d.getTime()))return esc(v);return new Intl.DateTimeFormat('en-IN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true,timeZone:'Asia/Kolkata'}).format(d);};
          const quarter=i=>{const s=String(i?.quarter||'')+' '+String(i?.title||'');const m=s.match(/\\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[\\s,.-]+(20\\d{2})\\b/i);if(!m)return String(i?.quarter||'—');const map={jan:'Jan',january:'Jan',feb:'Feb',february:'Feb',mar:'Mar',march:'Mar',apr:'Apr',april:'Apr',may:'May',jun:'Jun',june:'Jun',jul:'Jul',july:'Jul',aug:'Aug',august:'Aug',sep:'Sep',sept:'Sep',september:'Sep',oct:'Oct',october:'Oct',nov:'Nov',november:'Nov',dec:'Dec',december:'Dec'};return (map[m[1].toLowerCase()]||m[1])+' '+m[2];};
          const year=(q,i)=>{const m=String(q).match(/^(Jan|Feb|Mar)\\s+(20\\d{2})$/i);if(m)return (Number(m[2])-1)+' - '+m[2];const y=String(q).match(/20\\d{2}/);if(y){const n=Number(y[0]);return n+' - '+(n+1);}const d=new Date(String(i?.date||'').replace('T',' '));if(!Number.isNaN(d.getTime())){const n=d.getMonth()<3?d.getFullYear()-1:d.getFullYear();return n+' - '+(n+1);}return '—';};
          const xbrl=i=>i?.xbrl||(i?.newsId?'https://www.bseindia.com/Msource/90D/CorpXbrlGen.aspx?Bsenewid='+encodeURIComponent(i.newsId)+'&Scripcode='+encodeURIComponent(i.scripCode||'503663'):'');
          const r=await fetch('/api/investor-feed?page=1&category='+encodeURIComponent('Investor Complaints'),{cache:'no-store',headers:{Accept:'application/json'}});
          const data=await r.json();
          if(!r.ok)throw new Error(data?.error||'BSE investor complaints unavailable');
          const rows=[...(data.items||[])].sort((a,b)=>(new Date(String(b.date||'').replace('T',' ')))-(new Date(String(a.date||'').replace('T',' '))));
          const body=rows.length?rows.map(i=>{const q=quarter(i),x=xbrl(i);const pdf=i?.pdf?'<a class="governance-quarter-link" href="'+esc(safe(i.pdf))+'" target="_blank" rel="noopener noreferrer">'+esc(q)+'</a>':esc(q);const xb=x?'<a class="xbrl-link" href="'+esc(safe(x))+'" target="_blank" rel="noopener noreferrer">XBRL</a>':'<span class="result-empty">—</span>';return '<tr><td>'+esc(year(q,i))+'</td><td>'+pdf+'</td><td>'+esc(i.status||'New')+'</td><td>'+dt(i.date)+'</td><td>'+dt(i.revisedDate)+'</td><td>'+esc(i.revisionReason||'—')+'</td><td>'+xb+'</td></tr>';}).join(''):'<tr><td colspan="7" class="result-empty">No investor-complaint filings were returned by BSE.</td></tr>';
          view.innerHTML='<div class="governance-note">To view Integrated Filing (Governance) from March 2025 quarter, please <a href="https://www.bseindia.com/stock-share-price/tilak-ventures-ltd/tilakventures/503663/corp-gov/" target="_blank" rel="noopener noreferrer">click here</a>.</div><div class="results-wrap"><table class="governance-table"><thead><tr><th>Year</th><th>Quarter</th><th>Status</th><th>Filing Date Time</th><th>Revised Filing Date Time</th><th>Revision Reason</th><th>XBRL Link</th></tr></thead><tbody>'+body+'</tbody></table></div>';
        }catch(e){console.error('BSE investor complaints renderer:',e);}
      },120);
    },true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
</script>`;
  const patched = html.replace(/<\/body>/i, patch + '</body>');
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control','no-store');
  return new Response(patched,{status:response.status,statusText:response.statusText,headers});
}
