from pathlib import Path
import calendar
import hashlib
import json
import shutil
import time
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

found = {}
for path in ROOT.rglob('*.pdf'):
    if path.parts and path.parts[0] == 'results':
        continue
    digest = digest_file(path)
    if digest in targets.values():
        found[digest] = path


def period_window(name):
    month, yy = name[:-4].split('-')
    year = 2000 + int(yy)
    if month == 'Jun':
        return f'{year}0601', f'{year}0831'
    if month == 'Sep':
        return f'{year}0901', f'{year}1130'
    if month == 'Dec':
        end_year = year + 1
        end_day = calendar.monthrange(end_year, 2)[1]
        return f'{year}1201', f'{end_year}02{end_day:02d}'
    if month == 'Mar':
        return f'{year}0301', f'{year}0531'
    raise ValueError(name)

missing = [name for name, digest in targets.items() if digest not in found]
if missing:
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/134 Safari/537.36',
        'Referer': 'https://www.bseindia.com/corporates/ann.html',
        'Accept': 'application/json, text/plain, */*',
    })
    RESULTS_DIR.mkdir(exist_ok=True)

    for name in list(missing):
        start, end = period_window(name)
        rows = []
        try:
            for page in range(1, 21):
                query = {
                    'pageno': page,
                    'strCat': '-1',
                    'strPrevDate': start,
                    'strScrip': '503663',
                    'strSearch': 'P',
                    'strToDate': end,
                    'strType': 'C',
                    'subcategory': '',
                }
                response = session.get(
                    'https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w',
                    params=query,
                    timeout=30,
                )
                response.raise_for_status()
                batch = response.json().get('Table') or []
                rows.extend(batch)
                if not batch or len(batch) < 50:
                    break
        except Exception as exc:
            print('BSE lookup failed', name, exc)
            continue

        candidates = []
        for row in rows:
            text = ' '.join(str(row.get(key, '')) for key in (
                'NEWSSUB', 'HEADLINE', 'CATEGORYNAME', 'SUBCATNAME', 'NEWS_DT'
            )).lower()
            attachment = row.get('ATTACHMENTNAME')
            if attachment and any(term in text for term in (
                'result', 'financial result', 'financial', 'quarter', 'audited', 'unaudited'
            )):
                candidates.append(row)

        candidates.sort(key=lambda row: (
            'financial result' not in ' '.join(str(row.get(k, '')) for k in ('NEWSSUB', 'HEADLINE')).lower(),
            'result' not in ' '.join(str(row.get(k, '')) for k in ('NEWSSUB', 'HEADLINE')).lower(),
        ))

        chosen = None
        for row in candidates:
            attachment = row.get('ATTACHMENTNAME')
            for base in (
                'https://www.bseindia.com/xml-data/corpfiling/AttachHis/',
                'https://www.bseindia.com/xml-data/corpfiling/AttachLive/',
            ):
                try:
                    pdf = session.get(base + attachment, timeout=45)
                    if pdf.status_code != 200 or not pdf.content.startswith(b'%PDF'):
                        continue
                    if hashlib.sha256(pdf.content).hexdigest() == targets[name]:
                        chosen = pdf.content
                        break
                except Exception:
                    continue
            if chosen is not None:
                break

        if chosen is not None:
            destination = RESULTS_DIR / name
            destination.write_bytes(chosen)
            found[targets[name]] = destination
            print('Archived exact BSE result filing', name)
        else:
            print('Exact BSE filing not found for', name)
        time.sleep(0.25)

RESULTS_DIR.mkdir(exist_ok=True)
for name, digest in targets.items():
    if digest not in found:
        continue
    destination = RESULTS_DIR / name
    source = found[digest]
    if source.resolve() != destination.resolve():
        shutil.copyfile(source, destination)

available = [
    {'file': name, 'url': f'results/{name}', 'sha256': digest_file(RESULTS_DIR / name)}
    for name in targets
    if (RESULTS_DIR / name).exists()
]
MANUAL_JSON.write_text(
    json.dumps({
        'policy': 'Static Company Archive. Historical result PDFs are stored locally in /results and are independent of BSE and WordPress.',
        'results': available,
        'pending_exact_matches': [name for name, digest in targets.items() if digest not in found],
    }, indent=2) + '\n',
    encoding='utf-8',
)

new_renderer = r'''function renderResults(rows){
const periods=[{financialYear:'2026-2027',q1:null,q2:null,q3:null,q4:null,current:true}];
for(let fy=2025;fy>=2017;fy--){const next=fy+1;periods.push({financialYear:`${fy}-${String(next).slice(-2)}`,q1:`Jun-${String(fy).slice(-2)}`,q2:`Sep-${String(fy).slice(-2)}`,q3:`Dec-${String(fy).slice(-2)}`,q4:`Mar-${String(next).slice(-2)}`});}
const archive=l=>`<a class="result-link result-placeholder" href="${esc(`results/${l}.pdf`)}" target="_blank" rel="noopener noreferrer">${esc(l)}</a>`;
const cell=(l,c)=>c?'<span class="result-empty">Not filed</span>':archive(l);
resultsView.innerHTML=`<table class="results-table"><thead><tr><th>Financial Year</th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th></tr></thead><tbody>${periods.map(r=>`<tr><td>${esc(r.financialYear)}</td><td>${cell(r.q1,r.current)}</td><td>${cell(r.q2,r.current)}</td><td>${cell(r.q3,r.current)}</td><td>${cell(r.q4,r.current)}</td></tr>`).join('')}</tbody></table><div class="results-foot">Historical financial results are maintained in the Company's independent archive. Result PDFs are served locally and are not dependent on BSE or WordPress.</div>`;
}'''

html = INVESTORS.read_text(encoding='utf-8')
a = html.find('function renderResults(rows){')
b = html.find('function pdfIcon', a)
if a < 0 or b < 0:
    raise SystemExit('Could not locate Results renderer')
html = html[:a] + new_renderer + html[b:]
old = 'if(isResults)resultsView.innerHTML=\'<div class="feed-empty">Loading exchange financial results…</div>\';'
new = "if(isResults){status.innerHTML='Source: <strong>Company Archive</strong> · Historical Results';renderResults([]);return;}"
if old not in html:
    raise SystemExit('Could not locate Results load hook')
html = html.replace(old, new, 1)
if 'id="results-archive-layout"' not in html:
    html = html.replace('</head>', '<style id="results-archive-layout">.result-link.result-placeholder::before{display:none!important}.result-link.result-placeholder{font-size:13px;font-weight:600;color:#0969e8;text-decoration:none;cursor:pointer}.result-link.result-placeholder:hover{text-decoration:underline}.results-table th,.results-table td{min-width:110px}.results-table th:first-child,.results-table td:first-child{min-width:150px}</style></head>', 1)
INVESTORS.write_text(html, encoding='utf-8')
