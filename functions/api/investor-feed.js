const BSE_API = 'https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w';
const BSE_LIVE_ATTACH = 'https://www.bseindia.com/xml-data/corpfiling/AttachLive/';
const BSE_HISTORY_ATTACH = 'https://www.bseindia.com/xml-data/corpfiling/AttachHis/';

function clean(value) {
  return typeof value === 'string' ? value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : value;
}
function pick(row, keys) {
  for (const key of keys) {
    if (row && row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') return row[key];
  }
  return '';
}
function attachmentUrl(name, dateValue) {
  if (!name) return null;
  const value = String(name).trim();
  if (/^https?:\/\//i.test(value)) return value;
  const parsed = new Date(String(dateValue || '').replace('T', ' '));
  const isHistorical = !Number.isNaN(parsed.getTime()) && parsed.getTime() < Date.now() - 24 * 60 * 60 * 1000;
  const base = isHistorical ? BSE_HISTORY_ATTACH : BSE_LIVE_ATTACH;
  return `${base}${value.replace(/^\/+/, '')}`;
}
function classify(title) {
  const t = String(title || '').toLowerCase();
  if (/sdd|structured digital database/.test(t)) return 'SDD Shareholding Pattern';
  if (/shareholding|share holders? pattern|specified securities/.test(t)) return 'Shareholding Pattern';
  if (/annual report|annual accounts/.test(t)) return 'Annual Reports';
  if (/financial results|audited results|unaudited results|quarter ended|half year ended|standalone.*results|consolidated.*results/.test(t)) return 'Financial Results';
  if (/board meeting|meeting of the board/.test(t)) return 'Board Meetings';
  if (/annual general meeting|extraordinary general meeting|agm|egm|notice of meeting|scrutinizer|voting results/.test(t)) return 'Shareholders Meetings';
  if (/dividend|bonus|rights issue|buyback|split|sub-division|consolidation|record date|corporate action/.test(t)) return 'Corporate Actions';
  if (/investor complaint|investor grievance|complaints/.test(t)) return 'Investor Complaints';
  if (/bulk deal|block deal|bulk\/block/.test(t)) return 'Bulk / Block Deals';
  if (/related party/.test(t)) return 'Related Party Transactions';
  if (/brsr|business responsibility/.test(t)) return 'BRSR';
  if (/annual secretarial compliance|ascr|secretarial compliance/.test(t)) return 'ASCR';
  if (/integrated filing|deviation|variation/.test(t)) return 'Integrated Filings';
  if (/corporate governance|governance report/.test(t)) return 'Corporate Governance';
  return 'Corporate Announcements';
}
function normalise(row) {
  const title = clean(pick(row, ['NEWSSUB', 'HEADLINE', 'NEWS_SUB', 'NEWS_DESC', 'SUBJECT'])) || 'BSE filing';
  const rawDate = pick(row, ['NEWS_DT', 'NEWS_DATE', 'DT_TM', 'DATE', 'News_submission_dt']);
  const attachment = pick(row, ['ATTACHMENTNAME', 'ATTACHMENT', 'ATTACHMENT_NAME']);
  const id = pick(row, ['NEWSID', 'NEWS_ID', 'SLNO', 'SCRIP_CD']) || `${title}-${rawDate}`;
  const bseLink = pick(row, ['NEWS_LINK', 'NEWSLINK', 'LINK', 'URL']);
  return { id: String(id), title, date: clean(rawDate) || '', category: classify(title), pdf: attachmentUrl(attachment, rawDate), bse: /^https?:\/\//i.test(String(bseLink || '')) ? bseLink : 'https://www.bseindia.com/corporates/ann.html', source: 'BSE' };
}

function resultQuarter(item) {
  const text = `${item.title || ''} ${item.date || ''}`.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  const patterns = [
    { q: 'Q1', endMonth: 6, re: /(?:quarter|three months|3 months)[^\d]{0,100}(?:ended|ending)[^\d]{0,30}(?:30|29|28)[.\/-]0?6[.\/-](20\d{2})/i },
    { q: 'Q2', endMonth: 9, re: /(?:quarter|three months|6 months|half year)[^\d]{0,120}(?:ended|ending)[^\d]{0,30}(?:30|29)[.\/-]0?9[.\/-](20\d{2})/i },
    { q: 'Q3', endMonth: 12, re: /(?:quarter|three months|nine months)[^\d]{0,120}(?:ended|ending)[^\d]{0,30}(?:31|30)[.\/-]12[.\/-](20\d{2})/i },
    { q: 'Q4', endMonth: 3, re: /(?:quarter|three months|year)[^\d]{0,120}(?:ended|ending)[^\d]{0,30}(?:31|30)[.\/-]0?3[.\/-](20\d{2})/i },
    { q: 'Q1', endMonth: 6, re: /(?:june|jun)[\s,.-]*(?:30|29|28)(?:st|th|nd|rd)?[\s,.-]+(20\d{2})/i },
    { q: 'Q2', endMonth: 9, re: /(?:september|sep)[\s,.-]*(?:30|29)(?:st|th|nd|rd)?[\s,.-]+(20\d{2})/i },
    { q: 'Q3', endMonth: 12, re: /(?:december|dec)[\s,.-]*(?:31|30)(?:st|th|nd|rd)?[\s,.-]+(20\d{2})/i },
    { q: 'Q4', endMonth: 3, re: /(?:march|mar)[\s,.-]*(?:31|30)(?:st|th|nd|rd)?[\s,.-]+(20\d{2})/i },
    { q: 'Q1', endMonth: 6, re: /(?:30|29|28)(?:st|th|nd|rd)?[.\/-]0?6[.\/-](20\d{2})/i },
    { q: 'Q2', endMonth: 9, re: /(?:30|29)(?:st|th|nd|rd)?[.\/-]0?9[.\/-](20\d{2})/i },
    { q: 'Q3', endMonth: 12, re: /(?:31|30)(?:st|th|nd|rd)?[.\/-]12[.\/-](20\d{2})/i },
    { q: 'Q4', endMonth: 3, re: /(?:31|30)(?:st|th|nd|rd)?[.\/-]0?3[.\/-](20\d{2})/i }
  ];
  for (const p of patterns) {
    const match = text.match(p.re);
    if (match) return { quarter: p.q, endYear: Number(match[1]), endMonth: p.endMonth };
  }
  return null;
}
function financialYear(quarter, endYear) {
  if (!quarter || !endYear) return '';
  const start = quarter === 'Q4' ? endYear - 1 : endYear;
  return `${start}-${start + 1}`;
}
function resultRows(items) {
  const groups = new Map();
  for (const item of items) {
    const parsed = resultQuarter(item);
    if (!parsed) continue;
    const fy = financialYear(parsed.quarter, parsed.endYear);
    if (!fy) continue;
    const key = `${fy}|${parsed.quarter}`;
    const current = groups.get(key);
    const currentTime = current ? new Date(String(current.date).replace('T', ' ')).getTime() : -Infinity;
    const itemTime = new Date(String(item.date).replace('T', ' ')).getTime();
    if (!current || itemTime > currentTime) groups.set(key, { ...item, fiscalYear: fy, quarter: parsed.quarter, period: `${parsed.quarter}-${String(parsed.endYear).slice(-2)}` });
  }
  const byYear = new Map();
  for (const item of groups.values()) {
    if (!byYear.has(item.fiscalYear)) byYear.set(item.fiscalYear, { financialYear: item.fiscalYear, q1: null, q2: null, q3: null, q4: null, h: null, y: null });
    const row = byYear.get(item.fiscalYear);
    row[item.quarter.toLowerCase()] = item;
    if (item.quarter === 'Q2' && /half|six months|half year/i.test(item.title)) row.h = item;
    if (item.quarter === 'Q4' && /year ended|annual|audited/i.test(item.title)) row.y = item;
  }
  for (const row of byYear.values()) {
    if (!row.h) row.h = row.q2;
    if (!row.y) row.y = row.q4;
  }
  return [...byYear.values()].sort((a, b) => b.financialYear.localeCompare(a.financialYear));
}
async function fetchPage(page, from, to) {
  const params = new URLSearchParams({ pageno: String(page), strCat: '-1', strPrevDate: from, strScrip: '503663', strSearch: 'P', strToDate: to, strType: 'C', subcategory: '' });
  const response = await fetch(`${BSE_API}?${params.toString()}`, { headers: { Accept: 'application/json, text/plain, */*', Referer: 'https://www.bseindia.com/corporates/ann.html', 'User-Agent': 'Mozilla/5.0 (compatible; TilakVenturesInvestorRelations/1.0)' }, cf: { cacheTtl: 300, cacheEverything: true } });
  if (!response.ok) throw new Error(`BSE responded with ${response.status}`);
  return response.json();
}
export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const from = url.searchParams.get('from') || '20140101';
  const to = url.searchParams.get('to') || new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const category = url.searchParams.get('category') || '';
  const query = (url.searchParams.get('q') || '').trim().toLowerCase();
  const pageCount = category === 'Financial Results' ? 15 : 1;
  try {
    const payloads = await Promise.all(Array.from({ length: pageCount }, (_, i) => fetchPage(i + 1, from, to)));
    const rows = payloads.flatMap(payload => Array.isArray(payload?.Table) ? payload.Table.map(normalise) : []);
    const unique = [...new Map(rows.map(item => [item.id, item])).values()];
    const filtered = unique.filter(item => (!category || item.category === category) && (!query || item.title.toLowerCase().includes(query)));
    const total = Number(payloads[0]?.Table1?.[0]?.ROWCNT || payloads[0]?.Table1?.[0]?.RowCnt || filtered.length || 0);
    const results = category === 'Financial Results' ? resultRows(filtered) : [];
    const pageSize = 20;
    const items = category === 'Financial Results' ? results.slice((page - 1) * pageSize, page * pageSize) : filtered.slice((page - 1) * pageSize, page * pageSize);
    return Response.json({ source: 'BSE Limited', scripCode: '503663', company: 'Tilak Ventures Limited', page, total: category === 'Financial Results' ? results.length : total, items, results: category === 'Financial Results' ? results : undefined, fetchedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'public, max-age=120, s-maxage=300, stale-while-revalidate=600' } });
  } catch (error) {
    return Response.json({ source: 'BSE Limited', scripCode: '503663', company: 'Tilak Ventures Limited', error: 'BSE investor data is temporarily unavailable.', details: error instanceof Error ? error.message : String(error), items: [], results: [] }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
