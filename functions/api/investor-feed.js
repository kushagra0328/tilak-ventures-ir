const BSE_API = 'https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w';
const BSE_LIVE_ATTACH = 'https://www.bseindia.com/xml-data/corpfiling/AttachLive/';
const BSE_HISTORY_ATTACH = 'https://www.bseindia.com/xml-data/corpfiling/AttachHis/';
const BSE_SCRIP_CODE = '503663';
const BSE_ISIN = 'INE026L01022';
const BSE_COMPANY_NAME = 'Tilak Ventures Limited';

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
  return `${isHistorical ? BSE_HISTORY_ATTACH : BSE_LIVE_ATTACH}${value.replace(/^\/+/, '')}`;
}

function classify(title) {
  const t = String(title || '').toLowerCase();
  if (/sdd|structured digital database/.test(t)) return 'SDD Shareholding Pattern';
  if (/shareholding|share holders? pattern|specified securities/.test(t)) return 'Shareholding Pattern';
  if (/annual report|annual accounts/.test(t)) return 'Annual Reports';
  if (/financial results|audited results|unaudited results|financial result|quarter ended|half year ended|standalone.*results|consolidated.*results/.test(t)) return 'Financial Results';
  if (/board meeting|meeting of the board/.test(t)) return 'Board Meetings';
  if (/annual general meeting|extraordinary general meeting|agm|egm|notice of meeting|scrutinizer|voting results|voting result|postal ballot/.test(t)) return 'Shareholders Meetings';
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
  const rawDate = pick(row, ['NEWS_DT', 'NEWS_DATE', 'DT_TM', 'DATE', 'News_submission_dt', 'DissemDT']);
  const attachment = pick(row, ['ATTACHMENTNAME', 'ATTACHMENT', 'ATTACHMENT_NAME']);
  const id = pick(row, ['NEWSID', 'NEWS_ID', 'SLNO', 'NewsID']) || `${title}-${rawDate}`;
  const bseLink = pick(row, ['NEWS_LINK', 'NEWSLINK', 'LINK', 'URL']);
  return {
    id: String(id),
    title,
    date: clean(rawDate) || '',
    category: classify(title),
    status: clean(pick(row, ['STATUS', 'Status', 'FILING_STATUS', 'STATUS_DESC'])) || (/revised|revision|corrected/i.test(title) ? 'Revised' : 'New'),
    revisedDate: clean(pick(row, ['REVISED_DATE_TIME', 'REVISED_DT', 'REVISION_DATE', 'REVISED_DT_TM'])) || '',
    revisionReason: clean(pick(row, ['REVISION_REASON', 'REASON', 'REV_REASON'])) || '',
    meetingDate: clean(pick(row, ['MEETING_DATE', 'MEETING_DT', 'MEETINGDATE'])) || '',
    meetingType: clean(pick(row, ['MEETING_TYPE', 'MEETINGTYPE', 'TYPE'])) || '',
    resolutionType: clean(pick(row, ['RESOLUTION_TYPE', 'RESOLUTIONTYPE'])) || '',
    resolution: clean(pick(row, ['RESOLUTION', 'RESOLUTION_DESC', 'RESOLUTION_DESCRIPTION'])) || '',
    quarter: clean(pick(row, ['QUARTER', 'Quarter'])) || '',
    xbrl: clean(pick(row, ['XBRL', 'XBRL_LINK', 'XBRLLINK', 'XBRLURL'])) || '',
    pdf: attachmentUrl(attachment, rawDate),
    bse: /^https?:\/\//i.test(String(bseLink || '')) ? bseLink : 'https://www.bseindia.com/corporates/ann.html',
    source: 'BSE'
  };
}

