/* Home Watch — paste-to-add importer. Replace dist/addition-guide.js only. */
(function(){
 'use strict';
 const byId=id=>document.getElementById(id),dialog=byId('additionmanual'),app=window.homeWatch;
 const MAX=30, normalize=s=>String(s).normalize('NFKC').replace(/\s|[·ㆍ,()\-]/g,'').replace(/^동탄/,'').toLowerCase();
 const str=(v,max=300)=>typeof v==='string'?v.trim().slice(0,max):'';
 const positive=v=>typeof v==='number'&&Number.isFinite(v)&&v>0&&v<1000;
 const dateOK=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v&&v<=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const link=v=>{try{const u=new URL(v);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password?u.href:''}catch{return''}};
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=v=>Number.isFinite(v)?v.toLocaleString('ko-KR',{maximumFractionDigits:4})+'억':'—';
 const example={version:1,apartments:[{name:'실제 단지명',region:'동탄',address:'도로명 주소',area:84.93,purpose:'실거주',naverAsks:[],kbAsks:[],trades:[],annual:[],memo:'확인되지 않은 사항'}]};
 function buildPrompt(){
  const candidate=byId('manualcandidate').value.trim()||'[여기에 단지명 또는 링크 입력]',repo=byId('manualrepo').value.trim();
  return `Home Watch 아파트 트래커에 붙여 넣을 JSON 데이터를 조사해줘. GitHub 수정이나 외부 계정 로그인은 하지 마.${repo?' 참고 저장소: '+repo:''}
대상: ${candidate}

다음 규칙에 따라 웹에서 실제 원자료를 확인하고 JSON 객체 하나만 출력해줘. 설명, 표, 마크다운 코드펜스는 제외해.
- 단지명/주소/지역을 확인하고 전용 84㎡를 우선하되 해당 평형이 없으면 가까운 실제 전용면적을 명시해. 지역은 동탄/광교/기흥/수원 등 기존 생활권 기준. 여러 단지를 apartments 배열에 각각 넣어.
- 금액 단위는 억원 숫자(예: 8억 5000만원 = 8.5), 날짜 YYYY-MM-DD. area는 실제 전용면적 숫자 또는 null. 날짜는 호가를 실제로 확인한 날짜 또는 원자료 기록일, 실거래는 계약일.
- naverAsks: 네이버 개별 매매 매물의 실제 호가만. 각 항목 {"date":"YYYY-MM-DD","price":숫자,"url":"원문 URL","label":"네이버 개별 매매 호가","area":숫자,"building":"동","floor":"층","description":"매물 특징"}. 최저가로 단정하지 마. 다른 사이트의 재게시를 원문이라고 하지 마.
- kbAsks: KB 매물평균가만. 각 항목 {"date":"YYYY-MM-DD","price":숫자,"url":"KB 원문 URL","label":"KB 매물평균가","area":숫자}. KB 일반평균시세는 여기에 넣지 마.
- trades: 확인한 동일 면적 매매 실거래. 각 항목 {"date":"YYYY-MM-DD","price":숫자,"area":숫자,"floor":"층","url":"실거래 출처 URL"}.
- annual: 최근 10년간 확인된 동일 면적 연평균 실거래. 각 항목 {"year":연도,"price":숫자,"count":거래건수 또는 null,"area":숫자,"url":"원자료 URL"}. 개별 실거래를 연평균으로 만들지 마. 근거 없는 추정/보간 금지.
- 모든 가격과 면적 및 링크는 실제 확인된 것만 기록하고 출처가 불명확하면 해당 배열은 []로 둬. 동일 면적이 확인되지 않으면 가격을 섞지 말고 memo에 적어. 적어도 한 개의 확인된 가격(네이버/KB/실거래)이 있어야 사이트에 추가할 수 있어. 모두 미확보라면 배열을 비우고 memo에 이유를 적어.
- 아래 구조를 지켜. 배열에 예시값을 넣지 말고 실제 조사 결과만 넣어.\n${JSON.stringify(example,null,2)}`;
 }
 function parse(raw){
  let s=String(raw).trim();if(s.length>500000)throw Error('답변이 너무 길어요. 30개 이하로 나눠 주세요.');
  const fenced=s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);if(fenced)s=fenced[1];
  let obj;try{obj=JSON.parse(s)}catch{throw Error('JSON 형식이 아니에요. GPT가 준 JSON 전체만 복사해 주세요.');}
  if(obj?.version!==1||!Array.isArray(obj.apartments)||!obj.apartments.length||obj.apartments.length>MAX)throw Error('version: 1, apartments 배열(1~30개)이 필요해요.');
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
  root.innerHTML='<h3>네이버 · KB 호가 기록</h3>'+chart([{name:'네이버 개별 호가',color:'#d27b2b',rows:n},{name:'KB 매물평균가',color:'#8052b3',rows:k}])+'<p class="meta">개별 매물과 매물평균은 서로 다른 지표입니다. 확인된 기록만 표시합니다.</p><h3>네이버 호가</h3>'+table(n)+'<h3>KB 매물평균가</h3>'+table(k)+'<h3>최근 10개년 연평균 실거래가</h3>'+chart([{name:'연평균 실거래',color:'#2b806b',rows:y}],true)+table(y,true)+'<h3>개별 실거래 내역</h3>'+table(t);
 };
 function open(){byId('manualprompt').value=buildPrompt();byId('manualcopystatus').textContent='';dialog.showModal();}
 byId('additionguide').onclick=open;
 byId('closemanual').onclick=()=>dialog.close();
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
 byId('buildmanualprompt').onclick=()=>{byId('manualprompt').value=buildPrompt();byId('manualcopystatus').textContent='입력한 정보를 반영했어요.'};
 for(const id of ['manualrepo','manualcandidate'])byId(id).addEventListener('input',()=>{byId('manualprompt').value=buildPrompt();byId('manualcopystatus').textContent=''});
 byId('copymanualprompt').onclick=async()=>{try{await navigator.clipboard.writeText(byId('manualprompt').value);byId('manualcopystatus').textContent='복사했어요.'}catch{byId('manualprompt').focus();byId('manualprompt').select();byId('manualcopystatus').textContent='직접 복사해 주세요.'}};
 window.homeWatchPaste={parse,buildPrompt};
 // DOM guards retain compatibility with existing headless project tests.
 if(typeof dialog.querySelector!=='function')return;
 byId('manualtitle').textContent='GPT로 아파트 한 번에 추가';
 byId('additionguide').textContent='GPT로 일괄 추가';
 byId('manualcandidate').placeholder='단지명 또는 네이버·KB 링크 (여러 개 가능)';
 byId('manualprompt').rows=7;
 byId('manualrepo').hidden=true;const repoLabel=dialog.querySelector('label[for="manualrepo"]');if(repoLabel)repoLabel.hidden=true;
 const steps=dialog.querySelector('.manualsteps');if(steps)steps.innerHTML='<li>아파트 이름 또는 링크만 적고 프롬프트를 복사하세요.</li><li>GPT에 붙여 넣고 받은 JSON 답변을 아래 칸에 붙여 넣으세요.</li><li>미리보기 확인 후 추가하면 기존 목록을 유지한 채 저장됩니다.</li>';
 const info=dialog.querySelector('p.meta');if(info)info.textContent='GitHub 연결 없이 현재 브라우저 목록에 저장합니다. 기존 목록을 덮어쓰지 않으며, 기기 간 공유는 기존 동기화 설정 또는 백업을 이용하세요.';
 const panel=dialog.querySelector('.panel');if(!panel)return;
 panel.insertAdjacentHTML('beforeend','<section style="border-top:1px solid #e0e8ee;margin-top:20px;padding-top:16px"><h3 style="margin-top:0">GPT 답변 붙여 넣기</h3><textarea id="hw-paste-json" rows="7" spellcheck="false" aria-label="GPT JSON 답변" placeholder="GPT가 준 JSON 전체를 여기에 붙여 넣으세요" style="width:100%;font-size:13px"></textarea><div class="actions" style="margin-top:10px"><button type="button" id="hw-preview">미리보기</button><button type="button" class="primary" id="hw-import" disabled>목록에 추가</button></div><div id="hw-preview-result" role="status" style="white-space:pre-wrap;margin-top:12px;line-height:1.65;font-size:14px"></div></section>');
 const input=byId('hw-paste-json'),preview=byId('hw-preview-result'),commit=byId('hw-import');
 let approved=null;
 input.addEventListener('input',()=>{approved=null;commit.disabled=true;preview.textContent='';});
 byId('hw-preview').onclick=()=>{try{const result=parse(input.value);approved=input.value;preview.textContent=[...result.added.map(a=>'추가: '+a.name+' · '+money(a.history.at(-1).price)+' ('+a.kind+')'),...result.skipped.map(s=>'건너뜀: '+s)].join('\n');commit.disabled=!result.added.length;}catch(e){approved=null;commit.disabled=true;preview.textContent=e.message;}};
 commit.onclick=()=>{try{if(approved!==input.value)throw Error('먼저 미리보기를 확인하세요.');if(byId('add').disabled)throw Error('동기화 중입니다. 완료 후 다시 시도하세요.');const result=parse(input.value);if(!result.added.length)throw Error('새로 추가할 단지가 없어요.');app.replaceData([...app.getData(),...result.added]);window.homeCloud?.changed?.();preview.textContent=result.added.length+'개 추가 완료. '+result.skipped.length+'개 건너뜀.';approved=null;commit.disabled=true;app.notify(result.added.length+'개 아파트를 추가했어요');}catch(e){preview.textContent=e.message;}};
})();
