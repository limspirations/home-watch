import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const base=new URL('../',import.meta.url);
const read=f=>fs.readFileSync(new URL(f,base),'utf8');
export function createApp(){
 const nodes=new Map(),stored=new Map();
 const node=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',value:'',style:{},open:false,events:{},querySelectorAll:()=>[],addEventListener(n,f){this.events[n]=f},showModal(){this.open=true},close(){this.open=false},focus(){},select(){this.selected=true}});return nodes.get(id)};
 const c={window:{},document:{getElementById:node},navigator:{clipboard:{writeText:async s=>{c.copied=s}}},localStorage:{getItem:k=>stored.get(k)??null,setItem:(k,v)=>stored.set(k,v)},structuredClone,Intl,Date,URL,console,setTimeout};
 vm.createContext(c);for(const f of ['price-history.js','app.js','long-history.js','addition-guide.js'])vm.runInContext(read('dist/'+f),c);
 return {c,node};
}
test('all 10 seeded candidates preserve their detail chart and tables',()=>{const {c,node}=createApp();const data=c.window.homeWatch.getData();assert.equal(data.length,10);for(const a of data){c.openDetail(a.id);assert(node('detailcontent').innerHTML.includes('전용면적'));assert(node('market-content').innerHTML.includes('<svg'));assert(node('market-content').innerHTML.includes('<table'));assert(!node('market-content').innerHTML.includes('NaN'));}assert(!node('board').innerHTML.includes('전용 '));assert(read('dist/index.html').includes('수도권 집 후보 매매가 트래킹'));});
test('snapshot matches current seed; JSON backup round-trip preserves edits',()=>{const {c}=createApp();const data=c.window.homeWatch.getData(),snapshot=JSON.parse(read('data/default-board-backup.json'));assert.deepEqual(JSON.parse(JSON.stringify(data)),snapshot.data);assert(c.window.homeWatch.isValid(snapshot.data));data[0].memo='이전 후에도 보존할 메모';c.window.homeWatch.replaceData(JSON.parse(JSON.stringify(data)));assert.equal(c.window.homeWatch.getData()[0].memo,'이전 후에도 보존할 메모');});
test('GitHub guide uses provided repository and candidate details and copies edited prompt',async()=>{const {c,node}=createApp();node('additionguide').onclick();assert(node('additionmanual').open);node('manualrepo').value='https://github.com/example/home-watch';node('manualcandidate').value='추가 후보 / 동탄';node('manualcandidate').events.input();assert(node('manualprompt').value.includes('https://github.com/example/home-watch'));node('manualprompt').value+='\n추가 조건';await node('copymanualprompt').onclick();assert(c.copied.endsWith('추가 조건'));node('closemanual').onclick();assert(!node('additionmanual').open);});
