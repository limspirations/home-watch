// Home Watch: one shared board, authenticated members only.
const copy = x => structuredClone(x);
const canonical = v => v && typeof v === 'object' ? Array.isArray(v) ? v.map(canonical) : Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])) : v;
const equal = (a,b) => JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
const nameKey = a => String(a.name).normalize('NFKC').replace(/[\s\\·ㆍ,()\-\u200B-\u200F\uFEFF]/g,'').replace(/^동탄/,'').toLowerCase();
export function mergeInitial(shared,local){
  const result=copy(shared), ids=new Set(result.map(a=>a.id)),names=new Set(result.map(nameKey));
  for(const a of local){if(ids.has(a.id)||names.has(nameKey(a)))continue;result.push(copy(a));ids.add(a.id);names.add(nameKey(a));}
  return result;
}
export function mergeChanges(base,local,remote){
  const maps=[base,local,remote].map(rows=>new Map(rows.map(a=>[a.id,a]))),[b,l,r]=maps;
  const result=copy(remote), conflicts=[];
  for(const id of new Set([...b.keys(),...l.keys()])){
    const before=b.get(id),mine=l.get(id),theirs=r.get(id);
    if(equal(before,mine)||equal(mine,theirs))continue;
    if(!equal(before,theirs)){conflicts.push((mine||theirs||before).name);continue;}
    if(mine&&!before&&result.some(a=>a.id!==id&&nameKey(a)===nameKey(mine))){conflicts.push(mine.name);continue;}
    const i=result.findIndex(a=>a.id===id);
    if(mine){if(i>=0)result[i]=copy(mine);else result.push(copy(mine));}else if(i>=0)result.splice(i,1);
  }
  return {items:result,conflicts};
}
export async function readShared(client){
  const {data,error}=await client.from('shared_home_board').select('items,revision').eq('id',1).maybeSingle();
  if(error)throw error;
  if(!data)throw Error('공동 목록 접근 권한이 없습니다. Supabase 회원 등록을 확인하세요.');
  return data;
}
export async function writeShared(client,items,revision){
  const {data,error}=await client.from('shared_home_board').update({items,revision:revision+1,updated_at:new Date().toISOString()}).eq('id',1).eq('revision',revision).select('revision').maybeSingle();
  if(error)throw error;
  return data?.revision??null;
}
if(typeof window!=='undefined')start();
function start(){
 const ui=id=>document.getElementById(id),app=window.homeWatch,config=window.HOME_WATCH_CONFIG||{};
 let client,user=null,base=null,revision=null,busy=false,dirty=false,blocked=false,epoch=0,timer,authorized=false;
 const key=id=>'home-watch-shared-pending-v1-'+id, firstKey=id=>'home-watch-shared-joined-v1-'+id;
 const state=(title,sub='')=>{ui('syncstatus').textContent=title;ui('syncsub').textContent=sub;};
 const notify=s=>app.notify(s);
 const get=(k)=>{try{return JSON.parse(localStorage.getItem(k));}catch{return null;}};
 const modalOpen=()=>['detail','editor','additionmanual'].some(id=>ui(id)?.open);
 const controls=()=>{ui('add').disabled=!!user&&!authorized;ui('import').disabled=!!user;ui('logout').hidden=!user;ui('refreshcloud').hidden=!user||!authorized;ui('cloudopen').textContent=user?'공동 목록 동기화':'공동 목록 로그인';ui('hw-set-password').hidden=!user||!authorized;};
 function persist(){if(!user)return;try{if(dirty)localStorage.setItem(key(user.id),JSON.stringify({base,revision,draft:app.getData()}));else localStorage.removeItem(key(user.id));}catch{state('브라우저 저장 오류','현재 화면에서 백업을 내보내 주세요.');}}
 function validate(row){if(!app.isValid(row.items)||!Number.isSafeInteger(row.revision)||row.revision<1)throw Error('공동 목록 데이터 형식 오류');return row;}
 function conflict(names){blocked=true;dirty=true;persist();state('동시 수정 충돌',names.join(', ')+' — 이 기기의 변경은 보존되어 있어요. 백업 후 최신 기록을 불러오거나 상대방과 확인하세요.');}
 function failure(e){state('동기화 보류',String(e?.message||'연결 오류')+' · 이 기기의 목록은 보존됩니다.');console.warn('Home Watch sync:',e?.message);}
 async function sync(){
  if(!user||!authorized||busy||blocked)return;
  busy=true;const gen=epoch;
  try{
   for(let attempt=0;attempt<3;attempt++){
    const row=validate(await readShared(client));if(gen!==epoch)return;
    if(!dirty){if(row.revision!==revision){app.replaceData(row.items);base=copy(row.items);revision=row.revision;}state('공동 목록 동기화 완료','두 사람의 아파트 목록이 연결되어 있어요.');return;}
    const snapshot=app.getData(),merged=mergeChanges(base,snapshot,row.items);
    if(merged.conflicts.length){conflict(merged.conflicts);return;}
    if(!app.isValid(merged.items))throw Error('합친 목록의 데이터 형식을 확인하세요.');
    const next=equal(merged.items,row.items)?row.revision:await writeShared(client,merged.items,row.revision);
    if(gen!==epoch)return;
    if(next===null)continue;
    const now=app.getData(),follow=mergeChanges(snapshot,now,merged.items);
    base=copy(merged.items);revision=next;
    if(follow.conflicts.length){conflict(follow.conflicts);return;}
    app.replaceData(follow.items);dirty=!equal(follow.items,base);persist();
    state(dirty?'추가 변경 저장 중':'공동 목록 동기화 완료','다른 기기에도 자동 반영됩니다.');return;
   }
   failure(Error('다른 기기에서 연속 수정 중입니다. 다시 동기화해 주세요.'));
  }catch(e){if(gen===epoch)failure(e);}finally{if(gen===epoch){busy=false;if(dirty&&!blocked&&ui('syncstatus').textContent==='추가 변경 저장 중')schedule();}}
 }
 function schedule(){clearTimeout(timer);timer=setTimeout(sync,400);}
 window.homeCloud={changed(){if(!user||!authorized)return;dirty=true;persist();state('공동 목록 저장 중',blocked?'충돌을 해결하기 전에는 서버를 덮어쓰지 않아요.':'다른 기기와 변경 사항을 맞추고 있어요.');if(!blocked)schedule();}};
 async function activate(session){
  const next=session?.user||null;if(next?.id===user?.id)return;
  const guest=!user?app.getData():null;epoch++;const gen=epoch;clearTimeout(timer);user=next;base=null;revision=null;busy=false;dirty=false;blocked=false;authorized=false;controls();
  for(const id of ['detail','editor','additionmanual'])ui(id)?.close();
  if(!user){app.switchUser(null);state('공동 목록 로그인 필요','로그인 전에는 이 브라우저에만 저장됩니다.');return;}
  ui('cloudlogin').close();state('공동 목록 연결 중','접근 권한을 확인하고 있어요.');busy=true;
  try{
   const row=validate(await readShared(client));if(gen!==epoch)return;
   const pending=get(key(user.id)),old=get('hyokyung-home-watch-user-'+user.id);
   if(app.isValid(old)&&!localStorage.getItem(firstKey(user.id)))localStorage.setItem('home-watch-pre-shared-backup-'+user.id,JSON.stringify(old));
   app.switchUser(user.id);base=copy(row.items);revision=row.revision;authorized=true;
   if(pending&&app.isValid(pending.base)&&app.isValid(pending.draft)&&Number.isSafeInteger(pending.revision)){
    base=pending.base;revision=pending.revision;app.replaceData(pending.draft);dirty=true;
   }else{
    let list=copy(row.items);
    if(!localStorage.getItem(firstKey(user.id))){
     const candidates=mergeInitial(Array.isArray(guest)?guest:[],app.isValid(old)?old:[]);
     const combined=mergeInitial(list,candidates),count=combined.length-list.length;
     if(count>0&&confirm('이 브라우저의 기존 아파트 '+count+'개를 공동 목록에 추가할까요? 같은 단지는 공동 목록을 유지합니다. 기존 개인 목록도 별도로 보존됩니다.')){list=combined;}
     localStorage.setItem(firstKey(user.id),'1');
    }
    app.replaceData(list);dirty=!equal(list,base);
   }
   persist();controls();state(dirty?'공동 목록 저장 준비':'공동 목록 동기화 완료','두 사람의 목록을 함께 관리할 수 있어요.');
  }catch(e){if(gen===epoch){authorized=false;controls();failure(e);}}
  finally{if(gen===epoch){busy=false;if(dirty&&authorized)schedule();}}
 }
 // Keep the existing modal, with password login as a mail-independent option.
 const form=ui('loginform'),password=document.createElement('input');password.type='password';password.id='hw-login-password';password.autocomplete='current-password';password.placeholder='비밀번호 (설정한 경우)';password.style.cssText='width:100%;margin-top:10px';form.insertBefore(password,ui('sendlink'));
 ui('sendlink').textContent='로그인';ui('cloudhelp').textContent='등록된 이메일로 로그인하세요. 비밀번호가 없다면 비워 두고 이메일 링크를 요청하세요.';
 const setButton=document.createElement('button');setButton.id='hw-set-password';setButton.textContent='비밀번호 설정';setButton.hidden=true;ui('logout').before(setButton);
 const pwDialog=document.createElement('dialog');pwDialog.innerHTML='<form class="panel" id="hw-pw-form"><div class="paneltop"><h2>로그인 비밀번호 설정</h2><button type="button" id="hw-pw-close">✕</button></div><label>새 비밀번호 (12자 이상)</label><input id="hw-new-pw" type="password" minlength="12" required autocomplete="new-password" style="width:100%"><button class="primary" style="margin-top:15px">저장</button><p id="hw-pw-status" role="status"></p></form>';document.body.append(pwDialog);
 setButton.onclick=()=>{ui('hw-new-pw').value='';ui('hw-pw-status').textContent='';pwDialog.showModal();};ui('hw-pw-close').onclick=()=>pwDialog.close();
 ui('hw-pw-form').onsubmit=async e=>{e.preventDefault();if(!authorized)return;const {error}=await client.auth.updateUser({password:ui('hw-new-pw').value});if(error){ui('hw-pw-status').textContent=error.message;return;}ui('hw-new-pw').value='';pwDialog.close();notify('로그인 비밀번호를 설정했어요.');};
 ui('closecloud').onclick=()=>ui('cloudlogin').close();ui('cloudlogin').addEventListener('click',e=>{if(e.target===ui('cloudlogin'))ui('cloudlogin').close();});
 ui('cloudopen').onclick=()=>{if(!user){ui('cloudlogin').showModal();return;}if(!authorized){const previous=user;user=null;activate({user:previous});return;}if(blocked){notify('먼저 백업을 내보낸 후 최신 기록을 불러오세요.');return;}sync();};
 ui('refreshcloud').onclick=async()=>{if(busy||!authorized)return;if(dirty&&!confirm('이 기기의 아직 저장하지 못한 변경을 버리고 공동 목록을 불러올까요? 먼저 백업을 권장합니다.'))return;busy=true;const gen=epoch,snapshot=app.getData();try{const row=validate(await readShared(client));if(gen!==epoch)return;if(!equal(snapshot,app.getData())){notify('불러오는 중 변경이 있어 기존 기록을 유지했어요.');return;}app.replaceData(row.items);base=copy(row.items);revision=row.revision;dirty=false;blocked=false;persist();state('공동 목록 동기화 완료','최신 목록을 불러왔어요.');}catch(e){failure(e);}finally{if(gen===epoch)busy=false;}};
 ui('logout').onclick=async()=>{if(busy){notify('동기화 중입니다.');return;}if(dirty&&!confirm('미전송 변경을 이 브라우저에 보관하고 로그아웃할까요?'))return;persist();const {error}=await client.auth.signOut();if(error){notify('로그아웃 오류');return;}activate(null);};
 form.onsubmit=async e=>{e.preventDefault();if(!client)return;ui('sendlink').disabled=true;try{const email=ui('email').value.trim();const result=password.value?await client.auth.signInWithPassword({email,password:password.value}):await client.auth.signInWithOtp({email,options:{shouldCreateUser:false,emailRedirectTo:new URL('.',location.href).href}});password.value='';if(result.error)throw result.error;ui('loginmessage').textContent=result.data?.session?'로그인했어요.':'메일의 로그인 링크를 열어 주세요.';if(result.data?.session)activate(result.data.session);}catch(err){ui('loginmessage').textContent=err.message||'로그인 실패';}finally{ui('sendlink').disabled=false;}};
 async function init(){if(!config.enableCloudSync||!config.supabaseUrl||!config.supabasePublishableKey)return;document.querySelector('.syncbar').hidden=false;controls();state('공동 목록 로그인 필요','등록된 두 사람만 공동 목록에 접근할 수 있어요.');try{const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.49.8');client=createClient(config.supabaseUrl,config.supabasePublishableKey);client.auth.onAuthStateChange((_event,session)=>setTimeout(()=>activate(session),0));const {data,error}=await client.auth.getSession();if(error)throw error;await activate(data.session);setInterval(()=>{if(user&&authorized&&!modalOpen()&&!document.hidden)sync();},5000);window.addEventListener('focus',()=>{if(!modalOpen())sync();});window.addEventListener('online',()=>sync());}catch(e){failure(e);}}
 init();
}
