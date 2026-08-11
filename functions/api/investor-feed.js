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
  return {
    id: String(id),
    title,
    date: clean(rawDate) || '',
    category: classify(title),
    pdf: attachmentUrl(attachment, rawDate),
    bse: /^https?:\/\//i.test(String(bseLink || '')) ? bseLink : 'https://www.bseindia.com/corporates/ann.html',
    source: 'BSE'
  };
}
export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const from = url.searchParams.get('from') || '20200101';
  const to = url.searchParams.get('to') || new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const category = url.searchParams.get('category') || '';
  const query = (url.searchParams.get('q') || '').trim().toLowerCase();
  const params = new URLSearchParams({pageno:String(page),strCat:'-1',strPrevDate:from,strScrip:'503663',strSearch:'P',strToDate:to,strType:'C',subcategory:''});
  try {
    const response = await fetch(`${BSE_API}?${params.toString()}`, {headers:{'Accept':'application/json, text/plain, */*','Referer':'https://www.bseindia.com/corporates/ann.html','User-Agent':'Mozilla/5.0 (compatible; TilakVenturesInvestorRelations/1.0)'},cf:{cacheTtl:300,cacheEverything:true}});
    if (!response.ok) throw new Error(`BSE responded with ${response.status}`);
    const payload = await response.json();
    const rows = Array.isArray(payload?.Table) ? payload.Table.map(normalise) : [];
    const filtered = rows.filter(item => (!category || item.category === category) && (!query || item.title.toLowerCase().includes(query)));
    const total = Number(payload?.Table1?.[0]?.ROWCNT || payload?.Table1?.[0]?.RowCnt || rows.length || 0);
    return Response.json({source:'BSE Limited',scripCode:'503663',company:'Tilak Ventures Limited',page,total,items:filtered,fetchedAt:new Date().toISOString()},{headers:{'Cache-Control':'public, max-age=120, s-maxage=300, stale-while-revalidate=600'}});
  } catch (error) {
    return Response.json({source:'BSE Limited',scripCode:'503663',company:'Tilak Ventures Limited',error:'BSE investor data is temporarily unavailable.',details:error instanceof Error ? error.message : String(error),items:[]},{status:502,headers:{'Cache-Control':'no-store'}});
  }
}
