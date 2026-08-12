(function(){
  'use strict';
  if (window.__tilakMobileNavLoaded) return;
  window.__tilakMobileNavLoaded = true;

  var css = `
    .mobile-nav-toggle,.mobile-nav-panel,.investor-mobile-selector{display:none}
    @media (max-width:900px){
      .top .nav{min-height:68px;gap:12px}
      .top .nav nav{display:none!important}
      .top .nav .cta{display:inline-flex!important;align-items:center;justify-content:center;padding:9px 11px;font-size:10px;margin-left:auto}
      .mobile-nav-toggle{display:inline-flex;align-items:center;justify-content:center;width:40px;height:38px;border:1px solid #d6dde3;border-radius:5px;background:#fff;color:#122333;font:700 11px Inter,Arial,sans-serif;cursor:pointer;flex:0 0 auto}
      .mobile-nav-toggle span{display:block;width:16px;height:2px;background:#122333;box-shadow:0 -5px 0 #122333,0 5px 0 #122333}
      .mobile-nav-panel{position:fixed;left:16px;right:16px;top:76px;z-index:100;background:#fff;border:1px solid #e3e7eb;border-radius:8px;box-shadow:0 18px 45px rgba(18,35,51,.16);padding:8px}
      .mobile-nav-panel.open{display:block}
      .mobile-nav-panel a{display:block;padding:13px 12px;border-bottom:1px solid #e3e7eb;color:#2d4050;font:600 12px/1.3 Inter,Arial,sans-serif}
      .mobile-nav-panel a:last-child{border-bottom:0}
      .mobile-nav-panel a.active{color:#122333;background:#f5f7f8}
      .investor-page{padding-top:20px!important}
      .investor-shell{display:block!important}
      .investor-sidebar{display:none!important}
      .investor-mobile-selector{display:block;margin:0 0 18px}
      .investor-mobile-selector label{display:block;margin:0 0 7px;color:#a7772b;font:700 9px/1.2 Inter,Arial,sans-serif;letter-spacing:.15em;text-transform:uppercase}
      .investor-mobile-selector select{width:100%;height:44px;border:1px solid #cfd6dc;border-radius:6px;background:#fff;color:#15202b;padding:0 12px;font:600 12px Inter,Arial,sans-serif}
      .investor-head{padding-top:10px!important}
      .investor-head .kicker{margin-bottom:18px!important}
      .investor-head h1{font-size:clamp(40px,11vw,58px)!important;line-height:1!important}
      .feed-card{border-radius:7px}
      .feed-top{align-items:flex-start;flex-direction:column;gap:7px;padding:15px 16px}
      .feed-top h2{font-size:17px}
      .feed-status{font-size:9px;text-align:left!important}
      .results-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
      .results-table,.annual-table,.voting-table,.shareholding-table,.governance-table,.related-party-table,.ascr-table{min-width:760px!important}
    }
    @media (max-width:520px){
      .wrap{width:min(var(--max),calc(100% - 28px))}
      .top .brand{gap:8px}
      .top .brand .mark{width:35px!important;height:35px!important}
      .top .brand b{font-size:10px!important}
      .top .brand small{font-size:7px!important}
      .top .nav .cta{padding:8px 9px;font-size:9px}
      .mobile-nav-panel{top:70px;left:12px;right:12px}
      .investor-mobile-selector{margin-bottom:14px}
      .security-strip{margin:18px 0!important}
      .security-strip div{padding:12px 14px!important}
      .security-strip b{font-size:13px!important}
    }
    .bse-filing-table{width:100%;min-width:900px;border-collapse:collapse;font-size:12px}
    .bse-filing-table th{background:#24366f;color:#fff;text-align:center;padding:13px 10px;font-weight:700;border-right:1px solid rgba(255,255,255,.35);white-space:nowrap}
    .bse-filing-table th:first-child{text-align:left}
    .bse-filing-table td{padding:15px 10px;border-right:1px solid #d9dee5;border-bottom:1px solid #d9dee5;text-align:center;background:#fff;vertical-align:middle}
    .bse-filing-table tbody tr:nth-child(even) td{background:#f7f8fa}
    .bse-filing-table td:first-child{text-align:left;font-weight:650;white-space:nowrap}
    .bse-filing-table a{color:#0969e8;text-decoration:none;font-weight:600;white-space:nowrap}
    .bse-filing-table a:hover{text-decoration:underline}
    .bse-filing-table .xbrl{display:inline-block;padding:2px 4px;background:#55a9d2;color:#fff;text-decoration:none;font-size:8px;font-weight:800}
    .bse-filing-note{padding:14px 20px;border-top:1px solid #d9dee5;background:#fafbfc;font-size:10px;color:#707b86;line-height:1.6}
  `;
  var style=document.createElement('style');
  style.id='tilak-mobile-nav-css';
  style.textContent=css;
  document.head.appendChild(style);

  var top=document.querySelector('.top .nav');
  if(top){
    var toggle=document.createElement('button');
    toggle.className='mobile-nav-toggle';
    toggle.type='button';
    toggle.setAttribute('aria-label','Open menu');
    toggle.setAttribute('aria-expanded','false');
    toggle.innerHTML='<span aria-hidden="true"></span>';
    top.appendChild(toggle);
    var panel=document.createElement('div');
    panel.className='mobile-nav-panel';
    panel.setAttribute('aria-hidden','true');
    panel.innerHTML='<a href="index.html">Home</a><a href="about-us.html">About Us</a><a href="governance.html">Governance</a><a href="contact.html">Contact Us</a><a class="active" href="investor-centre.html">Investor Centre</a>';
    document.body.appendChild(panel);
    toggle.addEventListener('click',function(){var open=panel.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));panel.setAttribute('aria-hidden',String(!open));});
    document.addEventListener('click',function(e){if(!panel.contains(e.target)&&!toggle.contains(e.target)){panel.classList.remove('open');toggle.setAttribute('aria-expanded','false');panel.setAttribute('aria-hidden','true');}});
  }

  var sidebar=document.querySelector('.investor-sidebar');
  if(sidebar){
    var main=document.querySelector('.investor-main');
    if(main){
      var box=document.createElement('div');
      box.className='investor-mobile-selector';
      box.innerHTML='<label for="investor-mobile-section">Investor Relations</label><select id="investor-mobile-section" aria-label="Investor Relations section"></select>';
      var select=box.querySelector('select');
      sidebar.querySelectorAll('button[data-category],button[data-query]').forEach(function(btn){var option=document.createElement('option');option.value=String(Array.from(sidebar.querySelectorAll('button')).indexOf(btn));option.textContent=btn.textContent.trim();if(btn.classList.contains('active'))option.selected=true;select.appendChild(option);});
      main.insertBefore(box,main.firstChild);
      select.addEventListener('change',function(){var buttons=sidebar.querySelectorAll('button');var btn=buttons[Number(select.value)];if(btn)btn.click();});
      document.addEventListener('click',function(){var active=sidebar.querySelector('button.active');if(!active)return;var buttons=Array.from(sidebar.querySelectorAll('button'));var idx=buttons.indexOf(active);if(idx>=0)select.value=String(idx);});
    }
  }

  function esc(v){var d=document.createElement('div');d.textContent=v==null?'':String(v);return d.innerHTML;}
  function url(v){try{var u=new URL(v||'',location.href);return /^https?:$/.test(u.protocol)?u.href:'#';}catch(e){return '#';}}
  function isGov(item){var t=((item&&item.category)||'')+' '+((item&&item.title)||'');return /corporate governance|integrated filing\s*[-–—(]?\s*governance|reg\.?\s*27|regulation\s*27|governance report|governance compliance|compliance report on corporate governance/i.test(t);}
  function isAscr(item){var t=((item&&item.category)||'')+' '+((item&&item.title)||'');return /annual secretarial compliance|annual secretarial compliance report|ascr|secretarial compliance report/i.test(t);}
  function filingDate(item){return item&&item.date?esc(item.date):'—';}
  function renderSpecial(category,data){
    var view=document.getElementById(category==='Corporate Governance'?'governanceView':'ascrView');
    if(!view){view=document.createElement('div');view.id=category==='Corporate Governance'?'governanceView':'ascrView';view.className='results-wrap';var card=document.querySelector('.feed-card');if(card)card.appendChild(view);}
    view.hidden=false;
    var all=Array.isArray(data&&data.items)?data.items:[];
    var rows=all.filter(category==='Corporate Governance'?isGov:isAscr).sort(function(a,b){return new Date(String(b.date||'').replace('T',' '))-new Date(String(a.date||'').replace('T',' '));});
    var h=category==='Corporate Governance'?'Corporate Governance':'Annual Secretarial Compliance Report (ASCR)';
    var table=rows.map(function(item){var x=item.xbrl?'<a class="xbrl" href="'+esc(url(item.xbrl))+'" target="_blank" rel="noopener noreferrer">XBRL</a>':'—';var p=item.pdf?'<a href="'+esc(url(item.pdf))+'" target="_blank" rel="noopener noreferrer">PDF</a>':'—';var q=item.quarter||'—';return '<tr><td>'+esc(q)+'</td><td>'+esc(item.status||'New')+'</td><td>'+filingDate(item)+'</td><td>'+esc(item.revisedDate||'—')+'</td><td>'+esc(item.revisionReason||'—')+'</td><td>'+p+'</td><td>'+x+'</td></tr>';}).join('');
    view.innerHTML='<div class="feed-top"><h2>'+h+'</h2><div class="feed-status">Source: <strong>BSE</strong></div></div>'+(rows.length?'<table class="bse-filing-table '+(category==='ASCR'?'ascr-table':'governance-table')+'"><thead><tr><th>Quarter / Period</th><th>Status</th><th>Filing Date Time</th><th>Revised Filing Date Time</th><th>Revision Reason</th><th>PDF</th><th>XBRL</th></tr></thead><tbody>'+table+'</tbody></table><div class="bse-filing-note">Data is sourced from BSE Limited. PDF and XBRL links point to the underlying BSE filing.</div>':'<div class="feed-empty">No '+esc(h)+' filings were returned by BSE.</div>');
    var title=document.getElementById('feedTitle');if(title)title.textContent=h;
    var status=document.getElementById('feedStatus');if(status)status.innerHTML='Source: <strong>BSE</strong> · Live filing feed';
    ['resultsView','annualView','votingView','shareholdingView','relatedPartyView','feedList'].forEach(function(id){var el=document.getElementById(id);if(el)el.hidden=true;});
  }
  function loadSpecial(category){
    fetch('/api/investor-feed?category='+encodeURIComponent(category)+'&page=1&_='+Date.now(),{cache:'no-store',headers:{Accept:'application/json'}})
      .then(function(r){return r.ok?r.json():Promise.reject(new Error('BSE feed unavailable'));})
      .then(function(data){renderSpecial(category,data);})
      .catch(function(){renderSpecial(category,{items:[]});});
  }
  function hookSpecial(btn){
    btn.addEventListener('click',function(){var cat=btn.getAttribute('data-category')||'';if(cat==='Corporate Governance'||cat==='ASCR')setTimeout(function(){loadSpecial(cat);},80);});
  }
  if(sidebar)sidebar.querySelectorAll('button[data-category]').forEach(hookSpecial);
})();
