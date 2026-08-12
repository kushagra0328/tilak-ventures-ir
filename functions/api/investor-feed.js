const BSE_API = 'https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w';
const BSE_API_FALLBACK = 'https://api.bseindia.com/BseIndiaAPI/api/AnnGetData/w';
const BSE_LIVE_ATTACH = 'https://www.bseindia.com/xml-data/corpfiling/AttachLive/';
const BSE_HISTORY_ATTACH = 'https://www.bseindia.com/xml-data/corpfiling/AttachHis/';
const BSE_XBRL = 'https://www.bseindia.com/Msource/90D/CorpXbrlGen.aspx';
const BSE_SCRIP_CODE = '503663';
const BSE_ISIN = 'INE026L01022';
const BSE_COMPANY_NAME = 'Tilak Ventures Limited';
const MONTHS = {jan:1,january:1,feb:2,february:2,mar:3,march:3,apr:4,april:4,may:5,jun:6,june:6,jul:7,july:7,aug:8,august:8,sep:9,sept:9,september:9,oct:10,october:10,nov:11,november:11,dec:12,december:12};

function clean(value){return typeof value==='string'?value.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim():value;}
function pick(row,keys){for(const key of keys){if(row&&row[key]!==undefined&&row[key]!==null&&String(row[key]).trim()!=='')return row[key];}return '';}
function dateValue(value){return new Date(String(value||'').replace('T',' ')).getTime();}
function filingTime(item){const t=dateValue(item?.date);return Number.isFinite(t)?t:-Infinity;}
function attachmentUrl(name,date){if(!name)return null;const value=String(name).trim();if(/^https?:\/\//i.test(value))return value;const t=dateValue(date);const historical=Number.isFinite(t)&&t<Date.now()-24*60*60*1000;return `${historical?BSE_HISTORY_ATTACH:BSE_LIVE_ATTACH}${value.replace(/^\/+/, '')}`;}
function xbrlUrl(newsId,scrip=BSE_SCRIP_CODE){return newsId?`${BSE_XBRL}?Bsenewid=${encodeURIComponent(newsId)}&Scripcode=${encodeURIComponent(scrip)}`:'';}

function classify(row,title){
  const category=String(pick(row,['CATEGORYNAME','CATEGORY_NAME','CategoryName','CATEGORY','CATEGORY_DESC'])).toLowerCase();
  const t=String(title||'').toLowerCase();
  if(/investor complaint|investor grievance|statement of investor complaints|complaints for the quarter/.test(t))return 'Investor Complaints';
  if(/related party|related-party|integrated filing.*finance/.test(category))return 'Related Party Transactions';
  if(/corporate governance|integrated filing.*governance|reg\.?\s*27/.test(category))return 'Corporate Governance';
  if(/result|financial result/.test(category))return 'Financial Results';
  if(/sdd|structured digital database/.test(t))return 'SDD Shareholding Pattern';
  if(/shareholding|share holders? pattern|specified securities/.test(t))return 'Shareholding Pattern';
  if(/annual report|annual accounts/.test(t))return 'Annual Reports';
  if(/financial results|audited results|unaudited results|financial result|quarter ended|half year ended|standalone.*results|consolidated.*results/.test(t))return 'Financial Results';
  if(/board meeting|meeting of the board/.test(t))return 'Board Meetings';
  if(/annual general meeting|extraordinary general meeting|agm|egm|notice of meeting|scrutinizer|voting results|voting result|postal ballot/.test(t))return 'Shareholders Meetings';
  if(/dividend|bonus|rights issue|buyback|split|sub-division|consolidation|record date|corporate action/.test(t))return 'Corporate Actions';
  if(/bulk deal|block deal|bulk\/block/.test(t))return 'Bulk / Block Deals';
  if(/related party|related-party/.test(t))return 'Related Party Transactions';
  if(/brsr|business responsibility/.test(t))return 'BRSR';
  if(/annual secretarial compliance|ascr|secretarial compliance/.test(t))return 'ASCR';
  if(/corporate governance|integrated filing.*governance|reg\.?\s*27|regulation\s*27|governance report|governance compliance|compliance report on corporate governance/.test(t))return 'Corporate Governance';
  if(/integrated filing.*finance/.test(t))return 'Related Party Transactions';
  if(/integrated filing/.test(t))return 'Integrated Filings';
  if(/deviation|variation/.test(t))return 'Statement of Deviation or Variation';
  return 'Corporate Announcements';
}

function normalise(row){
  const title=clean(pick(row,['NEWSSUB','HEADLINE','NEWS_SUB','NEWS_DESC','SUBJECT']))||'BSE filing';
  const rawDate=pick(row,['NEWS_DT','NEWS_DATE','DT_TM','DATE','News_submission_dt','DissemDT']);
  const attachment=pick(row,['ATTACHMENTNAME','ATTACHMENT','ATTACHMENT_NAME','PDF_ATTACHMENT','PDFATTACHMENT','PDF_NAME']);
  const newsId=pick(row,['NEWSID','NEWS_ID','NewsID']);
  const scrip=pick(row,['SCRIP_CD','SCRIPCODE','SCRIP_CODE'])||BSE_SCRIP_CODE;
  const bseLink=pick(row,['NSURL','NEWS_LINK','NEWSLINK','LINK','URL']);
  const status=clean(pick(row,['FILESTATUS','STATUS','Status','FILING_STATUS','STATUS_DESC']))||(/revised|revision|corrected/i.test(title)?'Revised':'New');
  const xbrlAttachment=pick(row,['XBRL_ATTACHMENT','XBRLATTACHMENT','XBRL_FILE','XBRLFILE','XBRL_NAME','XBRLNAME']);
  const xbrlDirect=pick(row,['XBRL_LINK','XBRL_LINK_URL','XBRLLINK','XBRL_URL','XBRLURL']);
  const xbrlDate=clean(pick(row,['XBRL_DATE_TIME','XBRL_DATE','XBRL_DT','XBRL_DT_TM','FILING_DATE_TIME_XBRL','FILINGDATETIME_XBRL','XBRL_FILING_DATE']))||clean(rawDate)||'';
  const xbrlRevisedDate=clean(pick(row,['XBRL_REVISED_DATE_TIME','XBRL_REVISED_DATE','XBRL_REVISED_DT','REVISED_FILING_DATE_TIME_XBRL','REVISED_DATE_TIME_XBRL']))||'';
  const pdfDate=clean(pick(row,['PDF_DATE_TIME','PDF_DATE','PDF_DT','FILING_DATE_TIME_PDF','FILINGDATETIME_PDF','PDF_FILING_DATE']))||clean(rawDate)||'';
  const pdfRevisedDate=clean(pick(row,['PDF_REVISED_DATE_TIME','PDF_REVISED_DATE','PDF_REVISED_DT','REVISED_FILING_DATE_TIME_PDF','REVISED_DATE_TIME_PDF']))||'';
  const revisionReason=clean(pick(row,['REVISION_REASON','REASON','REV_REASON','XBRL_REVISION_REASON','PDF_REVISION_REASON']))||'';
  const xbrl=xbrlDirect||attachmentUrl(xbrlAttachment,xbrlDate)||xbrlUrl(newsId,scrip);
  return {id:String(newsId||pick(row,['SLNO'])||`${title}-${rawDate}`),newsId:String(newsId||''),scripCode:String(scrip),title,date:clean(rawDate)||'',category:classify(row,title),status:/r|revis/i.test(status)?'Revised':'New',revisedDate:clean(pick(row,['REVISED_DATE_TIME','REVISED_DT','REVISION_DATE','REVISED_DT_TM']))||'',revisionReason,meetingDate:clean(pick(row,['MEETING_DATE','MEETING_DT','MEETINGDATE']))||'',meetingType:clean(pick(row,['MEETING_TYPE','MEETINGTYPE','TYPE']))||'',resolutionType:clean(pick(row,['RESOLUTION_TYPE','RESOLUTIONTYPE']))||'',resolution:clean(pick(row,['RESOLUTION','RESOLUTION_DESC','RESOLUTION_DESCRIPTION']))||'',quarter:clean(pick(row,['QUARTER','Quarter']))||'',pdf:attachmentUrl(attachment,pdfDate),xbrl,xbrlDate,xbrlRevisedDate,pdfDate,pdfRevisedDate,xbrlAttachment,pdfAttachment:attachment,bse:/^https?:\/\//i.test(String(bseLink||''))?bseLink:'https://www.bseindia.com/corporates/ann.html',source:'BSE'};
}

function periodFromText(value){
  const text=String(value||'').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
  const names=Object.keys(MONTHS).join('|');
  let m=text.match(new RegExp(`\\b(${names})\\b[\\s,.-]+(?:0?[1-9]|[12]\\d|3[01])(?:st|nd|rd|th)?[\\s,.-]+(20\\d{2})`,'i'));
  if(m)return{month:MONTHS[m[1].toLowerCase()],year:Number(m[2])};
  m=text.match(new RegExp(`\\b(?:0?[1-9]|[12]\\d|3[01])(?:st|nd|rd|th)?[\\s,.-]+(${names})[\\s,.-]+(20\\d{2})`,'i'));
  if(m)return{month:MONTHS[m[1].toLowerCase()],year:Number(m[2])};
  m=text.match(/\b(?:0?[1-9]|[12]\d|3[01])[.\/-](0?[1-9]|1[0-2])[.\/-](20\d{2})\b/);
  if(m)return{month:Number(m[1]),year:Number(m[2])};
  return null;
}
function resultPeriod(item){
  const title=String(item.title||'').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
  const ended=title.match(/(?:quarter|three months|3 months|six months|6 months|half year|nine months|9 months|year|financial year|period|results?)[\s\S]{0,260}?(?:ended|ending)\s+(?:on\s+)?([^;|]+?)(?=\s+(?:and|for the|with|as on)\b|$)/i);
  const period=periodFromText(ended?ended[1]:title);if(!period)return null;
  const q={6:'Q1',9:'Q2',12:'Q3',3:'Q4'}[period.month];return q?{quarter:q,endYear:period.year,endMonth:period.month}:null;
}
function financialYear(quarter,endYear){if(!quarter||!endYear)return '';const start=quarter==='Q4'?endYear-1:endYear;return `${start}-${start+1}`;}
function isHalfYear(item){return /half.?year|six months|6 months|half year/i.test(item.title||'');}
function isYear(item){return /year ended|financial year ended|annual|audited/i.test(item.title||'');}
function resultRows(items,manual=[]){
  const candidates=new Map();
  for(const item of items){const p=resultPeriod(item);if(!p)continue;const fy=financialYear(p.quarter,p.endYear);const key=`${fy}|${p.quarter}`;const record={...item,financialYear:fy,fiscalYear:fy,quarter:p.quarter,periodEndYear:p.endYear,periodEndMonth:p.endMonth};const old=candidates.get(key);if(!old||filingTime(record)>filingTime(old))candidates.set(key,record);}
  const years=new Map();
  for(const item of candidates.values()){if(!years.has(item.fiscalYear))years.set(item.fiscalYear,{financialYear:item.fiscalYear,q1:null,q2:null,q3:null,q4:null,h:null,y:null});const row=years.get(item.fiscalYear);row[item.quarter.toLowerCase()]=item;if(item.quarter==='Q2'&&isHalfYear(item)&&(!row.h||filingTime(item)>filingTime(row.h)))row.h=item;if(item.quarter==='Q4'&&isYear(item)&&(!row.y||filingTime(item)>filingTime(row.y)))row.y=item;}
  for(const row of years.values()){if(!row.h)row.h=row.q2;if(!row.y)row.y=row.q4;}
  for(const m of manual){const fy=String(m.financialYear||'').replace(/^FY\s*/i,'');const q=String(m.quarter||'').toLowerCase();if(!/^20\d{2}-20\d{2}$/.test(fy)||!/^q[1-4]$/.test(q))continue;if(!years.has(fy))years.set(fy,{financialYear:fy,q1:null,q2:null,q3:null,q4:null,h:null,y:null});const item={id:`manual-${fy}-${q}`,title:m.title||`Financial Results ${fy} ${q.toUpperCase()}`,date:m.date||'',category:'Financial Results',status:'Manual',pdf:m.pdf||'',source:'BSE'};years.get(fy)[q]=item;if(m.halfYear)years.get(fy).h=item;if(m.year)years.get(fy).y=item;}
  const now=new Date();const currentStart=now.getMonth()>=3?now.getFullYear():now.getFullYear()-1;const rows=[];for(let start=currentStart;start>=2017;start--){const fy=`${start}-${start+1}`;rows.push(years.get(fy)||{financialYear:fy,q1:null,q2:null,q3:null,q4:null,h:null,y:null});}return rows;
}
function annualYear(item){const years=[...String(item.title||'').matchAll(/20\d{2}/g)].map(m=>Number(m[0]));if(years.length)return Math.max(...years);const d=new Date(String(item.date||'').replace('T',' '));return Number.isNaN(d.getTime())?0:d.getFullYear();}
function annualRows(items){const map=new Map();for(const item of items.filter(x=>/annual report|annual accounts/i.test(x.title))){const year=annualYear(item);if(!year)continue;const old=map.get(year);if(!old||filingTime(item)>filingTime(old))map.set(year,{...item,year});}return[...map.values()].sort((a,b)=>b.year-a.year);}
function votingRows(items){return items.filter(item=>/voting result|voting results|disclosure of voting|postal ballot/i.test(item.title)).map(item=>{const match=String(item.title).match(/(?:agm|annual general meeting|egm|extra-ordinary general meeting)[^\d]*(\d{1,2}(?:st|nd|rd|th)?[ .\/-]+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[ .\/-]+20\d{2})/i);return{...item,meetingDate:item.meetingDate||(match?match[1]:'Not provided'),meetingType:item.meetingType||(/egm|extra-ordinary|extraordinary/i.test(item.title)?'EGM':/postal ballot/i.test(item.title)?'Postal Ballot':'AGM'),resolutionType:item.resolutionType||'Not provided',resolution:item.resolution||item.title,quarter:item.quarter||'Not provided'};});}
function parseQuarterLabel(value,title){const source=`${value||''} ${title||''}`;let p=periodFromText(source);if(!p){const m=source.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[\s,.-]+(20\d{2})\b/i);if(m)p={month:MONTHS[m[1].toLowerCase()],year:Number(m[2])};}if(!p)return clean(value)||'';const name=Object.entries(MONTHS).find(([,n])=>n===p.month)?.[0];const canonical={jan:'January',feb:'February',mar:'March',apr:'April',may:'May',jun:'June',jul:'July',aug:'August',sep:'September',oct:'October',nov:'November',dec:'December'};return`${canonical[name]||name} ${p.year}`;}
function shareholdingRows(items){const monthNo={January:1,February:2,March:3,April:4,May:5,June:6,July:7,August:8,September:9,October:10,November:11,December:12};return items.filter(item=>item.category==='Shareholding Pattern').map(item=>{const quarter=parseQuarterLabel(item.quarter,item.title);const match=quarter.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})$/);const month=match?monthNo[match[1]]:0;const year=match?Number(match[2]):0;const fyStart=year?(month<=3?year-1:year):0;return{...item,shareholdingYear:fyStart?`${fyStart} - ${fyStart+1}`:'Not provided',shareholdingQuarter:quarter||'Not provided',_quarterSort:year*100+month};}).sort((a,b)=>b._quarterSort-a._quarterSort||filingTime(b)-filingTime(a));}

