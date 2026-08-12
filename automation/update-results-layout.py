from pathlib import Path
import hashlib
import json
import shutil

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

# Search the entire existing repository for exact byte-for-byte matches to the
# supplied PDFs. This keeps the archive independent of BSE/WordPress while
# allowing previously archived company documents to be reused.
found = {}
for path in ROOT.rglob('*.pdf'):
    if path.parts and path.parts[0] == 'results':
        continue
    digest = digest_file(path)
    if digest in targets.values():
        found[digest] = path

missing = [name for name, digest in targets.items() if digest not in found]
if missing:
    raise SystemExit('Missing supplied result PDFs in repository archive: ' + ', '.join(missing))

RESULTS_DIR.mkdir(exist_ok=True)
for name, digest in targets.items():
    shutil.copyfile(found[digest], RESULTS_DIR / name)

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
