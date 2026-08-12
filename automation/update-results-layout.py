from pathlib import Path

path = Path('investors.html')
html = path.read_text(encoding='utf-8')

new_renderer = r'''function renderResults(rows){
const startFY=2026;
const periods=[];
for(let fy=startFY;fy>=2017;fy--){
 const next=fy+1;
 periods.push({financialYear:`${fy}-${String(next).slice(-2)}`,q1:`Jun-${String(fy).slice(-2)}`,q2:`Sep-${String(fy).slice(-2)}`,q3:`Dec-${String(fy).slice(-2)}`,q4:`Mar-${String(next).slice(-2)}`});
}
const currentFY=2026;
const currentMonth=new Date().getMonth()+1;
const cell=(label,fy,quarter)=>{
 const quarterMonth={Q1:6,Q2:9,Q3:12,Q4:3}[quarter];
 const filed=fy<currentFY || (fy===currentFY && quarterMonth<=currentMonth);
 if(!filed)return '<span class="result-empty">Not filed</span>';
 return `<a class="result-link result-placeholder" href="#" data-result-slot="${esc(`${fy}-${quarter}`)}" aria-label="${esc(label)} — PDF to be uploaded">${esc(label)}</a>`;
};
resultsView.innerHTML=`<table class="results-table"><thead><tr><th>Financial Year</th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th></tr></thead><tbody>${periods.map(row=>`<tr><td>${esc(row.financialYear)}</td><td>${cell(row.q1,Number(row.financialYear.slice(0,4)),'Q1')}</td><td>${cell(row.q2,Number(row.financialYear.slice(0,4)),'Q2')}</td><td>${cell(row.q3,Number(row.financialYear.slice(0,4)),'Q3')}</td><td>${cell(row.q4,Number(row.financialYear.slice(0,4)),'Q4')}</td></tr>`).join('')}</tbody></table><div class="results-foot">Historical financial results are maintained in the Company archive. Quarter links are placeholders until the corresponding PDF is uploaded.</div>`;
}'''

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

path.write_text(html, encoding='utf-8')
print('Results archive layout updated successfully')
