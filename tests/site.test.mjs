import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
const root=new URL('../dist/',import.meta.url);
async function walk(dir){return (await Promise.all((await readdir(dir,{withFileTypes:true})).map(async e=>e.isDirectory()?walk(new URL(e.name+'/',dir)):new URL(e.name,dir)))).flat();}
const pages=(await walk(root)).filter(p=>p.pathname.endsWith('.html'));
test('every internal link, fragment, script, stylesheet and font resolves',async()=>{
 for(const file of pages){
  const html=await readFile(file,'utf8');
  for(const [,raw] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
   if(/^(https?:|mailto:)/.test(raw))continue;
   const [name,hash]=raw.split('#');
   let target=name?new URL('.'+name,root):file;
   if((await stat(target)).isDirectory())target=new URL('index.html',target.href+'/');
   assert.ok((await stat(target)).isFile(),`${file.pathname}: ${raw}`);
   if(hash){const dest=await readFile(target,'utf8');assert.ok(dest.includes(`id="${hash}"`),`${file.pathname}: ${raw}`)}
  }
 }
});
test('pages have semantic and sharing metadata; content stays available without JS',async()=>{
 for(const file of pages){
  const html=await readFile(file,'utf8');
  for(const marker of ['<html lang="en">','name="viewport"','name="description"','rel="canonical"','property="og:title"','name="twitter:title"','<main id="main">'])assert.ok(html.includes(marker),`${file}: ${marker}`);
  assert.equal([...html.matchAll(/<h1[ >]/g)].length,1,`${file}: one h1`);
  const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,`${file}: duplicate IDs`);
 }
 const home=await readFile(new URL('index.html',root),'utf8');
 for(const id of ['work','problems','milestones','teaching','about','contact'])assert.ok(home.includes(`id="${id}"`));
 assert.ok(home.includes('src="/assets/hero-canvas.js"'));
});
