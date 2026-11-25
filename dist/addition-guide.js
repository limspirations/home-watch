/* Home Watch — GitHub main의 단일 단지 GPT 등록 기능 개선. */
(function(){
 'use strict';
 const byId=id=>document.getElementById(id),dialog=byId('additionmanual'),app=window.homeWatch;
 const normalize=s=>String(s).normalize('NFKC').replace(/\s|[·ㆍ,()\-]/g,'').replace(/^동탄/,'').toLowerCase();
 const str=(v,max=300)=>typeof v==='string'?v.trim().slice(0,max):'';
 const positive=v=>typeof v==='number'&&Number.isFinite(v)&&v>0&&v<1000;
 const todayISO=()=>{const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());return ['year','month','day'].map(k=>p.find(x=>x.type===k).value).join('-')};
 const dateOK=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v&&v<=todayISO();
 const link=v=>{try{const u=new URL(v);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password?u.href:''}catch{return''}};
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=v=>Number.isFinite(v)?v.toLocaleString('ko-KR',{maximumFractionDigits:4})+'억':'—';
 function buildPrompt(){
  const candidate=byId('manualcandidate').value.trim()||'[아파트 단지명]',repo=byId('manualrepo').value.trim();
  return `다음 아파트 한 단지의 부동산 정보를 웹에서 심층 조사해 줘.

대상: ${candidate}${repo?' (참고 사이트: '+repo+')':''}

1. 단지명, 도로명주소, 지역, 실제 전용면적을 확인해. 과거 명칭, 주소, 단지번호로도 재검색해. 전용 84㎡급(80㎡ 초과~85㎡ 이하)을 우선하고 없으면 가장 가까운 실제 전용면적을 선택해. 최근 거래와 연평균은 동일 평형군으로 집계하며 다른 평형, 전세, 월세, 분양권은 제외해.
2. 네이버 부동산에서 해당 평형군의 실제 정상 매매 개별 매물 중 확인 가능한 최저 호가를 직접 확인해. 가격, 확인일, 전용면적, 동, 층/전체층, 방향, 특징을 기록해. 타 사이트 재게시를 대신 쓰지 마. KB부동산에서는 해당 평형군의 매물평균가만 직접 확인하고 일반평균시세, 상·하위평균가, 실거래가로 대체하지 마.
3. 국토교통부 실거래가 공개시스템, 호갱노노, 아실, 부동산지인, KB, 네이버, 집품 및 실거래 전문 사이트를 순차적으로 확인해. 계약 취소 및 중복을 제외한 정상 매매 최근 10건을 계약일 최신순으로 확보해. 동일 날짜·가격만으로 별개 거래를 삭제하지 마. 각 거래의 정확한 면적을 확인해.
4. 최우선: 현재 연도 포함 최근 10개 연도 전체 정상 거래를 확보해 연도별 산술평균(거래금액 합계/거래건수)과 건수를 계산해. 최근 10건 제한은 집계에 적용하지 마. 연평균 직접 제공 자료가 없으면 개별 거래로 계산해. 월평균을 이용한다면 거래건수 가중평균만 허용하고 반올림 한계를 밝혀. 중앙값, 호가, 시세를 평균 실거래로 대체하지 마. 일부 거래만 확보한 연도는 전체 평균으로 표시하지 말고 미확인 처리해. 현재 연도는 조사일까지 누적 기준. 거래가 없는 연도는 0원으로 기록하거나 추정하지 마.
5. 검색 실패 시 단지명+84㎡+매매, 단지명+실거래가, 연도별 검색, 주소, 과거 명칭 및 사이트별 검색으로 재시도해. 가격 한두 건만 확인하고 종료하지 마. 실제 페이지를 직접 열어 면적과 거래를 검증해. 확인되지 않은 값과 URL은 생성하지 마. 같은 항목은 가능한 동일 출처를 사용하고 다른 출처는 각 행 끝에 URL을 붙여. 모든 가격은 억원 단위, 필요시 소수점 넷째 자리까지 표시해.
6. GPT 종합 검토: 2028년 전후 실거주 매수 및 3~5년 보유 후 상급지 갈아타기를 고려하는 맞벌이 부부 관점에서 평가해. 현재 호가와 최근 거래 차이, 10년 평균 추세, 과거 최고가, 거래량, 인근 유사 단지 가격을 비교해. 역 실제 도보 거리, 삼성전자 화성·기흥캠퍼스 출퇴근 및 통근버스, 학군·학원가·상권·병원, 준공·세대수·주차·관리·신축 경쟁력·정비사업, 철도·도시개발·산업단지·신규 입주 물량, 호재 선반영·개통 지연, 하락장 방어력과 환금성을 검토해. 확정 사업/추진 중/계획을 구분하고 사실과 의견을 분리해. 상승을 단정하지 말고 위험 요인도 명시해. 가격 경쟁력, 교통 및 직주근접, 실거주 만족도, 단지 경쟁력, 미래 자산가치, 하락장 방어력, 환금성, 상급지 갈아타기 적합성을 각각 10점 만점으로 평가해. 근거 부족 항목은 평가 보류, 모든 항목 평가 시에만 80점 총점 및 100점 환산점수 표시해. 금융전문가 자문이 아닌 참고 의견임을 밝혀.
7. 조사 메모와 검토 메모는 반드시 별도 항목으로 출력해. 조사 메모에는 실제 집계 면적 범위, 자료 누락, 부분 집계, 출처 및 확인 한계만 간략하게 기록해. 검토 메모에는 [가격 분석] [입지 분석] [핵심 장점] [핵심 단점] [미래 가치] [환금성] [GPT 평가] [평가 점수] [추가 확인 사항] [추가 출처]를 포함해 500~1,000자로 작성해. GPT 의견 및 점수는 조사 메모에 절대 넣지 마. 검토 메모는 사이트의 수정·저장 가능한 검토 메모 입력란에 들어갈 데이터야.
8. 제출 전 단지·주소·면적, 가격 구분, 최근 거래와 10개년 집계, 실제 URL을 검증해. 최소 한 가지 확인된 가격과 직접 확인한 출처가 필요해. 충분히 검색한 뒤 미확인 값은 미확인으로 표시해.

최종 출력은 아래 항목명을 그대로 사용한 일반 텍스트만 작성해. 표, 마크다운 링크, 인용 배지, 번호 목록, JSON, 코드 블록, GitHub 변경, 파일 생성은 하지 마. 각 항목은 한 줄, 거래는 세미콜론, 값은 슬래시로 구분해. 다른 출처를 사용하는 거래나 연도는 반드시 그 행 맨 끝에 해당 URL을 붙여. 연평균은 전체 집계가 확인된 연도만 가격과 건수를 기입해. 검토 메모는 최대 1,500자, 수동 입력용 투자 목적은 출력하지 마. 아래 형식의 예시를 실제 데이터로 쓰지 마. 최근 실거래의 면적은 확인된 실제 숫자로 각 거래 뒤에 추가해.
단지명: 실제 이름
지역: 실제 지역
주소: 실제 도로명주소
전용면적: 대표 실제 숫자㎡ (연평균 평형군은 조사 메모에 기록)
네이버 호가: 가격억 / YYYY-MM-DD / 실제 전용면적㎡
네이버 출처: URL
네이버 매물 특징: 동 / 층 / 방향 및 특징
KB 매물평균가: 가격억 / YYYY-MM-DD / 실제 전용면적㎡
KB 출처: URL
최근 실거래: YYYY-MM-DD / 가격억 / 층 / 전용면적㎡; 추가 거래
실거래 출처: URL
연평균 실거래: 연도 / 가격억 / 거래건수건; 추가 연도
연평균 출처: URL
조사 메모: 확인 한계 및 실제 집계 면적 범위
검토 메모: GPT 종합 의견 및 평가 점수`;
 }
 // Preserve existing board data. A report supplies exactly one new candidate.
 function parseText(raw,purpose='',memo=''){
  let input=String(raw??'').replace(/^\uFEFF/,'').replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/\r\n?/g,'\n').replace(/\*\*/g,'').replace(/`/g,'').trim();
  input=input.replace(/\\+[ \t]*(?=\n|$)/g,'');
  if(!input||input.length>50000)throw Error('GPT 조사 답변을 붙여 넣어 주세요.');
  const fields=new Map(),aliases={'아파트명':'단지명','아파트 이름':'단지명','전용 면적':'전용면적','KB 매물 평균가':'KB 매물평균가','네이버 링크':'네이버 출처','KB 링크':'KB 출처','실거래 링크':'실거래 출처','연평균 링크':'연평균 출처','메모':'조사 메모','GPT 검토 메모':'검토 메모','검토메모':'검토 메모','조사메모':'조사 메모'};
  const labels=['단지명','지역','주소','전용면적','네이버 호가','네이버 출처','네이버 매물 특징','KB 매물평균가','KB 출처','최근 실거래','실거래 출처','연평균 실거래','연평균 출처','조사 메모','검토 메모'];
  // Accept collapsed clipboard line breaks, but do not split labels inside a memo.
  const labelPattern=[...labels,...Object.keys(aliases).filter(k=>k!=='메모')].sort((a,b)=>b.length-a.length).join('|');
  if(!/^\s*(?:단지명|아파트명|아파트 이름)\s*[:：].*\n\s*지역\s*[:：]/m.test(input)){
   const cut=input.search(/(?:^|\s)(?:조사 메모|조사메모|검토 메모|검토메모)\s*[:：]/);
   const head=cut<0?input:input.slice(0,cut),tail=cut<0?'':input.slice(cut);
   input=head.replace(new RegExp('([^\\n])\\s+('+labelPattern+')\\s*[:：]','g'),'$1\n$2:')+(tail?'\n'+tail.trim().replace(/\s+(검토 메모|검토메모)\s*[:：]/,'\n$1:'):'');
  }
  let active='';
  for(let line of input.split('\n')){
   line=line.trim().replace(/^\s*(?:[-•*]|\d+[.)])\s+/,'');if(!line)continue;
   const m=line.match(/^([^:：]{1,25})[:：]\s*(.*)$/),label=m&&(aliases[m[1].trim()]||m[1].trim());
   if(label&&labels.includes(label)){
    if(label==='단지명'&&fields.has(label))throw Error('한 번에 한 단지만 조사해 주세요.');
    active=label;fields.set(label,(fields.get(label)?fields.get(label)+'; ':'')+m[2].trim());
   }else if(active){
    if(/^(조사 메모|검토 메모)$/.test(active))fields.set(active,[fields.get(active),line].filter(Boolean).join('\n'));
    else if(/^(최근 실거래|연평균 실거래)$/.test(active)&&/^\d{4}/.test(line))fields.set(active,[fields.get(active),line].filter(Boolean).join('; '));
    else if(/출처$/.test(active)&&/^https?:\/\//i.test(line))fields.set(active,[fields.get(active),line].filter(Boolean).join('; '));
   }
  }
  const value=k=>(fields.get(k)||'').trim(),missing=v=>!v||/^(?:미확인|미확보|없음|자료 없음|확인 불가|해당 없음|[-—–])(?:\s|$|[.(])/.test(v);
  const urlsOf=v=>[...String(v).matchAll(/https?:\/\/[^\s<>\[\]"|;；]+/gi)].map(m=>link(m[0].replace(/[.,;]+$/,''))).filter(Boolean);
  const numberPrice=v=>{const x=String(v).replace(/,/g,'');let m=x.match(/(\d+(?:\.\d+)?)\s*억(?:\s*(\d+(?:\.\d+)?)\s*만(?:원)?)?/);return m?Number(m[1])+Number(m[2]||0)/10000:NaN;};
  const name=value('단지명'),region=value('지역'),address=value('주소'),areaMatch=value('전용면적').match(/\d+(?:\.\d+)?/),area=areaMatch?Number(areaMatch[0]):null;
  if([name,region,address].some(missing)||!positive(area)||area>500)throw Error('단지명, 지역, 주소, 전용면적이 필요해요. GPT 조사 답변 전체를 복사했는지 확인해 주세요.');
  if(!str(purpose,100))throw Error('투자 목적을 직접 입력해 주세요.');
  const existing=app.getData();if(existing.some(a=>normalize(a.name)===normalize(name)))return {added:[],skipped:[name+' — 이미 등록됨'],warnings:[]};
  const warnings=[],yearNow=Number(todayISO().slice(0,4));
  const rows=(key,sourceKey,kind)=>{
   const v=value(key);if(missing(v))return [];
   const sources=[...new Set(urlsOf(value(sourceKey)))],fallback=sources.length===1?sources[0]:'';
   const records=v.split(/;|；/).map(row=>row.trim()).filter(r=>!missing(r)).flatMap(row=>{
    const date=row.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0],year=Number(row.match(/(?:^|\s)(\d{4})(?:년|\s|\/|$)/)?.[1]),price=numberPrice(row),url=urlsOf(row)[0]||fallback,host=url?new URL(url).hostname:'';
    const areaFound=row.match(/(\d+(?:\.\d+)?)\s*㎡/),rowArea=areaFound?Number(areaFound[1]):area;
    let reason='';if(!positive(price))reason='가격';else if(!url)reason=sources.length>1?'개별 출처 URL':'출처';else if(!positive(rowArea)||(area>80&&area<=85?!(rowArea>80&&rowArea<=85):Math.abs(rowArea-area)>0.01))reason='평형군';else if(kind==='annual'&&(!Number.isInteger(year)||year<yearNow-9||year>yearNow))reason='연도';else if(kind!=='annual'&&!dateOK(date))reason='날짜';else if(kind==='naver'&&!/(^|\.)naver\.com$/.test(host))reason='네이버 원문';else if(kind==='kb'&&!/(^|\.)kbland\.kr$/.test(host))reason='KB 원문';
    if(reason){warnings.push(key+' 일부 제외: '+reason+' 확인 필요');return [];}
    if(kind==='annual'){
     const count=Number(row.match(/(\d[\d,]*)\s*건/)?.[1]?.replace(/,/g,''));
     // A known price with unknown count is retained as a published mean, never invented.
     return [{year,price,count:Number.isInteger(count)&&count>0?count:null,area,url}];
    }
    const features=kind==='naver'&&!missing(value('네이버 매물 특징'))?value('네이버 매물 특징'):'';
    const floorRe=/(?:저|중|고|\d+)\s*(?:\/\s*\d+\s*)?층/;
    return [{date,price,area:rowArea,url,label:kind==='naver'?'네이버 개별 매매 호가':kind==='kb'?'KB 매물평균가':'매매 실거래가',floor:row.match(floorRe)?.[0]||features.match(floorRe)?.[0]||'',building:row.match(/\d+\s*동/)?.[0]||features.match(/\d+\s*동/)?.[0]||'',description:str(features,300)}];
   });
   if(kind==='annual'){
    const groups=new Map();for(const r of records){if(!groups.has(r.year))groups.set(r.year,[]);groups.get(r.year).push(r);}
    return [...groups.values()].flatMap(group=>{if(group.some(r=>r.price!==group[0].price||r.count!==group[0].count)){warnings.push('연평균 실거래 일부 제외: 같은 연도에 서로 다른 값');return [];}return [group[0]];}).sort((a,b)=>a.year-b.year);
   }
   const sorted=records.sort((a,b)=>a.date.localeCompare(b.date));return kind==='trade'?sorted.slice(-10):sorted;
  };
  const naverAsks=rows('네이버 호가','네이버 출처','naver'),kbAsks=rows('KB 매물평균가','KB 출처','kb'),trades=rows('최근 실거래','실거래 출처','trade'),annual=rows('연평균 실거래','연평균 출처','annual');
  const primary=naverAsks.length?naverAsks:kbAsks.length?kbAsks:trades;
  if(!primary.length)return {added:[],skipped:[name+' — 확인된 현재 호가 또는 개별 실거래 가격 없음'],warnings:[...new Set(warnings)]};
  const p=primary.at(-1),t=trades.at(-1),kb=kbAsks.at(-1);
  if(p.price<4)return {added:[],skipped:[name+' — 현재 보드의 4억원 이상 기준 밖'],warnings:[...new Set(warnings)]};
  const gptMemo=missing(value('검토 메모'))?'':value('검토 메모');
  // GPT review goes in a.memo (the editable detail textarea), not researchNote.
  const manual=str(memo,2000),combined=manual?(gptMemo?gptMemo+'\n\n[내 메모]\n'+manual:manual):gptMemo;
  if(combined.length>2000)throw Error('GPT 검토 메모와 내 메모를 합쳐 2,000자 이하로 줄여 주세요.');
  const current={id:globalThis.crypto?.randomUUID?.()||'paste-'+Date.now(),name,region,address,area,purpose:str(purpose,100),kind:p.label,url:p.url,memo:combined,trade:t?{price:t.price,date:t.date,floor:t.floor||'미확인'}:null,history:primary.map(r=>({date:r.date,price:r.price,source:r.label,url:r.url})),referenceHistory:kbAsks.map(r=>({date:r.date,price:r.price,kind:r.label,source:'KB부동산',url:r.url})),referenceUrl:kb?.url||'',areaApprox:false,pasteMarket:{naverAsks,kbAsks,trades,annual,researchNote:str([value('조사 메모'),...new Set(warnings)].filter(Boolean).join(' · '),2000)}};
  if(naverAsks.length&&(p.building||p.floor||p.description))current.listing={building:p.building||'동 미확인',floor:p.floor||'층 미확인',description:p.description};
  if(!app.isValid([...existing,current]))throw Error('기존 보드와 합칠 수 없는 데이터예요.');
  return {added:[current],skipped:[],warnings:[...new Set(warnings)]};
 }
 // Preserve the GitHub main detail renderer for original candidates.
 function chart(series,annual=false){
  const all=series.flatMap(s=>s.rows);if(!all.length)return '<p class="coverage">확인된 자료 없음</p>';
  const xs=all.map(r=>annual?Date.UTC(r.year,0,1):Date.parse(r.date+'T00:00:00Z')),ys=all.map(r=>r.price),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.max(0,Math.min(...ys)-.4),y1=Math.max(...ys)+.4;
  const x=v=>x1===x0?320:58+(v-x0)/(x1-x0)*530,y=v=>175-(v-y0)/(y1-y0)*135;
  let svg='<svg class="market-chart" viewBox="0 0 630 216" role="img" aria-label="확인된 가격 기록">';
  for(let i=0;i<=4;i++){const v=y0+(y1-y0)*i/4,yy=y(v);svg+='<line x1="58" x2="588" y1="'+yy+'" y2="'+yy+'" stroke="#dfe8ec"/><text x="50" y="'+(yy+4)+'" text-anchor="end">'+v.toFixed(1)+'</text>';}
  for(const s of series){for(let i=0;i<s.rows.length;i++){const r=s.rows[i],xx=x(annual?Date.UTC(r.year,0,1):Date.parse(r.date+'T00:00:00Z')),yy=y(r.price),prev=s.rows[i-1];if(prev&&(!annual||r.year===prev.year+1))svg+='<line x1="'+x(annual?Date.UTC(prev.year,0,1):Date.parse(prev.date+'T00:00:00Z'))+'" y1="'+y(prev.price)+'" x2="'+xx+'" y2="'+yy+'" stroke="'+s.color+'" stroke-width="2.5"/>';svg+='<circle cx="'+xx+'" cy="'+yy+'" r="4.5" fill="'+s.color+'"><title>'+escape((r.date||r.year)+' '+s.name+' '+money(r.price))+'</title></circle>';}}
  const tick=v=>new Date(v).toISOString().slice(0,annual?4:10);svg+='<text x="58" y="200">'+tick(x0)+'</text>'+(x1!==x0?'<text x="588" y="200" text-anchor="end">'+tick(x1)+'</text>':'')+'</svg>';
  return svg+'<div class="price-legend">'+series.map(s=>'<span><i style="background:'+s.color+'"></i>'+s.name+'</span>').join('')+'</div>';
 }
 function table(rows,annual=false){return '<div class="market-table-wrap"><table class="history"><thead><tr><th>'+(annual?'연도':'날짜')+'</th><th>가격</th><th>전용</th><th>'+(annual?'건수':'층')+'</th><th>출처</th></tr></thead><tbody>'+([...rows].reverse().map(r=>'<tr><td>'+escape(annual?r.year:r.date)+'</td><td>'+money(r.price)+'</td><td>'+escape(r.area)+'㎡</td><td>'+escape(annual?r.count??'—':r.floor||'—')+'</td><td>'+(link(r.url)?'<a target="_blank" rel="noopener noreferrer" href="'+escape(link(r.url))+'">원문</a>':'—')+'</td></tr>').join('')||'<tr><td colspan="5">미확보</td></tr>')+'</tbody></table></div>';}
 const oldRender=window.renderMarketHistory;
 window.renderMarketHistory=function(a){
  if(!a.pasteMarket)return oldRender?.(a);
  const root=byId('market-history'),m=a.pasteMarket;if(!root)return;
  const n=m.naverAsks||[],k=m.kbAsks||[],t=m.trades||[],y=m.annual||[];
  root.innerHTML='<h3>네이버 · KB 호가 기록</h3>'+chart([{name:'네이버 개별 호가',color:'#d27b2b',rows:n},{name:'KB 매물평균가',color:'#8052b3',rows:k}])+'<p class="meta">개별 매물과 매물평균은 서로 다른 지표입니다. 확인된 기록만 표시합니다.</p><h3>네이버 호가</h3>'+table(n)+'<h3>KB 매물평균가</h3>'+table(k)+'<h3>최근 10개년 연평균 실거래가</h3>'+chart([{name:'연평균 실거래',color:'#2b806b',rows:y}],true)+table(y,true)+'<h3>개별 실거래 내역</h3>'+table(t)+(m.researchNote?'<p class="meta">조사 참고: '+escape(m.researchNote)+'</p>':'');
 };
 function open(){byId('manualprompt').value=buildPrompt();byId('manualcopystatus').textContent='';dialog.showModal();}
 byId('additionguide').onclick=open;
 byId('closemanual').onclick=()=>dialog.close();
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
 byId('buildmanualprompt').onclick=()=>{byId('manualprompt').value=buildPrompt();byId('manualcopystatus').textContent='입력한 정보를 반영했어요.'};
 for(const id of ['manualrepo','manualcandidate'])byId(id).addEventListener('input',()=>{byId('manualprompt').value=buildPrompt();byId('manualcopystatus').textContent=''});
 byId('copymanualprompt').onclick=async()=>{try{await navigator.clipboard.writeText(byId('manualprompt').value);byId('manualcopystatus').textContent='복사했어요.'}catch{byId('manualprompt').hidden=false;byId('manualprompt').focus();byId('manualprompt').select();byId('manualcopystatus').textContent='자동 복사가 차단됐어요. 요청 문구를 직접 복사해 주세요.'}};
 window.homeWatchPaste={parse:parseText,buildPrompt};
 if(typeof dialog.querySelector!=='function')return;
 byId('manualtitle').textContent='아파트 추가';
 const manualAdd=byId('add').onclick;
 byId('additionguide').hidden=true;
 byId('add').onclick=open;
 byId('manualcandidate').placeholder='아파트 이름 또는 네이버 부동산 링크';
 byId('manualcandidate').rows=2;
 byId('manualrepo').hidden=true;
 for(const id of ['manualrepo','manualprompt']){const label=dialog.querySelector('label[for="'+id+'"]');if(label)label.hidden=true;}
 byId('manualprompt').hidden=true;
 byId('buildmanualprompt').hidden=true;
 const steps=dialog.querySelector('.manualsteps');if(steps)steps.hidden=true;
 const info=dialog.querySelector('p.meta');if(info)info.textContent='아파트 한 곳을 GPT로 조사하고 답변을 붙여 넣으세요. GPT 검토 의견은 검토 메모에 자동 저장됩니다. 투자 목적은 직접 작성합니다.';
 const candidateLabel=dialog.querySelector('label[for="manualcandidate"]');if(candidateLabel)candidateLabel.textContent='아파트 이름 / 링크';
 byId('copymanualprompt').textContent='GPT 조사 요청 복사';
 byId('copymanualprompt').onclick=async()=>{if(!byId('manualcandidate').value.trim()){byId('manualcopystatus').textContent='아파트 이름을 먼저 입력하세요.';return;}const p=buildPrompt();byId('manualprompt').value=p;try{await navigator.clipboard.writeText(p);byId('manualcopystatus').textContent='복사했어요. GPT에 붙여 넣으세요.';}catch{byId('manualprompt').hidden=false;byId('manualprompt').focus();byId('manualprompt').select();byId('manualcopystatus').textContent='자동 복사가 차단됐어요. 선택한 요청 문구를 복사해 주세요.';}};
 const panel=dialog.querySelector('.panel');if(!panel)return;
 panel.insertAdjacentHTML('beforeend','<section style="border-top:1px solid #e0e8ee;margin-top:20px;padding-top:16px"><label for="hw-answer">GPT 조사 답변</label><textarea id="hw-answer" rows="5" placeholder="GPT가 조사한 일반 텍스트 답변 전체를 붙여 넣으세요." style="width:100%;font-size:14px"></textarea><label for="hw-purpose" style="margin-top:14px">투자 목적 · 직접 입력</label><input id="hw-purpose" maxlength="100" placeholder="예: 실거주, 재건축 기대, 직주근접" style="width:100%"><label for="hw-memo" style="margin-top:14px">내 추가 검토 메모 (선택)</label><textarea id="hw-memo" rows="2" maxlength="2000" placeholder="GPT 검토 의견 뒤에 덧붙일 내 생각" style="width:100%"></textarea><div id="hw-preview-result" role="status" style="white-space:pre-wrap;margin-top:12px;line-height:1.65;font-size:14px"></div><button type="button" class="primary" id="hw-import" disabled style="width:100%;margin-top:14px">목록에 추가</button><button type="button" id="hw-direct" style="margin-top:12px;width:100%">직접 입력하기</button></section>');
 const input=byId('hw-answer'),purpose=byId('hw-purpose'),memo=byId('hw-memo'),preview=byId('hw-preview-result'),commit=byId('hw-import');
 function current(){return parseText(input.value,purpose.value,memo.value);}
 function refresh(){commit.disabled=true;preview.textContent='';if(!input.value.trim())return;if(!purpose.value.trim()){preview.textContent='투자 목적을 입력하면 등록할 수 있어요.';return;}try{const r=current(),a=r.added[0];if(!a){preview.textContent=[...r.skipped,...r.warnings].join(' · ');return;}const m=a.pasteMarket,show=rows=>rows.length?money(rows.at(-1).price):'미확보';preview.textContent=[a.name+' · 전용 '+a.area+'㎡','네이버 '+show(m.naverAsks)+' / KB '+show(m.kbAsks)+' / 실거래 '+show(m.trades),'연평균 자료 '+m.annual.length+'개년',a.memo?'검토 메모 '+a.memo.length+'자 저장 예정':'검토 메모 없음',...r.warnings].join('\n');commit.disabled=false;}catch(e){preview.textContent=e.message;}}
 for(const el of [input,purpose,memo])el.addEventListener('input',refresh);
 byId('hw-direct').onclick=()=>{dialog.close();manualAdd?.();};
 commit.onclick=()=>{try{if(byId('add').disabled)throw Error('동기화 중입니다. 완료 후 다시 시도하세요.');const r=current();if(!r.added.length)throw Error(r.skipped.join(' · ')||'새로 추가할 단지가 없어요.');app.replaceData([...app.getData(),...r.added]);window.homeCloud?.changed?.();input.value='';purpose.value='';memo.value='';byId('manualcandidate').value='';refresh();app.notify('아파트를 추가했어요');dialog.close();}catch(e){preview.textContent=e.message;}};
})();
