from pathlib import Path
import hashlib
import json
import shutil
import time
from datetime import datetime
import requests

ROOT = Path('.')
MANIFEST_PATH = ROOT / 'investor-results-manifest.json'
RESULTS_DIR = ROOT / 'results'
INVESTORS = ROOT / 'investors.html'
MANUAL_JSON = ROOT / 'investor-manual-results.json'

manifest = json.loads(MANIFEST_PATH.read_text(encoding='utf-8'))
targets = manifest['files']

def digest_file(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()

# First, reuse exact PDFs already present anywhere in the repository.
found = {}
for path in ROOT.rglob('*.pdf'):
    if path.parts and path.parts[0] == 'results':
        continue
    digest = digest_file(path)
    if digest in targets.values():
        found[digest] = path

# A small one-time fallback for documents that were supplied but are not yet
# present in the repository. We fetch only the missing historical filings from
# BSE, verify their SHA-256 against the supplied archive, then commit the PDFs.
# After this run, the website uses only /results and has no BSE dependency.
missing = [name for name, digest in targets.items() if digest not in found]
if missing:
    windows = {
        'Jun-17.pdf': ('20170601', '20170831'),
        'Jun-18.pdf': ('20180601', '20180831'),
        'Sep-18.pdf': ('20180901', '20181130'),
        'Dec-18.pdf': ('20181201', '20190228'),
        'Mar-22.pdf': ('20220301', '20220615'),
        'Jun-25.pdf': ('20250601', '20250815'),
    }
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/134 Safari/537.36',
        'Referer': 'https://www.bseindia.com/corporates/ann.html',
        'Accept': 'application/json, text/plain, */*',
    }
    session = requests.Session()
    session.headers.update(headers)

    def get_announcements(start, end):
        all_rows = []
        for page in range(1, 51):
            params = {
                'pageno': page,
                'strCat': '-1',
                'strPrevDate': start,
                'strScrip': '503663',
                'strSearch': 'P',
                'strToDate': end,
                'strType': 'C',
                'subcategory': '',
            }
            r = session.get('https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w', params=params, timeout=30)
            r.raise_for_status()
            data = r.json()
            rows = data.get('Table') or []
            if not rows:
                break
            all_rows.extend(rows)
            if len(rows) < 50:
                break
        return all_rows

    for name in list(missing):
        digest = targets[name]
        start, end = windows[name]
        try:
            rows = get_announcements(start, end)
        except Exception as exc:
            print(f'BSE API lookup failed for {name}: {exc}')
            continue

        candidates = []
        for row in rows:
            text = ' '.join(str(row.get(k, '')) for k in ('NEWSSUB', 'HEADLINE', 'CATEGORYNAME', 'SUBCATNAME')).lower()
            if 'result' not in text and 'financial' not in text:
                continue
            attachment = row.get('ATTACHMENTNAME')
            if attachment:
                candidates.append(attachment)

        # Prefer unique attachments and try both historical/live BSE paths.
        for attachment in dict.fromkeys(candidates):
            for base in ('https://www.bseindia.com/xml-data/corpfiling/AttachHis/',
                         'https://www.bseindia.com/xml-data/corpfiling/AttachLive/'):
                try:
                    rr = session.get(base + attachment, timeout=45)
                    if rr.status_code != 200 or not rr.content.startswith(b'%PDF'):
                        continue
                    if hashlib.sha256(rr.content).hexdigest() == digest:
                        temp = RESULTS_DIR / name
                        RESULTS_DIR.mkdir(exist_ok=True)
                        temp.write_bytes(rr.content)
                        found[digest] = temp
                        print(f'Exact supplied PDF recovered from BSE for {name}')
                        break
                except Exception:
                    continue
            if digest in found:
                break
        time.sleep(0.25)

missing = [name for name, digest in targets.items() if digest not in found]
if missing:
    raise SystemExit('Could not recover exact supplied result PDFs: ' + ', '.join(missing))

RESULTS_DIR.mkdir(exist_ok=True)
for name, digest in targets.items():
    destination = RESULTS_DIR / name
    source = found[digest]
    if source.resolve() != destination.resolve():
        shutil.copyfile(source, destination)

manual = {
    'policy': 'Static Company Archive. Historical result PDFs are stored locally in /results and are independent of BSE and WordPress.',
    'results': [{'file': name, 'url': f'results/{name}'} for name in targets]
}
MANUAL_JSON.write_text(json.dumps(manual, indent=2) + '\n', encoding='utf-8')

new_renderer = r'''function renderResults(rows){
const periods=[];
periods.push({financialYear:'2026-2027',q1:null,q2:null,q3:null,q4:null,current:true});
for(let fy=2025;fy>=2017;fy--){
 const next=fy+1;
 periods.push({financialYear:`${fy}-${String(next).slice(-2)}`,q1:`Jun-${String(fy).slice(-2)}`,q2:`Sep-${String(fy).slice(-2)}`,q3:`Dec-${String(fy).slice(-2)}`,q4:`Mar-${String(next).slice(-2)}`});
}
const archive=(label)=>`<a class="result-link result-placeholder" href="${esc(`results/${label}.pdf`)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${esc(label)} financial result PDF">${esc(label)}</a>`;
const cell=(label,current)=>current?'<span class="result-empty">Not filed</span>':archive(label);
resultsView.innerHTML=`<table class="results-table"><thead><tr><th>Financial Year</th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th></tr></thead><tbody>${periods.map(row=>`<tr><td>${esc(row.financialYear)}</td><td>${cell(row.q1,row.current)}</td><td>${cell(row.q2,row.current)}</td><td>${cell(row.q3,row.current)}</td><td>${cell(row.q4,row.current)}</td></tr>`).join('')}</tbody></table><div class="results-foot">Historical financial results are maintained in the Company's independent archive. Result PDFs are served locally and are not dependent on BSE or WordPress.</div>`;
}'''

html = INVESTORS.read_text(encoding='utf-8')
start = html.find('function renderResults(rows){')
end = html.find('function pdfIcon', start)
if start < 0 or end < 0:
    raise SystemExit(f'Could not locate Results renderer: start={start}, end={end}')
html = html[:start] + new_renderer + html[end:]

old_hook = "if(isResults)resultsView.innerHTML='<div class=\"feed-empty\">Loading exchange financial results…</div>';"
new_hook = "if(isResults){status.innerHTML='Source: <strong>Company Archive</strong> · Historical Results';renderResults([]);return;}"
if old_hook not in html:
    raise SystemExit('Could not locate Results load hook')
html = html.replace(old_hook, new_hook, 1)

css = '''\n<style id="results-archive-layout">\n.result-link.result-placeholder::before{display:none!important}\n.result-link.result-placeholder{font-size:13px;font-weight:600;color:#0969e8;text-decoration:none;cursor:pointer}\n.result-link.result-placeholder:hover{text-decoration:underline}\n.results-table th,.results-table td{min-width:110px}\n.results-table th:first-child,.results-table td:first-child{min-width:150px}\n</style>\n'''
if 'id="results-archive-layout"' not in html:
    html = html.replace('</head>', css + '</head>', 1)

INVESTORS.write_text(html, encoding='utf-8')
print(f'Archived {len(targets)} supplied financial-result PDFs and updated Results renderer.')