function periodFromDateText(value) {
  const text = String(value || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  const monthMap = {
    jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
    may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8,
    sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11,
    dec: 12, december: 12
  };
  const monthNames = Object.keys(monthMap).join('|');

  const monthFirst = text.match(new RegExp(`\\b(${monthNames})\\b[\\s,.-]+(?:0?[1-9]|[12]\\d|3[01])(?:st|nd|rd|th)?[\\s,.-]+(20\\d{2})`, 'i'));
  if (monthFirst) return { endMonth: monthMap[monthFirst[1].toLowerCase()], endYear: Number(monthFirst[2]) };

  const dayFirst = text.match(new RegExp(`\\b(?:0?[1-9]|[12]\\d|3[01])(?:st|nd|rd|th)?[\\s,.-]+(${monthNames})[\\s,.-]+(20\\d{2})`, 'i'));
  if (dayFirst) return { endMonth: monthMap[dayFirst[1].toLowerCase()], endYear: Number(dayFirst[2]) };

  const numeric = text.match(/\\b(?:0?[1-9]|[12]\\d|3[01])[.\\/-](0?[1-9]|1[0-2])[.\\/-](20\\d{2})\\b/);
  if (numeric) return { endMonth: Number(numeric[1]), endYear: Number(numeric[2]) };

  return null;
}

function resultQuarter(item) {
  const title = String(item.title || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  const apiQuarter = String(item.quarter || '').trim().toUpperCase();
  const apiMatch = apiQuarter.match(/^Q([1-4])$/);
  if (apiMatch) {
    const q = `Q${apiMatch[1]}`;
    const yearMatch = title.match(/\b(20\d{2})\b/);
    if (yearMatch) return { quarter: q, endYear: Number(yearMatch[1]), endMonth: { Q1: 6, Q2: 9, Q3: 12, Q4: 3 }[q] };
  }

  // BSE result titles commonly use both formats:
  // “ended 30th September 2025” and “ended September 30, 2025”.
  // Read only the date immediately following an “ended/ending” phrase so the
  // filing publication date cannot be mistaken for the financial period.
  const ended = title.match(/(?:quarter|three months|3 months|six months|6 months|half year|nine months|9 months|year|financial year|period|results?)[\s\S]{0,220}?(?:ended|ending)\s+(?:on\s+)?([^;|]+?)(?=\s+(?:and|for the|with|as on)\b|$)/i);
  const period = periodFromDateText(ended ? ended[1] : title);
  if (!period) return null;

  const quarterByMonth = { 6: 'Q1', 9: 'Q2', 12: 'Q3', 3: 'Q4' };
  const quarter = quarterByMonth[period.endMonth];
  if (!quarter) return null;
  return { quarter, endYear: period.endYear, endMonth: period.endMonth };
}

function financialYear(quarter, endYear) {
  if (!quarter || !endYear) return '';
  const start = quarter === 'Q4' ? endYear - 1 : endYear;
  return `${start}-${start + 1}`;
}

function filingTime(item) {
  const t = new Date(String(item?.date || '').replace('T', ' ')).getTime();
  return Number.isFinite(t) ? t : -Infinity;
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
    // Keep the latest BSE filing for each financial-year/quarter combination.
    if (!current || filingTime(item) > filingTime(current)) {
      groups.set(key, { ...item, financialYear: fy, fiscalYear: fy, quarter: parsed.quarter, periodEndYear: parsed.endYear, periodEndMonth: parsed.endMonth });
    }
  }

  const byYear = new Map();
  for (const item of groups.values()) {
    if (!byYear.has(item.fiscalYear)) {
      byYear.set(item.fiscalYear, { financialYear: item.fiscalYear, q1: null, q2: null, q3: null, q4: null, h: null, y: null });
    }
    const row = byYear.get(item.fiscalYear);
    row[item.quarter.toLowerCase()] = item;
    if (item.quarter === 'Q2' && /half|six months|half year/i.test(item.title)) row.h = item;
    if (item.quarter === 'Q4' && /year ended|annual|audited/i.test(item.title)) row.y = item;
  }

  // BSE commonly publishes the half-year result with Q2 and the full-year
  // result with Q4. Use those exact BSE filings for H and Y when dedicated
  // labels are not present; never invent a filing or a PDF URL.
  for (const row of byYear.values()) {
    if (!row.h) row.h = row.q2;
    if (!row.y) row.y = row.q4;
  }

  const now = new Date();
  const currentFyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const rows = [];
  for (let start = currentFyStart; start >= 2017; start -= 1) {
    rows.push(byYear.get(`${start}-${start + 1}`) || {
      financialYear: `${start}-${start + 1}`,
      q1: null, q2: null, q3: null, q4: null, h: null, y: null
    });
  }
  return rows;
}

function annualYear(item) {
  const years = [...String(item.title || '').matchAll(/20\d{2}/g)].map(m => Number(m[0]));
  if (years.length) return Math.max(...years);
  const d = new Date(String(item.date || '').replace('T', ' '));
  return Number.isNaN(d.getTime()) ? 0 : d.getFullYear();
}

function annualRows(items) {
  const map = new Map();
  for (const item of items.filter(x => /annual report|annual accounts/i.test(x.title))) {
    const year = annualYear(item);
    if (!year) continue;
    const current = map.get(year);
    if (!current || filingTime(item) > filingTime(current)) map.set(year, { ...item, year });
  }
  return [...map.values()].sort((a, b) => b.year - a.year);
}

function votingRows(items) {
  return items.filter(item => /voting result|voting results|disclosure of voting|postal ballot/i.test(item.title)).map(item => {
    const meetingMatch = String(item.title).match(/(?:agm|annual general meeting|egm|extra-ordinary general meeting)[^\d]*(\d{1,2}(?:st|nd|rd|th)?[ .\/-]+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[ .\/-]+20\d{2})/i);
    const meetingDate = item.meetingDate || (meetingMatch ? meetingMatch[1] : '—');
    const meetingType = item.meetingType || (/egm|extra-ordinary|extraordinary/i.test(item.title) ? 'EGM' : /postal ballot/i.test(item.title) ? 'Postal Ballot' : 'AGM');
    const resolution = item.resolution || item.title.replace(/^.*?503663\s*-\s*/i, '').replace(/^.*?Voting Results?\s*(?:For|Of)\s*/i, '');
    return { ...item, meetingDate, meetingType, resolutionType: item.resolutionType || '—', resolution, quarter: item.quarter || '', xbrl: item.xbrl || '' };
  });
}

function parseQuarterLabel(value, title) {
  const source = `${value || ''} ${title || ''}`;
  const month = source.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i);
  const year = source.match(/\b(20\d{2})\b/);
  if (!month || !year) return clean(value) || '';
  const names = { jan: 'January', january: 'January', feb: 'February', february: 'February', mar: 'March', march: 'March', apr: 'April', april: 'April', may: 'May', jun: 'June', june: 'June', jul: 'July', july: 'July', aug: 'August', august: 'August', sep: 'September', september: 'September', oct: 'October', october: 'October', nov: 'November', november: 'November', dec: 'December', december: 'December' };
  return `${names[month[1].toLowerCase()]} ${year[1]}`;
}