function governanceItem(item){
  const text=`${item.category||''} ${item.title||''}`.toLowerCase();
  return item.category==='Corporate Governance'||/corporate governance|integrated filing\s*[-–—(]?\s*governance|reg\.?\s*27|regulation\s*27|governance report|governance compliance|compliance report on corporate governance/.test(text);
}
function relatedPartyItem(item){const text=`${item.category||''} ${item.title||''}`.toLowerCase();return item.category==='Related Party Transactions'||/related party|related-party|integrated filing\s*[-–—(]?\s*finance/.test(text);}
function complaintItem(item){const text=`${item.category||''} ${item.title||''}`.toLowerCase();return item.category==='Investor Complaints'||/investor complaint|investor grievance|statement of investor complaints|complaints for the quarter/.test(text);}
function ascrItem(item){const text=`${item.category||''} ${item.title||''}`.toLowerCase();return item.category==='ASCR'||/annual secretarial compliance|secretarial compliance report|\bascr\b/.test(text);}
function categoryMatch(item,category){
  if(!category)return true;
  if(category==='Corporate Governance')return governanceItem(item);
  if(category==='Related Party Transactions')return relatedPartyItem(item);
  if(category==='Investor Complaints')return complaintItem(item);
  if(category==='ASCR')return ascrItem(item);
  return item.category===category;
}
function ascrYear(item){
  const title=String(item.title||'');
  let m=title.match(/(?:FY|financial year|year ended|year)\s*[-:]?\s*(20\d{2})\s*[-\/]\s*(\d{2,4})/i);
  if(m){const end=String(m[2]).length===2?Number(String(m[1]).slice(0,2)+m[2]):Number(m[2]);return `${Number(m[1])}-${end}`;}
  const date=item.pdfDate||item.xbrlDate||item.date;const d=new Date(String(date||'').replace('T',' '));
  if(!Number.isNaN(d.getTime())){const start=d.getMonth()<3?d.getFullYear()-2:d.getFullYear()-1;return `${start}-${start+1}`;}
  return '—';
}
function ascrRows(items){
  const map=new Map();
  for(const item of items.filter(ascrItem)){
    const year=ascrYear(item);
    const key=`${year}|${item.newsId||item.id}`;
    const row={...item,year,xbrlDate:item.xbrlDate||item.date,pdfDate:item.pdfDate||item.date,xbrlRevisedDate:item.xbrlRevisedDate||'',pdfRevisedDate:item.pdfRevisedDate||'',xbrl:item.xbrl||xbrlUrl(item.newsId,item.scripCode)};
    const old=map.get(key);if(!old||filingTime(row)>filingTime(old))map.set(key,row);
  }
  return [...map.values()].sort((a,b)=>{const ya=Number(String(a.year).slice(0,4))||0,yb=Number(String(b.year).slice(0,4))||0;return yb-ya||filingTime(b)-filingTime(a);});
}

async function fetchPage(page,from,to){
  const headers={Accept:'application/json, text/plain, */*',Origin:'https://www.bseindia.com',Referer:'https://www.bseindia.com/corporates/ann.html','User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36','Cache-Control':'no-cache'};
  const params=new URLSearchParams({pageno:String(page),strType:'C',strSearch:'P',strScrip:BSE_SCRIP_CODE,strPrevDate:from,strToDate:to,strCat:'-1',subcategory:''});
  let response=await fetch(`${BSE_API}?${params.toString()}`,{headers,cf:{cacheTtl:300,cacheEverything:true}});
  if(!response.ok)response=await fetch(`${BSE_API_FALLBACK}?${params.toString()}`,{headers,cf:{cacheTtl:300,cacheEverything:true}});
  if(!response.ok)throw new Error(`BSE responded with ${response.status}`);
  const data=await response.json();if(!Array.isArray(data?.Table))throw new Error('BSE returned an unexpected investor-feed response');return data;
}
async function fetchAllBse(from,to){
  const first=await fetchPage(1,from,to);const firstRows=Array.isArray(first?.Table)?first.Table:[];const totalPages=Math.max(1,Number(firstRows[0]?.TotalPageCnt||first?.Table1?.[0]?.TotalPageCnt||0)||Math.ceil(Number(first?.Table1?.[0]?.ROWCNT||0)/50)||1);const pageNumbers=Array.from({length:Math.min(totalPages,100)-1},(_,i)=>i+2);const rest=await Promise.all(pageNumbers.map(page=>fetchPage(page,from,to)));return[first,...rest].flatMap(payload=>Array.isArray(payload?.Table)?payload.Table.map(normalise):[]);
}
async function loadManual(request){try{const url=new URL('/investor-manual-results.json',request.url);const response=await fetch(url.toString(),{cf:{cacheTtl:60,cacheEverything:true}});if(!response.ok)return[];const data=await response.json();return Array.isArray(data?.results)?data.results:[];}catch{return[];}}

export async function onRequestGet({request}){
  const url=new URL(request.url);const page=Math.max(1,Number(url.searchParams.get('page')||1));const from=url.searchParams.get('from')||'20140101';const to=url.searchParams.get('to')||new Date().toISOString().slice(0,10).replaceAll('-','');const category=url.searchParams.get('category')||'';const query=(url.searchParams.get('q')||'').trim().toLowerCase();
  try{
    const [rawRows,manual]=await Promise.all([fetchAllBse(from,to),loadManual(request)]);
    const unique=[...new Map(rawRows.map(item=>[item.id,item])).values()];
    const filtered=unique.filter(item=>categoryMatch(item,category)&&(!query||String(item.title||'').toLowerCase().includes(query)));
    const results=category==='Financial Results'?resultRows(filtered,manual):[];
    const annual=category==='Annual Reports'?annualRows(filtered):[];
    const voting=category==='Shareholders Meetings'&&query==='voting'?votingRows(filtered):[];
    const shareholding=category==='Shareholding Pattern'?shareholdingRows(filtered):[];
    const governance=category==='Corporate Governance'?[...filtered].sort((a,b)=>filingTime(b)-filingTime(a)):[];
    const relatedParty=category==='Related Party Transactions'?[...filtered].sort((a,b)=>filingTime(b)-filingTime(a)):[];
    const complaints=category==='Investor Complaints'?[...filtered].sort((a,b)=>filingTime(b)-filingTime(a)):[];
    const ascr=category==='ASCR'?ascrRows(filtered):[];
    const pageSize=20;
    const items=category==='Financial Results'?results.slice((page-1)*pageSize,page*pageSize):category==='Annual Reports'?annual.slice((page-1)*pageSize,page*pageSize):voting.length?voting.slice((page-1)*pageSize,page*pageSize):category==='Shareholding Pattern'?shareholding.slice((page-1)*pageSize,page*pageSize):category==='Corporate Governance'?governance.slice((page-1)*pageSize,page*pageSize):category==='Related Party Transactions'?relatedParty.slice((page-1)*pageSize,page*pageSize):category==='Investor Complaints'?complaints.slice((page-1)*pageSize,page*pageSize):category==='ASCR'?ascr.slice((page-1)*pageSize,page*pageSize):filtered.slice((page-1)*pageSize,page*pageSize);
    const total=category==='Financial Results'?results.length:category==='Annual Reports'?annual.length:category==='Shareholding Pattern'?shareholding.length:category==='Corporate Governance'?governance.length:category==='Related Party Transactions'?relatedParty.length:category==='Investor Complaints'?complaints.length:category==='ASCR'?ascr.length:voting.length||filtered.length;
    return Response.json({source:'BSE Limited',scripCode:BSE_SCRIP_CODE,isin:BSE_ISIN,company:BSE_COMPANY_NAME,page,total,items,results:category==='Financial Results'?results:undefined,annualReports:category==='Annual Reports'?annual:undefined,votingResults:voting.length?voting:undefined,shareholdingPatterns:category==='Shareholding Pattern'?shareholding:undefined,ascr:category==='ASCR'?ascr:undefined,fetchedAt:new Date().toISOString()},{headers:{'Cache-Control':'public, max-age=120, s-maxage=300, stale-while-revalidate=600'}});
  }catch(error){return Response.json({source:'BSE Limited',scripCode:BSE_SCRIP_CODE,isin:BSE_ISIN,company:BSE_COMPANY_NAME,error:'BSE investor data is temporarily unavailable.',details:error instanceof Error?error.message:String(error),items:[],results:[],annualReports:[],votingResults:[],shareholdingPatterns:[],ascr:[]},{status:502,headers:{'Cache-Control':'no-store'}});}
}
