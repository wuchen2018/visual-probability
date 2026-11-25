import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {entries}=JSON.parse(await fs.readFile(path.join(root,'src/catalog.json'),'utf8'));
const out=path.join(root,'docs');
async function inline(folder){
 let html=await fs.readFile(path.join(folder,'index.html'),'utf8');
 for(const m of [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)]){
  const css=await fs.readFile(path.resolve(folder,m[1].split('?')[0]),'utf8');
  html=html.replace(m[0],()=>'<style>'+css+'</style>');
 }
 let scripts='';
 for(const m of [...html.matchAll(/<script\b([^>]*?)src="([^"]+)"([^>]*)><\/script>/g)]){
  let js=await fs.readFile(path.resolve(folder,m[2].split('?')[0]),'utf8');
  if(m[1].includes('module')||m[3].includes('module')){
   const model=await fs.readFile(path.join(folder,'model.mjs'),'utf8');
   js=model.replace(/\bexport\s+/g,'')+'\n'+js.replace(/^import[^;]+;\s*/m,'');
  }
  scripts+='<script>'+js+'</script>';html=html.replace(m[0],'');
 }
 return html.replace('</body>',()=>scripts+'</body>');
}
function navigation(html,href){
 let found=false;
 html=html.replace(/<a\b[^>]*>[\s\S]*?<\/a>/g,a=>{
  if(!a.replace(/<[^>]*>/g,'').includes('实验目录'))return a;
  found=true;return a.replace(/href\s*=\s*["'][^"']*["']/i,'href="'+href+'"').replace('第三批实验目录','实验目录');
 });
 if(!found)html=html.replace(/<header\b[^>]*>[\s\S]*?<\/header>/,'<header class="shell masthead"><span class="brand"><span class="stamp" aria-hidden="true">武</span>武辰的概率论交互实验</span><a href="'+href+'">实验目录</a></header>');
 return html;
}
await fs.mkdir(out,{recursive:true});
for(const e of entries){
 const source=path.join(root,'src',e.source),dir=path.join(out,e.slug);
 await fs.mkdir(dir,{recursive:true});
 let html=navigation(await inline(source),'../index.html');
 html=html.replaceAll('href="../../samples/bayes-theorem.pdf"','href="https://wuchen2018.github.io/probability-book/samples/bayes-theorem.pdf"');
 if(e.slug==='berkson'){
  html=html.replaceAll('hospital/index.html','hospital.html');
  let hospital=navigation(await inline(path.join(source,'hospital')),'../index.html');
  hospital=hospital.replaceAll('href="../index.html"','href="index.html"');
  hospital=hospital.replace('href="index.html">实验目录','href="../index.html">实验目录');
  await fs.writeFile(path.join(dir,'hospital.html'),hospital);
 }
 await fs.writeFile(path.join(dir,'index.html'),html);
}
await fs.copyFile(path.join(root,'src/catalog.html'),path.join(out,'index.html'));
await fs.writeFile(path.join(out,'.nojekyll'),'');
console.log('Built '+entries.length+' experiments, one supplement and the catalog.');
