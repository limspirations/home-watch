import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),dist=path.join(root,'dist');
const html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
for(const match of html.matchAll(/<script\b[^>]*src="([^"]+)"/g)){const source=match[1].split('?')[0];if(source.startsWith('http'))throw Error('Unexpected remote script: '+source);if(!fs.existsSync(path.join(dist,source)))throw Error('Missing script: '+source)}
for(const dir of ['dist','scripts','tests'])for(const file of fs.readdirSync(path.join(root,dir))){if(!/\.(?:mjs|js)$/.test(file))continue;const result=spawnSync(process.execPath,['--check',path.join(root,dir,file)],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1)}
if(fs.existsSync(path.join(root,'.openai')))throw Error('Hosted Site metadata must not be in the standalone project');
console.log('Local assets, syntax, and standalone packaging checks passed.');
