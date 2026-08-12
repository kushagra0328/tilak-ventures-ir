from pathlib import Path
import hashlib, json, shutil, time, requests
ROOT=Path('.'); MANIFEST_PATH=ROOT/'investor-results-manifest.json'; RESULTS_DIR=ROOT/'results'; INVESTORS=ROOT/'investors.html'; MANUAL_JSON=ROOT/'investor-manual-results.json'
manifest=json.loads(MANIFEST_PATH.read_text(encoding='utf-8')); targets=manifest['files']
def digest_file(p):
 h=hashlib.sha256();
 with p.open('rb') as f:
  for c in iter(lambda:f.read(1024*1024),b''): h.update(c)
 return h.hexdigest()
found={}
for p in ROOT.rglob('*.pdf'):
 if p.parts and p.parts[0]=='results': continue
 d=digest_file(p)
 if d in targets.values(): found[d]=p
missing=[n for n,d in targets.items() if d not in found]
if missing:
 windows={'Jun-17.pdf':('20170601','20170930'),'Jun-18.pdf':('20180601','20180831'),'Sep-18.pdf':('20180901','20181130'),'Dec-18.pdf':('20181201','20190228'),'Mar-22.pdf':('20220301','20220615'),'Jun-25.pdf':('20250601','20250815')}
 s=requests.Session(); s.headers.update({'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/134 Safari/537.36','Referer':'https://www.bseindia.com/corporates/ann.html','Accept':'application/json, text/plain, */*'})
 for name in list(missing):
  start,end=windows[name]; rows=[]
  try:
   for page in range(1,51):
    q={'pageno':page,'strCat':'-1','strPrevDate':start,'strScrip':'503663','strSearch':'P','strToDate':end,'strType':'C','subcategory':''}; r=s.get('https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w',params=q,timeout=30); r.raise_for_status(); b=r.json().get('Table') or []; rows+=b
    if not b or len(b)<50: break
  except Exception as e: print('BSE lookup failed',name,e); continue
  candidates=[x for x in rows if ('result' in (' '.join(str(x.get(k,'')) for k in ('NEWSSUB','HEADLINE','CATEGORYNAME','SUBCATNAME'))).lower() or 'financial' in (' '.join(str(x.get(k,'')) for k in ('NEWSSUB','HEADLINE','CATEGORYNAME','SUBCATNAME'))).lower()) and x.get('ATTACHMENTNAME')]
  chosen=None
  for row in candidates:
   for base in ('https://www.bseindia.com/xml-data/corpfiling/AttachHis/','https://www.bseindia.com/xml-data/corpfiling/AttachLive/'):
    try:
     p=s.get(base+row['ATTACHMENTNAME'],timeout=45)
     if p.status_code==200 and p.content.startswith(b'%PDF'):
      if hashlib.sha256(p.content).hexdigest()==targets[name]: chosen=p.content; break
      if chosen is None: chosen=p.content
    except Exception: pass
   if chosen is not None and hashlib.sha256(chosen).hexdigest()==targets[name]: break
  if chosen is not None:
   RESULTS_DIR.mkdir(exist_ok=True); (RESULTS_DIR/name).write_bytes(chosen); found[targets[name]]=RESULTS_DIR/name; print('Archived result filing',name)
  time.sleep(.2)
missing=[n for n,d in targets.items() if d not in found]
if missing: raise SystemExit('Could not recover result PDFs: '+', '.join(missing))
RESULTS_DIR.mkdir(exist_ok=True)
for n,d in targets.items():
 dest=RESULTS_DIR/n; src=found[d]
 if src.resolve()!=dest.resolve(): shutil.copyfile(src,dest)
MANUAL_JSON.write_text(json.dumps({'policy':'Static Company Archive. Historical result PDFs are stored locally in /results and are independent of BSE and WordPress.','results':[{'file':n,'url':f'results/{n}','sha256':digest_file(RESULTS_DIR/n)} for n in targets]},indent=2)+'\n',encoding='utf-8')
new_renderer=r'''function renderResults(rows){
const periods=[{financialYear:'2026-2027',q1:null,q2:null,q3:null,q4:null,current:true}];
for(let fy=2025;fy>=2017;fy--){const next=fy+1;periods.push({financialYear:`${fy}-${String(next).slice(-2)}`,q1:`Jun-${String(fy).slice(-2)}`,q2:`Sep-${String(fy).slice(-2)}`,q3:`Dec-${String(fy).slice(-2)}`,q4:`Mar-${String(next).slice(-2)}`});}
const archive=l=>`<a class="result-link result-placeholder" href="${esc(`results/${l}.pdf`)}" target="_blank" rel="noopener noreferrer">${esc(l)}</a>`; const cell=(l,c)=>c?'<span class="result-empty">Not filed</span>':archive(l);
resultsView.innerHTML=`<table class="results-table"><thead><tr><th>Financial Year</th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th></tr></thead><tbody>${periods.map(r=>`<tr><td>${esc(r.financialYear)}</td><td>${cell(r.q1,r.current)}</td><td>${cell(r.q2,r.current)}</td><td>${cell(r.q3,r.current)}</td><td>${cell(r.q4,r.current)}</td></tr>`).join('')}</tbody></table><div class="results-foot">Historical financial results are maintained in the Company's independent archive. Result PDFs are served locally and are not dependent on BSE or WordPress.</div>`;
}'''
html=INVESTORS.read_text(encoding='utf-8'); a=html.find('function renderResults(rows){'); b=html.find('function pdfIcon',a)
if a<0 or b<0: raise SystemExit('Could not locate Results renderer')
html=html[:a]+new_renderer+html[b:]; old="if(isResults)resultsView.innerHTML='<div class=\"feed-empty\">Loading exchange financial results…</div>';"; new="if(isResults){status.innerHTML='Source: <strong>Company Archive</strong> · Historical Results';renderResults([]);return;}"
if old not in html: raise SystemExit('Could not locate Results load hook')
html=html.replace(old,new,1)
if 'id="results-archive-layout"' not in html: html=html.replace('</head>','<style id="results-archive-layout">.result-link.result-placeholder::before{display:none!important}.result-link.result-placeholder{font-size:13px;font-weight:600;color:#0969e8;text-decoration:none;cursor:pointer}.result-link.result-placeholder:hover{text-decoration:underline}.results-table th,.results-table td{min-width:110px}.results-table th:first-child,.results-table td:first-child{min-width:150px}</style></head>',1)
INVESTORS.write_text(html,encoding='utf-8')