function shareholdingRows(items) {
  const monthNo = { January: 1, February: 2, March: 3, April: 4, May: 5, June: 6, July: 7, August: 8, September: 9, October: 10, November: 11, December: 12 };
  return items.filter(item => item.category === 'Shareholding Pattern').map(item => {
    const quarter = parseQuarterLabel(item.quarter, item.title);
    const match = quarter.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})$/);
    const month = match ? monthNo[match[1]] : 0;
    const year = match ? Number(match[2]) : 0;
    const fyStart = year ? (month <= 3 ? year - 1 : year) : 0;
    return { ...item, shareholdingYear: fyStart ? `${fyStart} - ${fyStart + 1}` : '—', shareholdingQuarter: quarter || '—', _quarterSort: year * 100 + month };
  }).sort((a, b) => b._quarterSort - a._quarterSort || filingTime(b) - filingTime(a));
}

async function fetchPage(page, from, to) {
  const params = new URLSearchParams({
    pageno: String(page),
    strCat: '-1',
    strPrevDate: from,
    strScrip: BSE_SCRIP_CODE,
    strSearch: 'P',
    strToDate: to,
    strType: 'C',
    subcategory: ''
  });
  const response = await fetch(`${BSE_API}?${params.toString()}`, {
    headers: {
      Accept: 'application/json, text/plain, */*',
      Referer: 'https://www.bseindia.com/corporates/ann.html',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36'
    },
    cf: { cacheTtl: 300, cacheEverything: true }
  });
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
  const pageCount = category === 'Financial Results' ? 30 : category === 'Annual Reports' ? 40 : category === 'Shareholding Pattern' ? 20 : 8;

  try {
    const payloads = await Promise.all(Array.from({ length: pageCount }, (_, i) => fetchPage(i + 1, from, to)));
    const rows = payloads.flatMap(payload => Array.isArray(payload?.Table) ? payload.Table.map(normalise) : []);
    const unique = [...new Map(rows.map(item => [item.id, item])).values()];
    const filtered = category === 'Financial Results'
      ? unique.filter(item => item.category === 'Financial Results' && (!query || item.title.toLowerCase().includes(query)))
      : unique.filter(item => (!category || item.category === category) && (!query || item.title.toLowerCase().includes(query)));
    const total = Number(payloads[0]?.Table1?.[0]?.ROWCNT || payloads[0]?.Table1?.[0]?.RowCnt || filtered.length || 0);
    const results = category === 'Financial Results' ? resultRows(filtered) : [];
    const annual = category === 'Annual Reports' ? annualRows(filtered) : [];
    const voting = category === 'Shareholders Meetings' && query === 'voting' ? votingRows(filtered) : [];
    const shareholding = category === 'Shareholding Pattern' ? shareholdingRows(filtered) : [];
    const pageSize = 20;
    const items = category === 'Financial Results'
      ? results.slice((page - 1) * pageSize, page * pageSize)
      : category === 'Annual Reports'
        ? annual.slice((page - 1) * pageSize, page * pageSize)
        : voting.length
          ? voting.slice((page - 1) * pageSize, page * pageSize)
          : category === 'Shareholding Pattern'
            ? shareholding.slice((page - 1) * pageSize, page * pageSize)
            : filtered.slice((page - 1) * pageSize, page * pageSize);

    return Response.json({
      source: 'BSE Limited',
      scripCode: BSE_SCRIP_CODE,
      isin: BSE_ISIN,
      company: BSE_COMPANY_NAME,
      page,
      total: category === 'Financial Results' ? results.length : category === 'Annual Reports' ? annual.length : category === 'Shareholding Pattern' ? shareholding.length : voting.length || total,
      items,
      results: category === 'Financial Results' ? results : undefined,
      annualReports: category === 'Annual Reports' ? annual : undefined,
      votingResults: voting.length ? voting : undefined,
      shareholdingPatterns: category === 'Shareholding Pattern' ? shareholding : undefined,
      fetchedAt: new Date().toISOString()
    }, { headers: { 'Cache-Control': 'public, max-age=120, s-maxage=300, stale-while-revalidate=600' } });
  } catch (error) {
    return Response.json({
      source: 'BSE Limited',
      scripCode: BSE_SCRIP_CODE,
      isin: BSE_ISIN,
      company: BSE_COMPANY_NAME,
      error: 'BSE investor data is temporarily unavailable.',
      details: error instanceof Error ? error.message : String(error),
      items: [], results: [], annualReports: [], votingResults: [], shareholdingPatterns: []
    }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
