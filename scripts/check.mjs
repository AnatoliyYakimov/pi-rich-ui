import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
for(const dir of ['lib','scripts','tests'])for(const name of readdirSync(new URL('../'+dir+'/',import.meta.url)))if(name.endsWith('.mjs')){
  const path=new URL('../'+dir+'/'+name,import.meta.url);
  const r=spawnSync(process.execPath,['--check',path.pathname],{stdio:'inherit'});if(r.status)process.exit(r.status??1);
}
console.log('JavaScript syntax checks passed.');
