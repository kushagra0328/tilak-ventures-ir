(function(){
  'use strict';
  var CATEGORY='Investor Complaints';
  var API='/api/investor-feed?page=1&category='+encodeURIComponent(CATEGORY);
  var BSE_FILINGS='https://www.bseindia.com/corporates/ann.html';
  var bound=false;
  function esc(v){var d=document.createElement('div');d.textContent=v==null?'':String(v);return d.innerHTML;}
  function safe(v){try{var u=new URL(v,location.href);return /^https?:$/.test(u.protocol)?u.href:'#';}catch(e){return '#';}}
  function parsed(v){if(!v)return null;var d=new Date(String(v).replace('T',' '));return isNaN(d.getTime())?null:d;}
  function pad(n){return String(n).padStart(2,'0');}
  function fmtDate(v){var d=parsed(v);if(!d)return v?esc(v):'—';var h=d.getHours(),ampm=h>=12?'pm':'am';h=h%12||12;return pad(d.getDate())+'-'+pad(d.getMonth()+1)+'-'+d.getFullYear()+' '+pad(h)+':'+pad(d.getMinutes())+':'+pad(d.getSeconds())+' '+ampm;}
  function quarter(item){
    var s=String((item&&item.quarter)||'')+' '+String((item&&item.title)||'');
    var m=s.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[\s,.-]+(20\d{2})\b/i);
    if(m){var map={jan:'Jan',january:'Jan',feb:'Feb',february:'Feb',mar:'Mar',march:'Mar',apr:'Apr',april:'Apr',may:'May',jun:'Jun',june:'Jun',jul:'Jul',july:'Jul',aug:'Aug',august:'Aug',sep:'Sep',sept:'Sep',september:'Sep',oct:'Oct',october:'Oct',nov:'Nov',november:'Nov',dec:'Dec',december:'Dec'};return (map[m[1].toLowerCase()]||m[1])+' '+m[2];}
    return String((item&&item.quarter)||'—');
  }
  function fy(q,item){
    var m=String(q).match(/^(Jan|Feb|Mar)\s+(20\d{2})$/i);
    if(m)return (Number(m[2])-1)+' - '+m[2];
    var y=String(q).match(/20\d{2}/);if(y){var n=Number(y[0]);return n+' - '+(n+1);}
    var d=parsed(item&&item.date);if(d){var n2=d.getMonth()<3?d.getFullYear()-1:d.getFullYear();return n2+' - '+(n2+1);}
    return '—';
  }
  function xbrl(item){
    if(item&&item.xbrl)return safe(item.xbrl);
    if(item&&item.newsId)return safe('https://www.bseindia.com/Msource/90D/CorpXbrlGen.aspx?Bsenewid='+encodeURIComponent(item.newsId)+'&Scripcode='+encodeURIComponent(item.scripCode||'503663'));
    return '#';
  }
  function setView(){
    ['resultsView','annualView','votingView','shareholdingView','governanceView','relatedPartyView'].forEach(function(id){var el=document.getElementById(id);if(el)el.hidden=true;});
    var list=document.getElementById('feedList');if(list)list.hidden=true;
    var controls=document.getElementById('feedControls');if(controls)controls.hidden=true;
    var view=document.getElementById('governanceView');if(view){view.hidden=false;view.className='results-wrap';}
    var title=document.getElementById('feedTitle');if(title)title.textContent='Statement of Investor Complaints';
    var status=document.getElementById('feedStatus');if(status)status.innerHTML='Source: <strong>BSE</strong> · Loading…';
    document.querySelectorAll('.investor-sidebar button').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-category')==='Investor Complaints');});
  }
  function render(items){
    var view=document.getElementById('governanceView');if(!view)return;
    var map={};
    (items||[]).slice().sort(function(a,b){return (parsed(b&&b.date)||0)-(parsed(a&&a.date)||0);}).forEach(function(item){
      var q=quarter(item);if(!q||q==='—')return;
      var key=String(fy(q,item))+'|'+q;
      if(!map[key]||((parsed(item.date)||0)>(parsed(map[key].date)||0)))map[key]=item;
    });
    var rows=Object.keys(map).map(function(k){var item=map[k];return{item:item,q:quarter(item),fy:fy(quarter(item),item)};}).sort(function(a,b){var da=parsed(a.item.date)||0,db=parsed(b.item.date)||0;return db-da;});
    var body=rows.length?rows.map(function(r){
      var item=r.item,u=xbrl(item);
      var qcell=item&&item.pdf?'<a class="governance-quarter-link" href="'+esc(safe(item.pdf))+'" target="_blank" rel="noopener noreferrer">'+esc(r.q)+'</a>':'<span>'+esc(r.q)+'</span>';
      var xb=u&&u!=='#'?'<a class="xbrl-link" href="'+esc(u)+'" target="_blank" rel="noopener noreferrer">XBRL</a>':'<span class="result-empty">—</span>';
      return '<tr><td>'+esc(r.fy)+'</td><td>'+qcell+'</td><td>'+esc(item&&item.status||'New')+'</td><td>'+fmtDate(item&&item.date)+'</td><td>'+fmtDate(item&&item.revisedDate)+'</td><td>'+esc(item&&item.revisionReason||'—')+'</td><td>'+xb+'</td></tr>';
    }).join(''):'<tr><td colspan="7" class="result-empty">No corporate-governance filings were returned by BSE.</td></tr>';
    view.innerHTML='<div class="governance-note">To view Integrated Filing (Governance) from March 2025 quarter, please <a href="'+BSE_FILINGS+'" target="_blank" rel="noopener noreferrer">click here</a>.</div><table class="governance-table"><thead><tr><th>Year</th><th>Quarter</th><th>Status</th><th>Filing Date Time</th><th>Revised Filing Date Time</th><th>Revision Reason</th><th>XBRL Link</th></tr></thead><tbody>'+body+'</tbody></table>';
  }
  function load(){
    setView();
    fetch(API,{cache:'no-store',headers:{'Accept':'application/json'}}).then(function(r){return r.json().then(function(data){if(!r.ok)throw new Error(data&&data.error||'BSE feed unavailable');return data;});}).then(function(data){
      render(data.items||data.investorComplaints||[]);
      var status=document.getElementById('feedStatus');
      if(status&&data.fetchedAt){var d=parsed(data.fetchedAt);if(d)status.innerHTML='Source: <strong>BSE</strong> · Updated '+new Intl.DateTimeFormat('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true,timeZone:'Asia/Kolkata'}).format(d);}
    }).catch(function(e){console.error(e);var status=document.getElementById('feedStatus');if(status)status.innerHTML='Source: <strong>BSE</strong> · Temporarily unavailable';var view=document.getElementById('governanceView');if(view)view.innerHTML='<div class="feed-error">BSE investor complaint data is temporarily unavailable. Please try again shortly.</div>';});
  }
  function isComplaintButton(el){return el&&el.closest&&el.closest('.investor-sidebar button[data-category="Investor Complaints"]');}
  function bind(){
    if(bound)return;bound=true;
    document.addEventListener('click',function(e){var btn=isComplaintButton(e.target);if(!btn)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();load();},true);
    setTimeout(function(){var active=document.querySelector('.investor-sidebar button.active[data-category="Investor Complaints"]');if(active)load();},300);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();