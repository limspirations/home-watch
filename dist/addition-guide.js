(function(){
 const byId=id=>document.getElementById(id),dialog=byId('additionmanual');
 function buildPrompt(){
  const repo=byId('manualrepo').value.trim()||'[GitHub 저장소 URL]',candidate=byId('manualcandidate').value.trim()||'[단지명 / 지역 / 주소 / 투자 목적 / 원하는 전용면적 / 네이버·KB 링크]';
  return `내 GitHub Pages 아파트 트래킹 사이트에 아래 아파트를 새 후보로 추가해줘. 설명만 하지 말고 연결된 GitHub 저장소를 확인해 실제로 수정해줘.

저장소: ${repo}
추가할 후보: ${candidate}

1. README와 현재 소스를 읽고 기존 카드·상세 화면·데이터 구조에 맞춰 추가해줘. 이 사이트는 dist/index.html, dist/app.js, dist/price-history.js 등을 사용하지만 실제 저장소 구조를 먼저 확인해줘.
2. 단지명·주소·지역·투자 목적·전용면적·매물 링크를 확인해줘. 단지 식별이 모호하면 질문하고, 임의의 단지나 면적을 선택하지 마.
3. 카드 가격은 기존 사이트 기준에 맞춰 네이버의 실제 확인 매물 호가와 확인일을 저장해줘. 실거래가·KB시세·KB 매물평균가를 호가와 혼동하지 말고, 다른 면적이나 타입을 섞지 마. 확인 못 한 값은 추정하지 마.
4. 클릭하면 전용면적·출처 링크·기존 방식의 최근 10년 실거래가 그래프와 가격표가 보이게 해줘. 실제 확보한 기간만 표시하고 과거 기록을 만들어내지 마. 기존 실거래가 화면은 유지해줘.
5. 기본 데이터와 기존 방문자의 저장 목록에 새 후보가 한 번만 추가되도록 해줘. 이미 저장한 후보·메모·수정 내용은 덮어쓰지 말고, 중복 추가도 방지해줘. 가격대는 현재 보드의 4억원 이상 규칙과 지역 구분을 따라줘.
6. 현재 디자인·제목·짧은 투자 목적 표시는 유지하고 불필요한 설명문이나 수동 가격 입력 기능을 추가하지 마.
7. 관련 동작을 확인한 뒤 변경 파일과 검증 결과를 정리하고 GitHub에 반영해줘. 현재 설정된 GitHub Pages 방식으로 배포가 완료됐는지 확인하고 실제 사이트 URL을 알려줘. 연결 권한이 부족하면 필요한 설정만 정확히 말해줘. 공개 범위나 호스팅 서비스는 임의로 바꾸지 마.`;
 }
 byId('additionguide').onclick=()=>{byId('manualprompt').value=buildPrompt();byId('manualcopystatus').textContent='';dialog.showModal()};
 byId('closemanual').onclick=()=>dialog.close();
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
 byId('buildmanualprompt').onclick=()=>{byId('manualprompt').value=buildPrompt();byId('manualcopystatus').textContent='입력한 정보를 반영했어요.'};
 for(const id of ['manualrepo','manualcandidate'])byId(id).addEventListener('input',()=>{byId('manualprompt').value=buildPrompt();byId('manualcopystatus').textContent=''});
 byId('copymanualprompt').onclick=async()=>{try{await navigator.clipboard.writeText(byId('manualprompt').value);byId('manualcopystatus').textContent='복사했어요.'}catch{byId('manualprompt').focus();byId('manualprompt').select();byId('manualcopystatus').textContent='복사 권한이 없어 내용을 선택했어요. 직접 복사해 주세요.'}};
})();
