(function(){
  'use strict';
  function esc(v){var d=document.createElement('div');d.textContent=v==null?'':String(v);return d.innerHTML;}
  function safe(v){try{var u=new URL(v,location.href);return /^https?:$/.test(u.protocol)?u.href:'#';}catch(e){return '#';}}
  function dt(v){if(!v)return '—';var d=new Date(String(v).replace('T',' '));if(isNaN(d.getTime()))return esc(v);return new Intl.DateTimeFormat('en-IN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true,timeZone:'Asia/Kolkata'}).format(d);}
  function quarter(item){
    var s=String((item&&item.quarter)||'')+' '+String((item&&item.title)||'');
    var m=s.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[\s,.-]+(20\d{2})\b/i);
    if(!m)return String((item&&item.quarter)||'—');
    var map={jan:'Jan',january:'Jan',feb:'Feb',february:'Feb',mar:'Mar',march:'Mar',apr:'Apr',april:'Apr',may:'May',jun:'Jun',june:'Jun',jul:'Jul',july:'Jul',aug:'Aug',august:'Aug',sep:'Sep',sept:'Sep',september:'Sep',oct:'Oct',october:'Oct',nov:'Nov',november:'Nov',dec:'Dec',december:'Dec'};
    return (map[m[1].toLowerCase()]||m[1])+' '+m[2];
  }
  function fy(q,item){
    var m=String(q).match(/^(Jan|Feb|Mar)\s+(20\d{2})$/i);
    if(m)return (Number(m[2])-1)+' - '+m[2];
    var y=String(q).match(/20\d{2}/);
    if(y){var n=Number(y[0]);return n+' - '+(n+1);}
    var d=new Date(String((item&&item.date)||'').replace('T',' '));
    if(!isNaN(d.getTime())){var n2=d.getMonth()<3?d.getFullYear()-1:d.getFullYear();return n2+' - '+(n2+1);}
    return '—';
  }
  function xbrl(item){
    if(item&&item.xbrl)return safe(item.xbrl);
    if(item&&item.newsId)return safe('https://www.bseindia.com/Msource/90D/CorpXbrlGen.aspx?Bsenewid='+encodeURIComponent(item.newsId)+'&Scripcode='+encodeURIComponent(item.scripCode||'503663'));
    return '#';
  }
  function render(items){
    var list=document.getElementById('feedList'),controls=document.getElementById('feedControls');
    if(!list)return;
    list.className='results-wrap';
    list.hidden=false;
    if(controls)controls.hidden=true;
    var rows=(items||[]).slice().sort(function(a,b){return (new Date(String(b.date||'').replace('T',' '))).getTime()-(new Date(String(a.date||'').replace('T',' '))).getTime();});
    var body=rows.length?rows.map(function(item){
      var q=quarter(item),u=xbrl(item);
      var qcell=item.pdf?'<a class="governance-quarter-link" href="'+esc(safe(item.pdf))+'" target="_blank" rel="noopener noreferrer">'+esc(q)+'</a>':'<span class="governance-quarter-link">'+esc(q)+'</span>';
      var xb=u&&u!=='#'?'<a class="xbrl-link" href="'+esc(u)+'" target="_blank" rel="noopener noreferrer">XBRL</a>':'<span class="result-empty">—</span>';
      return '<tr><td>'+esc(fy(q,item))+'</td><td>'+qcell+'</td><td>'+esc(item.status||'New')+'</td><td>'+dt(item.date)+'</td><td>'+dt(item.revisedDate)+'</td><td>'+esc(item.revisionReason||'—')+'</td><td>'+xb+'</td></tr>';
    }).join(''):'<tr><td colspan="7" class="result-empty">No investor-complaint filings were returned by BSE.</td></tr>';
    list.innerHTML='<div class="governance-note">To view Integrated Filing (Governance) from March 2025 quarter, please <a href="https://www.bseindia.com/stock-share-price/tilak-ventures-ltd/tilakventures/503663/corp-gov/" target="_blank" rel="noopener noreferrer">click here</a>.</div><table class="governance-table"><thead><tr><th>Year</th><th>Quarter</th><th>Status</th><th>Filing Date Time</th><th>Revised Filing Date Time</th><th>Revision Reason</th><th>XBRL Link</th></tr></thead><tbody>'+body+'</tbody></table>';
  }
  function install(){
    if(typeof window.renderList!=='function')return;
    if(window.__bseComplaintPatched)return;
    var original=window.renderList;
    window.renderList=function(items){
      try{
        if(window.state&&window.state.category==='Investor Complaints'){render(items);return;}
      }catch(e){console.error(e);}
      return original(items);
    };
    window.__bseComplaintPatched=true;
    var buttons=[].slice.call(document.querySelectorAll('.investor-sidebar button[data-category="Investor Complaints"]'));
    buttons.forEach(function(b){b.addEventListener('click',function(){setTimeout(function(){
      if(window.state&&window.state.category==='Investor Complaints'){
        var list=document.getElementById('feedList');if(list)list.className='results-wrap';
      }
    },50);},true);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(install,0);});else setTimeout(install,0);
})();
