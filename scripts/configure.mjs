import {writeFile} from 'node:fs/promises';
const enabled=process.env.ENABLE_CLOUD_SYNC==='true';
const supabaseUrl=(process.env.SUPABASE_URL||'').trim(),supabasePublishableKey=(process.env.SUPABASE_PUBLISHABLE_KEY||'').trim();
if(enabled){
 if(!supabaseUrl.startsWith('https://')||!supabasePublishableKey)throw Error('Cloud sync requires a HTTPS SUPABASE_URL and a browser-safe publishable/anon key');
 if(supabasePublishableKey.startsWith('sb_secret_'))throw Error('Secret keys cannot be put in browser code');
 try{const claims=JSON.parse(Buffer.from(supabasePublishableKey.split('.')[1]||'','base64url').toString());if(claims.role==='service_role')throw Error('service_role keys cannot be put in browser code')}catch(e){if(e.message.includes('service_role'))throw e}
}
const config={enableCloudSync:enabled,supabaseUrl:enabled?supabaseUrl:'',supabasePublishableKey:enabled?supabasePublishableKey:''};
await writeFile(new URL('../dist/config.js',import.meta.url),'// Public browser configuration only. Never include secret/service_role keys.\nwindow.HOME_WATCH_CONFIG = '+JSON.stringify(config,null,2)+';\n');
console.log(enabled?'Optional cloud sync configured; verify your Supabase settings and two-device behavior.':'Local-only configuration written.');
