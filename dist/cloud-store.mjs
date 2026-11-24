// Atomic compare-and-set: another device's newer revision is never overwritten.
export class RevisionConflict extends Error { constructor(){super('다른 기기에서 기록이 변경됐어요. 백업 후 최신 기록을 불러오세요.');this.name='RevisionConflict'} }
export async function readBoard(client, userId) {
 const {data,error}=await client.from('home_watch_boards').select('items, revision').eq('user_id',userId).maybeSingle();
 if(error)throw error;return data;
}
export async function writeBoard(client,userId,items,revision) {
 const table=client.from('home_watch_boards');
 const result=revision===null
  ?await table.insert({user_id:userId,items,revision:1}).select('revision').single()
  :await table.update({items,revision:revision+1,updated_at:new Date().toISOString()}).eq('user_id',userId).eq('revision',revision).select('revision').maybeSingle();
 if(result.error?.code==='23505')throw new RevisionConflict();
 if(result.error)throw result.error;
 if(!result.data)throw new RevisionConflict();return result.data.revision;
}
