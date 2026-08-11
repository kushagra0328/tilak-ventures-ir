(function(){
  'use strict';
  var CATEGORY='Investor Complaints';
  var API='/api/investor-feed?page=1&category='+encodeURIComponent(CATEGORY);
  function esc(v){var d=document.createElement('div');d.textContent=v==null?'':String(v);return d.innerHTML;}
  function safe(v){try{var u=new URL(v,location.href);return /^https?:$/.test(u.protocol)?u.href:'#';}catch(e){return '#';}}
  function parsed(v){if(!v)return null;var d=new Date(String(v).replace('T',' '));return isNaN(d.getTime())?null:d;}
  function date(v){var d=parsed(v);if(!d)return v?esc(v):'—';return new Intl.DateTimeFormat('en-IN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true,timeZone:'Asia/Kolkata'}).format(d);}
  function quarter(item){
    var s=String((item&&item.quarter)||'')+' '+String((item&&item.title)||'');
    var m=s.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[\s,.-]+(20\d{2})\b/i);
    if(m){var map={jan:'Jan',january:'Jan',feb:'Feb',february:'Feb',mar:'Mar',march:'Mar',apr:'Apr',april:'Apr',may:'May',jun:'Jun',june:'Jun',jul:'Jul',july:'Jul',aug:'Aug',august:'Aug',sep:'Sep',sept:'Sep',september:'Sep',oct:'Oct',october:'Oct',nov:'Nov',november:'Nov',dec:'Dec',december:'Dec'};return (map[m[1].toLowerCase()]||m[1])+' '+m[2];}
    return String((item&&item.quarter)||'—');
  }
  function fy(q,item){
    var m=String(q).match(/^(Jan|Feb|Mar)\s+(20\d{2})$/i);
    if(m)return (Number(m[2])-1)+' - '+m[2];
    var y=String(q).match(/20\d{2}/);
    if(y){var n=Number(y[0]);return n+' - '+(n+1);}
    var d=parsed(item&&item.date);
    if(d){var n2=d.getMonth()<3?d.getFullYear()-1:d.getFullYear();return n2+' - '+(n2+1);}
    return '—';
  }
  function xbrl(item){
    if(item&&item.xbrl)return safe(item.xbrl);
    if(item&&item.newsId)return safe('https://www.bseindia.com/Msource/90D/CorpXbrlGen.aspx?Bsenewid='+encodeURIComponent(item.newsId)+'&Scripcode='+encodeURIComponent(item.scripCode||'503663'));
    return '#';
  }
  function setView(){
    var ids=['resultsView','annualView','votingView','shareholdingView','governanceView','relatedPartyView'];
    ids.forEach(function(id){var el=document.getElementById(id);if(el)el.hidden=true;});
    var list=document.getElementById('feedList'),controls=document.getElementById('feedControls');
    if(list){list.hidden=false;list.className='results-wrap';}
    if(controls)controls.hidden=true;
    var title=document.getElementById('feedTitle');if(title)title.textContent='Statement of Investor Complaints';
    var status=document.getElementById('feedStatus');if(status)status.innerHTML='Source: <strong>BSE</strong> · Loading…';
    document.querySelectorAll('.investor-sidebar button').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-category')===CATEGORY);});
  }
  function render(items){
    var list=document.getElementById('feedList');if(!list)return;
    var rows=(items||[]).slice().sort(function(a,b){return (parsed(b.date)||0)-(parsed(a.date)||0);});
    var body=rows.length?rows.map(function(item){
      var q=quarter(item),u=xbrl(item);
      var qcell=item&&item.pdf?'<a class="governance-quarter-link" href="'+esc(safe(item.pdf))+'" target="_blank" rel="noopener noreferrer">'+esc(q)+'</a>':'<span>'+esc(q)+'</span>';
      var xb=u&&u!=='#'?'<a class="xbrl-link" href="'+esc(u)+'" target="_blank" rel="noopener noreferrer">XBRL</a>':'<span class="result-empty">—</span>';
      return '<tr><td>'+esc(fy(q,item))+'</td><td>'+qcell+'</td><td>'+esc(item&&item.status||'New')+'</td><td>'+date(item&&item.date)+'</td><td>'+date(item&&item.revisedDate)+'</td><td>'+esc(item&&item.revisionReason||'—')+'</td><td>'+xb+'</td></tr>';
    }).join(''):'<tr><td colspan="7" class="result-empty">No investor-complaint filings were returned by BSE.</td></tr>';
    list.innerHTML='<div class="results-wrap"><table class="governance-table"><thead><tr><th>Year</th><th>Quarter</th><th>Status</th><th>Filing Date Time</th><th>Revised Filing Date Time</th><th>Revision Reason</th><th>XBRL Link</th></tr></thead><tbody>'+body+'</tbody></table></div><div class="governance-foot">Investor complaint filings are retrieved dynamically from BSE for scrip 503663. The table follows the BSE filing layout and uses the filing quarter/PDF and XBRL document where supplied by BSE.</div>';
  }
  function load(){
    setView();
    var status=document.getElementById('feedStatus');
    fetch(API,{cache:'no-store'}).then(function(r){return r.json().then(function(data){if(!r.ok)throw new Error(data&&data.error||'BSE feed unavailable');return data;});}).then(function(data){
      render(data.items||data.investorComplaints||[]);
      if(status&&data.fetchedAt){var d=parsed(data.fetchedAt);if(d)status.innerHTML='Source: <strong>BSE</strong> · Updated '+new Intl.DateTimeFormat('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true,timeZone:'Asia/Kolkata'}).format(d);}
    }).catch(function(e){console.error('Investor complaints:',e);if(status)status.innerHTML='Source: <strong>BSE</strong> · Temporarily unavailable';var list=document.getElementById('feedList');if(list)list.innerHTML='<div class="feed-error">BSE investor complaint data is temporarily unavailable. Please try again shortly.</div>';});
  }
  function bind(){
    var btns=[].slice.call(document.querySelectorAll('.investor-sidebar button[data-category="Investor Complaints"]'));
    btns.forEach(function(btn){
      btn.addEventListener('click',function(e){
        e.preventDefault();
        e.stopPropagation();
        if(e.stopImmediatePropagation)e.stopImmediatePropagation();
        load();
      },true);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
