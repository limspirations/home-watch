/* Home Watch — single-candidate plain-text research import. Replace dist/addition-guide.js only. */
(function(){
 'use strict';
 const byId=id=>document.getElementById(id),dialog=byId('additionmanual'),app=window.homeWatch;
 const MAX=1, normalize=s=>String(s).normalize('NFKC').replace(/\s|[·ㆍ,()\-]/g,'').replace(/^동탄/,'').toLowerCase();
 const str=(v,max=300)=>typeof v==='string'?v.trim().slice(0,max):'';
 const positive=v=>typeof v==='number'&&Number.isFinite(v)&&v>0&&v<1000;
 const todayISO=()=>{const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());return ['year','month','day'].map(k=>p.find(x=>x.type===k).value).join('-')};
 const dateOK=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v&&v<=todayISO();
 const link=v=>{try{const u=new URL(v);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password?u.href:''}catch{return''}};
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=v=>Number.isFinite(v)?v.toLocaleString('ko-KR',{maximumFractionDigits:4})+'억':'—';
 function buildPrompt(){
  const candidate=byId('manualcandidate').value.trim()||'[단지명 또는 부동산 링크]',repo=byId('manualrepo').value.trim();
  return `다음 아파트 한 단지의 부동산 정보를 웹에서 조사해 줘. 대상: ${candidate}${repo?' (참고 사이트: '+repo+')':''}
전용 84㎡ 우선, 없으면 가장 가까운 실제 전용면적. 모든 가격은 동일 전용면적만, 매매 기준, 억원 단위로 적어. 네이버 개별 매물 호가와 KB 매물평균가를 구분하고, KB 일반평균시세나 타 사이트 재게시를 대신 쓰지 마. 최근 실거래는 최대 5건, 연평균 실거래는 최근 10년 중 실제 확인된 자료만. 미확인 값은 미확인이라고 적고 추정하지 마. 직접 확인한 출처 URL을 반드시 적어. 같은 항목의 거래는 동일 출처를 이용하고, 출처가 다르면 행 끝에 개별 URL을 적어. 투자 목적이나 개인 의견은 작성하지 마. GitHub 변경, 파일 생성, JSON 및 코드 블록은 필요 없어.
아래 항목명 그대로 짧은 일반 텍스트로 답변해 줘. 표, 마크다운 링크, 인용 배지, 번호 목록은 쓰지 말고 URL은 일반 텍스트로 적어. 가격·날짜·층을 슬래시(/)로 구분하고, 여러 거래는 세미콜론(;)으로 구분해. 마지막 줄에는 출처나 면적 등 확인하지 못한 사항만 기록해.

단지명: 실제 이름
지역: 동탄/광교/기흥/수원 등 한 곳
주소: 실제 도로명주소
전용면적: 실제 숫자㎡
네이버 호가: 가격억 / YYYY-MM-DD
네이버 출처: URL
KB 매물평균가: 가격억 / YYYY-MM-DD
KB 출처: URL
최근 실거래: YYYY-MM-DD / 가격억 / 층; 추가 거래
실거래 출처: URL
연평균 실거래: 연도 / 가격억 / 거래건수건; 추가 연도
연평균 출처: URL
조사 메모: 미확인 사항

확인되지 않은 항목은 미확인으로 표시하고 예시 문구를 실제 데이터로 쓰지 마. 최소 한 가지 확인된 가격과 출처가 필요해.`;
 }
 function parse(raw){
  let s=String(raw).replace(/^\uFEFF/,'').trim();if(s.length>500000)throw Error('답변이 너무 길어요. 30개 이하로 나눠 주세요.');
  const fenced=s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);if(fenced)s=fenced[1];
  let obj;try{obj=JSON.parse(s)}catch{throw Error('내부 데이터 형식 오류');}
  if(obj?.version!==1||!Array.isArray(obj.apartments)||!obj.apartments.length||obj.apartments.length>MAX)throw Error('한 단지만 등록할 수 있어요.');
  const existing=app.getData(),seen=new Set(existing.map(a=>normalize(a.name))),added=[],skipped=[];
  for(const a of obj.apartments){
   const name=str(a?.name,100),region=str(a?.region,30),address=str(a?.address,200),area=a?.area==null?null:a.area;
   if(!name||!region||!address)throw Error('단지명·지역·주소가 비어 있는 항목이 있어요.');
   if(seen.has(normalize(name))){skipped.push(name+' — 이미 등록됨');continue;}
   if(area!==null&&(!positive(area)||area>500))throw Error(name+': 전용면적 오류');
   const readRows=(field,kind)=>{
    if(!Array.isArray(a[field])||a[field].length>1000)throw Error(name+': '+field+' 배열 오류');
    return a[field].map(r=>{
     if(!r||!positive(r.price)||!link(r.url)||!positive(r.area)||area===null||Math.abs(r.area-area)>1)throw Error(name+': '+field+'의 가격·URL·동일 면적을 확인하세요.');
     const common={price:r.price,url:link(r.url),area:r.area};
     if(kind==='annual'){
      if(!Number.isInteger(r.year)||r.year<1900||r.year>Number(new Date().getFullYear())||(r.count!=null&&(!Number.isInteger(r.count)||r.count<1)))throw Error(name+': 연평균 연도·건수 오류');
      return {...common,year:r.year,count:r.count??null};
     }
     if(!dateOK(r.date))throw Error(name+': '+field+' 날짜 오류');
     if(kind==='naver'&&(!/(^|\.)naver\.com$/.test(new URL(common.url).hostname)||r.label!=='네이버 개별 매매 호가'))throw Error(name+': 네이버 원문/호가 분류 확인 필요');
     if(kind==='kb'&&(!/(^|\.)kbland\.kr$/.test(new URL(common.url).hostname)||r.label!=='KB 매물평균가'))throw Error(name+': KB 원문/매물평균가 분류 확인 필요');
     return {...common,date:r.date,label:kind==='naver'?'네이버 개별 매매 호가':kind==='kb'?'KB 매물평균가':'매매 실거래가',building:str(r.building,50),floor:str(r.floor,50),description:str(r.description,300)};
    }).sort((x,y)=>kind==='annual'?x.year-y.year:x.date.localeCompare(y.date));
   };
   const naverAsks=readRows('naverAsks','naver'),kbAsks=readRows('kbAsks','kb'),trades=readRows('trades','trade'),annual=readRows('annual','annual');
   const primary=naverAsks.length?naverAsks:kbAsks.length?kbAsks:trades;
   if(!primary.length){skipped.push(name+' — 확인된 가격 없음');continue;}
   const p=primary.at(-1),t=trades.at(-1),kb=kbAsks.at(-1);
   if(p.price<4){skipped.push(name+' — 현재 보드의 4억원 이상 기준 밖');continue;}
   const current={id:globalThis.crypto?.randomUUID?.()||'paste-'+Date.now()+'-'+added.length,name,region,address,area,purpose:str(a.purpose,100)||'비교 후보',kind:p.label,url:p.url,memo:str(a.memo,2000),trade:t?{price:t.price,date:t.date,floor:t.floor||'미확인'}:null,history:primary.map(r=>({date:r.date,price:r.price,source:r.label,url:r.url})),referenceHistory:kbAsks.map(r=>({date:r.date,price:r.price,kind:r.label,source:'KB부동산',url:r.url})),referenceUrl:kb?.url||'',areaApprox:false,pasteMarket:{naverAsks,kbAsks,trades,annual}};
   if(naverAsks.length&&(p.building||p.floor))current.listing={building:p.building||'동 미확인',floor:p.floor||'층 미확인',description:p.description};
   seen.add(normalize(name));added.push(current);
  }
  if(!app.isValid([...existing,...added]))throw Error('기존 보드와 합칠 수 없는 데이터예요.');
  return {added,skipped};
 }
 // The visible input is a short human-readable report, never JSON or a file.
 function parseText(raw,purpose='',memo=''){
  let input=String(raw??'').replace(/^\uFEFF/,'').replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/\r\n?/g,'\n').replace(/\*\*/g,'').replace(/`/g,'').trim();
  input=input.replace(/\\+[ \t]*(?=\n|$)/g,'');
  if(!input||input.length>50000)throw Error('GPT 조사 답변을 붙여 넣어 주세요.');
  const fields=new Map(),aliases={'아파트명':'단지명','아파트 이름':'단지명','전용 면적':'전용면적','KB 매물 평균가':'KB 매물평균가','네이버 링크':'네이버 출처','KB 링크':'KB 출처','실거래 링크':'실거래 출처','연평균 링크':'연평균 출처','메모':'조사 메모'};
  const labels=['단지명','지역','주소','전용면적','네이버 호가','네이버 출처','KB 매물평균가','KB 출처','최근 실거래','실거래 출처','연평균 실거래','연평균 출처','조사 메모'];
  // Also accept clipboard text with collapsed line breaks.
  const labelPattern=[...labels,...Object.keys(aliases)].sort((a,b)=>b.length-a.length).join('|');
  input=input.replace(new RegExp('([^\\n])\\s+('+labelPattern+')\\s*[:：]','g'),'$1\n$2:');
  let active='';for(let line of input.split('\n')){line=line.trim().replace(/^\s*(?:[-•*]|\d+[.)])\s+/,'');if(!line)continue;const m=line.match(/^([^:：]{1,25})[:：]\s*(.*)$/);const label=m&&(aliases[m[1].trim()]||m[1].trim());if(label&&labels.includes(label)){active=label;fields.set(label,(fields.get(label)?fields.get(label)+'; ':'')+m[2].trim());}else if(active&&/^(최근 실거래|연평균 실거래)$/.test(active)&&/^\d{4}/.test(line)){fields.set(active,(fields.get(active)||'')+'; '+line);}}
  if((fields.get('단지명')||'').includes(';'))throw Error('한 번에 한 단지만 조사해 주세요.');
  const value=k=>(fields.get(k)||'').trim(),missing=v=>!v||/^(?:미확인|미확보|없음|자료 없음|확인 불가|해당 없음|[-—–])(?:\s|$|[.(])/.test(v),urlOf=v=>{let m=String(v).match(/https?:\/\/[^\s<>\[\]"|]+/i);return m?link(m[0].replace(/[),.;]+$/,'')):'';},numberPrice=v=>{const x=String(v).replace(/,/g,'');let m=x.match(/(\d+(?:\.\d+)?)\s*억(?:\s*(\d+(?:\.\d+)?)\s*만(?:원)?)?/);if(m)return Number(m[1])+Number(m[2]||0)/10000;return NaN;};
  const name=value('단지명'),region=value('지역'),address=value('주소'),areaMatch=value('전용면적').match(/\d+(?:\.\d+)?/),area=areaMatch?Number(areaMatch[0]):null;
  if([name,region,address].some(missing)||!positive(area)||area>500)throw Error('단지명, 지역, 주소, 전용면적이 필요해요. GPT 조사 답변 전체를 복사했는지 확인해 주세요.');
  if(!str(purpose,100))throw Error('투자 목적을 직접 입력해 주세요.');
  const warnings=[],rows=(key,sourceKey,kind)=>{const v=value(key);if(missing(v))return [];const fallback=urlOf(value(sourceKey));return v.split(/;|；/).map(row=>row.trim()).filter(r=>!missing(r)).flatMap(row=>{const date=row.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0],year=Number(row.match(/(?:^|\s)(\d{4})(?:년|\s|\/|$)/)?.[1]),price=numberPrice(row),url=urlOf(row)||fallback,host=url?new URL(url).hostname:'';let reason='';if(!positive(price))reason='가격';else if(!url)reason='출처';else if(kind==='annual'&&(!Number.isInteger(year)||year<Number(todayISO().slice(0,4))-9||year>Number(todayISO().slice(0,4))))reason='연도';else if(kind!=='annual'&&!dateOK(date))reason='날짜';else if(kind==='naver'&&!/(^|\.)naver\.com$/.test(host))reason='네이버 원문';else if(kind==='kb'&&!/(^|\.)kbland\.kr$/.test(host))reason='KB 원문';if(reason){warnings.push(key+' 일부 제외: '+reason+' 확인 필요');return [];}if(kind==='annual'){const count=Number(row.match(/(\d[\d,]*)\s*건/)?.[1]?.replace(/,/g,''));return [{year,price,count:Number.isInteger(count)&&count>0?count:null,area,url}];}return [{date,price,area,url,label:kind==='naver'?'네이버 개별 매매 호가':kind==='kb'?'KB 매물평균가':'매매 실거래가',floor:row.match(/(?:저|중|고|\d+)\s*층/)?.[0]||'',building:row.match(/\d+\s*동/)?.[0]||''}];});};
  const result=parse(JSON.stringify({version:1,apartments:[{name,region,address,area,purpose:str(purpose,100),memo:str(memo,2000),naverAsks:rows('네이버 호가','네이버 출처','naver'),kbAsks:rows('KB 매물평균가','KB 출처','kb'),trades:rows('최근 실거래','실거래 출처','trade'),annual:rows('연평균 실거래','연평균 출처','annual')}]}));
  for(const a of result.added)a.pasteMarket.researchNote=str([value('조사 메모'),...new Set(warnings)].filter(Boolean).join(' · '),2000);
  result.warnings=[...new Set(warnings)];return result;
 }
 // Existing detail chart remains intact; imported records get independent sourced charts.
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
 // DOM guards retain compatibility with existing headless project tests.
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
 const info=dialog.querySelector('p.meta');if(info)info.textContent='아파트 한 곳을 GPT로 조사하고, 답변을 복사해 붙여 넣으세요. 투자 목적은 직접 작성합니다.';
 const candidateLabel=dialog.querySelector('label[for="manualcandidate"]');if(candidateLabel)candidateLabel.textContent='아파트 이름 / 링크';
 byId('copymanualprompt').textContent='GPT 조사 요청 복사';
 byId('copymanualprompt').onclick=async()=>{if(!byId('manualcandidate').value.trim()){byId('manualcopystatus').textContent='아파트 이름을 먼저 입력하세요.';return;}const p=buildPrompt();byId('manualprompt').value=p;try{await navigator.clipboard.writeText(p);byId('manualcopystatus').textContent='복사했어요. GPT에 붙여 넣으세요.';}catch{byId('manualprompt').hidden=false;byId('manualprompt').focus();byId('manualprompt').select();byId('manualcopystatus').textContent='자동 복사가 차단됐어요. 선택한 요청 문구를 복사해 주세요.';}};
 const panel=dialog.querySelector('.panel');if(!panel)return;
 panel.insertAdjacentHTML('beforeend','<section style="border-top:1px solid #e0e8ee;margin-top:20px;padding-top:16px"><label for="hw-answer">GPT 조사 답변</label><textarea id="hw-answer" rows="5" placeholder="GPT가 조사한 일반 텍스트 답변 전체를 붙여 넣으세요." style="width:100%;font-size:14px"></textarea><label for="hw-purpose" style="margin-top:14px">투자 목적 · 직접 입력</label><input id="hw-purpose" maxlength="100" placeholder="예: 실거주, 재건축 기대, 직주근접" style="width:100%"><label for="hw-memo" style="margin-top:14px">내 검토 메모 (선택)</label><textarea id="hw-memo" rows="2" maxlength="2000" placeholder="내 생각이나 비교할 사항" style="width:100%"></textarea><div id="hw-preview-result" role="status" style="white-space:pre-wrap;margin-top:12px;line-height:1.65;font-size:14px"></div><button type="button" class="primary" id="hw-import" disabled style="width:100%;margin-top:14px">목록에 추가</button><button type="button" id="hw-direct" style="margin-top:12px;width:100%">직접 입력하기</button></section>');
 const input=byId('hw-answer'),purpose=byId('hw-purpose'),memo=byId('hw-memo'),preview=byId('hw-preview-result'),commit=byId('hw-import');
 function current(){return parseText(input.value,purpose.value,memo.value);}
 function refresh(){commit.disabled=true;preview.textContent='';if(!input.value.trim())return;if(!purpose.value.trim()){preview.textContent='투자 목적을 입력하면 등록할 수 있어요.';return;}try{const r=current(),a=r.added[0];if(!a){preview.textContent=[...r.skipped,...r.warnings].join(' · ');return;}const m=a.pasteMarket,show=rows=>rows.length?money(rows.at(-1).price):'미확보';preview.textContent=[a.name+' · 전용 '+a.area+'㎡','네이버 '+show(m.naverAsks)+' / KB '+show(m.kbAsks)+' / 실거래 '+show(m.trades),'연평균 자료 '+m.annual.length+'개년',...r.warnings].join('\n');commit.disabled=false;}catch(e){preview.textContent=e.message;}}
 for(const el of [input,purpose,memo])el.addEventListener('input',refresh);
 byId('hw-direct').onclick=()=>{dialog.close();manualAdd?.();};
 commit.onclick=()=>{try{if(byId('add').disabled)throw Error('동기화 중입니다. 완료 후 다시 시도하세요.');const r=current();if(!r.added.length)throw Error(r.skipped.join(' · ')||'새로 추가할 단지가 없어요.');app.replaceData([...app.getData(),...r.added]);window.homeCloud?.changed?.();input.value='';purpose.value='';memo.value='';byId('manualcandidate').value='';refresh();app.notify('아파트를 추가했어요');dialog.close();}catch(e){preview.textContent=e.message;}};
})();
