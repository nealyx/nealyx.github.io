import {readFile} from 'node:fs/promises';
const site=JSON.parse(await readFile(new URL('../src/content/site.json',import.meta.url),'utf8'));
for(const url of [...site.socials.map(s=>s.url),'https://formspree.io/f/xnjwkbdv']){
 try { const response=await fetch(url,{signal:AbortSignal.timeout(15000),headers:{'User-Agent':'Mozilla/5.0'}});console.log(`${response.status} ${url}${response.redirected?' → '+response.url:''}`); }
 catch(e){console.log(`UNVERIFIED ${url}: ${e.message}`)}
}
