// Annual observed prices and recent transactions are distinct from saved asking prices.
window.renderMarketHistory=function(a){
 const root=document.getElementById('market-history'),record=window.PRICE_HISTORY?.[a.id];
 if(!root)return;
 root.innerHTML='<div class="market-top"><h3>최근 10개년 실거래가</h3><select id="market-area" aria-label="실거래가 전용면적 구간"></select></div><div id="market-content"></div>';
 if(!record||!record.areaBands?.length){root.innerHTML='<h3>최근 10개년 실거래가</h3><p class="coverage">이 단지의 장기 실거래 자료를 아직 확보하지 못했어요. 확인되지 않은 가격은 표시하지 않습니다.</p>';return}
 const selector=document.getElementById('market-area');
 selector.innerHTML=record.areaBands.map(b=>'<option value="'+Number(b)+'">전용 '+(Number(b)-5)+' 초과~'+Number(b)+'㎡ 이하</option>').join('');
 const target=a.area||85;selector.value=[...record.areaBands].sort((x,y)=>Math.abs(Number(x)-target)-Math.abs(Number(y)-target))[0];
 function draw(){
  const band=Number(selector.value),series=Array.from({length:10},(_,i)=>{const year=2017+i;return record.annual.find(r=>r.year===year&&Number(r.areaBand)===band)||{year,price:null,count:null}}),known=series.filter(r=>Number.isFinite(r.price));
  const content=document.getElementById('market-content'),url=safeurl(record.annualSource||record.source);
  let chart='';
  if(known.length){
   const min=Math.min(...known.map(r=>r.price)),max=Math.max(...known.map(r=>r.price)),pad=Math.max((max-min)*.15,.25),low=Math.max(0,min-pad),high=max+pad;
   const x=year=>64+(year-2017)*530/9,y=price=>195-(price-low)/(high-low)*155;
   let paths='',points='',grid='';
   for(let i=0;i<=4;i++){let v=low+(high-low)*i/4,yy=y(v);grid+='<line x1="64" x2="594" y1="'+yy+'" y2="'+yy+'" stroke="#dfE8ec"/><text x="54" y="'+(yy+4)+'" text-anchor="end">'+v.toFixed(1)+'</text>'}
   for(let i=1;i<series.length;i++)if(Number.isFinite(series[i-1].price)&&Number.isFinite(series[i].price))paths+='<line x1="'+x(series[i-1].year)+'" y1="'+y(series[i-1].price)+'" x2="'+x(series[i].year)+'" y2="'+y(series[i].price)+'" stroke="#2b806b" stroke-width="3"/>';
   points=known.map(r=>'<circle class="market-point" tabindex="0" role="button" aria-label="'+r.year+'년 평균 '+money(r.price)+'" data-year="'+r.year+'" cx="'+x(r.year)+'" cy="'+y(r.price)+'" r="5" fill="#2b806b"><title>'+r.year+'년 평균 '+money(r.price)+'</title></circle>').join('');
   chart='<svg class="market-chart" viewBox="0 0 630 240" role="img" aria-label="2017년부터 2026년까지 선택 면적 구간의 연평균 매매 실거래가. 미확보 연도는 비워 표시."><text x="20" y="23">억원</text>'+grid+paths+points+series.map(r=>'<text x="'+x(r.year)+'" y="221" text-anchor="middle">'+String(r.year).slice(2)+'</text>').join('')+'</svg><div id="market-point-label" class="market-label">점을 누르면 해당 연도의 평균 가격을 볼 수 있어요.</div>';
   chart+='<div class="market-summary"><span>확인 연도<b>'+known.length+'/10년</b></span><span>확인 평균 최저<b>'+money(min)+'</b></span><span>확인 평균 최고<b>'+money(max)+'</b></span></div>';
  }
  const coverage=known.length<10?'<div class="coverage">자료 확보 범위: '+(known.length?known[0].year+'~'+known.at(-1).year+'년':'미확보')+'. 빈 연도는 미확보 또는 집계 제외이며 가격을 추정하지 않았어요.</div>':'';
  const annualTable='<div class="market-table-wrap"><table class="history"><thead><tr><th>연도</th><th>평균 매매가</th><th>거래 건수</th><th>전년 대비</th></tr></thead><tbody>'+[...series].reverse().map(r=>{const prev=series.find(p=>p.year===r.year-1);let change=Number.isFinite(r.price)&&Number.isFinite(prev?.price)?(r.price/prev.price-1)*100:null;return'<tr><td>'+r.year+(r.year===2026?' · 집계 중':'')+'</td><td>'+(Number.isFinite(r.price)?money(r.price):'자료 없음')+'</td><td>'+(r.count!==null&&r.count!==undefined?r.count+'건':'—')+'</td><td>'+(change!==null?(change>0?'+':'')+change.toFixed(1)+'%':'—')+'</td></tr>'}).join('')+'</tbody></table></div>';
  const transactions=(record.transactions||[]).filter(t=>Math.ceil(t.area/5)*5===band).sort((x,y)=>y.date.localeCompare(x.date)).slice(0,10);
  const trades='<details><summary>최근 개별 거래 내역 '+transactions.length+'건</summary>'+(transactions.length?'<div class="market-table-wrap"><table class="history"><thead><tr><th>계약일</th><th>전용면적</th><th>층</th><th>거래금액</th></tr></thead><tbody>'+transactions.map(t=>'<tr><td>'+esc(t.date)+'</td><td>'+Number(t.area)+'㎡</td><td>'+esc(t.floor)+'</td><td>'+money(t.price)+'</td></tr>').join('')+'</tbody></table></div>':'<p class="meta">이 면적 구간의 개별 거래 내역은 아직 확보하지 못했어요.</p>')+'</details>';
  content.innerHTML='<div class="meta">2017–2026 · 면적별 연평균 매매 실거래가 · 호가와 별도 집계</div>'+coverage+chart+annualTable+trades+'<p class="meta">자료: '+(url?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(record.sourceLabel||'실거래 공개자료 재집계')+'</a>':'자료 미확보')+'<br>원자료 페이지 갱신: '+esc(record.sourceUpdated||'미확인')+' · 확인: '+esc(record.checkedAt)+'<br>'+esc(record.groupingNote||'전용면적을 5㎡ 올림 구간으로 묶은 평균입니다. 거래 구성에 따라 달라지며, 현재 호가의 면적·타입과 다를 수 있습니다.')+'<br>개별 거래금액은 출처의 반올림 표시값입니다. 집계 제외·미확보는 0원으로 그리지 않습니다.</p>';
  content.querySelectorAll('[data-year]').forEach(p=>{const show=()=>{const r=known.find(r=>r.year===Number(p.dataset.year));document.getElementById('market-point-label').textContent=r.year+'년 평균 '+money(r.price)+(r.count!=null?' · '+r.count+'건':'')};p.onmouseenter=show;p.onclick=show;p.onfocus=show;p.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show()}}});
 }
 selector.onchange=draw;draw();
};
