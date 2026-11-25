(()=>{'use strict';const $=id=>document.getElementById(id),geom=new Map(),states={};let render=null;
const f=(v,d=3)=>v===null?'无法计算':!Number.isFinite(v)?'无法计算':v===0?'0':Math.abs(v)>1e7||(Math.abs(v)>0&&Math.abs(v)<1e-4)?v.toExponential(2):new Intl.NumberFormat('zh-CN',{maximumFractionDigits:d}).format(v);
const pct=v=>v===null?'无法计算':v>0&&v<1e-8?'<0.000001%':v>0&&v<1e-4?new Intl.NumberFormat('zh-CN',{maximumFractionDigits:8}).format(v*100)+'%':f(v*100,2)+'%';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function plot(id,o){const svg=$(id);if(!svg)return;const r=svg.getBoundingClientRect(),w=r.width,h=r.height;if(!w||!h)return;let left=o.left||60,top=22,iw=w-left-20,ih=h-top-51;if(o.equal){const unit=Math.min(iw/(o.x[1]-o.x[0]),ih/(o.y[1]-o.y[0])),nw=unit*(o.x[1]-o.x[0]),nh=unit*(o.y[1]-o.y[0]);left+=(iw-nw)/2;top+=(ih-nh)/2;iw=nw;ih=nh;}
const tx=x=>o.logX?Math.log10(x):x,ty=y=>o.logY?Math.log10(y):y,xd=o.x.map(tx),yd=o.y.map(ty),X=x=>left+(tx(x)-xd[0])/(xd[1]-xd[0])*iw,Y=y=>top+ih-(ty(y)-yd[0])/(yd[1]-yd[0])*ih;
const inverse=(cx,cy)=>({x:o.logX?10**(xd[0]+(cx-left)/iw*(xd[1]-xd[0])):xd[0]+(cx-left)/iw*(xd[1]-xd[0]),y:o.logY?10**(yd[0]+(top+ih-cy)/ih*(yd[1]-yd[0])):yd[0]+(top+ih-cy)/ih*(yd[1]-yd[0])});geom.set(id,{X,Y,inverse,svg,left,top,iw,ih});
let s=`<defs><clipPath id="${id}-clip"><rect x="${left}" y="${top}" width="${iw}" height="${ih}"/></clipPath></defs>`;
const ticks=(range,log)=>Array.from({length:4},(_,i)=>log?10**(Math.log10(range[0])+(Math.log10(range[1])-Math.log10(range[0]))*i/3):range[0]+(range[1]-range[0])*i/3);
for(const v of(o.xticks||ticks(o.x,o.logX))){s+=`<line class="gridline" x1="${X(v)}" y1="${top}" x2="${X(v)}" y2="${top+ih}"/><text x="${X(v)}" y="${top+ih+23}" text-anchor="middle">${esc(o.xtickLabels?.[v]??f(v,2))}</text>`;}
for(const v of(o.yticks||ticks(o.y,o.logY))){s+=`<line class="gridline" x1="${left}" y1="${Y(v)}" x2="${left+iw}" y2="${Y(v)}"/><text x="${left-8}" y="${Y(v)+5}" text-anchor="end">${esc(o.ytickLabels?.[v]??f(v,2))}</text>`;}
s+=`<path class="axis" d="M${left},${top} V${top+ih} H${left+iw}" fill="none"/><text class="axislabel" x="${left+iw/2}" y="${Math.min(h-5,top+ih+47)}" text-anchor="middle">${esc(o.xlabel||'')}</text><text class="axislabel" transform="translate(${Math.max(15,left-45)},${top+ih/2}) rotate(-90)" text-anchor="middle">${esc(o.ylabel||'')}</text><g clip-path="url(#${id}-clip)">`;
for(const poly of o.polygons||[])s+=`<polygon points="${poly.points.map(p=>`${X(p.x)},${Y(p.y)}`).join(' ')}" fill="${poly.color||'#26725f'}" opacity="${poly.opacity||.12}"/>`;
for(const b of o.bars||[]){if(b.y===null)continue;const bw=b.width||(o.x[1]-o.x[0])/(o.bars.length+1)*.65;s+=`<rect x="${X(b.x-bw/2)}" y="${Y(b.y)}" width="${Math.max(1,X(b.x+bw/2)-X(b.x-bw/2))}" height="${Math.max(0,Y(o.logY?o.y[0]:Math.max(0,o.y[0]))-Y(b.y))}" fill="${b.color||'#26725f'}" opacity=".78"/>`;}
for(const series of o.series||[]){const data=series.data.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&(!o.logX||p.x>0)&&(!o.logY||p.y>0));if(!data.length)continue;const d=data.map((p,i)=>`${i?'L':'M'}${X(p.x)},${Y(p.y)}`).join(' ');if(series.fill)s+=`<path d="${d} L${X(data.at(-1).x)},${Y(o.logY?o.y[0]:0)} L${X(data[0].x)},${Y(o.logY?o.y[0]:0)} Z" fill="${series.color||'#26725f'}" opacity=".15"/>`;s+=`<path d="${d}" fill="none" stroke="${series.color||'#26725f'}" stroke-width="${series.width||2}" ${series.dash?'stroke-dasharray="5 4"':''}/>`;}
for(const line of o.guides||[]){s+=`<path d="M${X(line.a.x)},${Y(line.a.y)} L${X(line.b.x)},${Y(line.b.y)}" fill="none" stroke="${line.color||'#a96239'}" stroke-width="2" ${line.dash?'stroke-dasharray="5 4"':''}/>`;}
s+='</g>';
for(const p of(o.points||[]))s+=`<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${p.r||5}" fill="${p.color||'#26725f'}" class="visible-point"/>`;
if(o.extra)s+=o.extra({X,Y,left,top,iw,ih,w,h});svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
let content=svg.querySelector(':scope > [data-plot-content]'),handles=svg.querySelector(':scope > [data-drag-layer]');
if(!content){content=document.createElementNS('http://www.w3.org/2000/svg','g');content.setAttribute('data-plot-content','');svg.appendChild(content);}
if(!handles){handles=document.createElementNS('http://www.w3.org/2000/svg','g');handles.setAttribute('data-drag-layer','');svg.appendChild(handles);}
content.innerHTML=s;
const keep=new Set();for(const[i,p]of(o.points||[]).entries()){if(!p.drag)continue;const key=String(p.key??i);keep.add(key);let hit=[...handles.children].find(n=>n.dataset.dragPoint===key);if(!hit){hit=document.createElementNS('http://www.w3.org/2000/svg','circle');hit.setAttribute('class','drag-hit');hit.setAttribute('r','13');hit.setAttribute('fill','transparent');hit.dataset.dragPoint=key;handles.appendChild(hit);}hit.setAttribute('cx',X(p.x));hit.setAttribute('cy',Y(p.y));}for(const hit of [...handles.children])if(!keep.has(hit.dataset.dragPoint))hit.remove();return geom.get(id);
}
function bind(fn){
render=fn;
document.querySelectorAll('input[data-num]').forEach(n=>{
 const k=n.dataset.num,range=document.querySelector(`[data-range="${k}"]`),er=$('error-'+k);
 states[k]=Number(n.value);
 const clear=()=>{n.removeAttribute('aria-invalid');if(er)er.textContent='';};
 const update=e=>{
  if(e.target.value===''&&!e.target.validity.badInput){clear();return;}
  const v=Number(e.target.value),min=Number(n.min),max=Number(n.max),step=Number(n.step||1);
  if(!Number.isFinite(v)||v<min||v>max||Math.abs((v-min)/step-Math.round((v-min)/step))>1e-6){
   n.setAttribute('aria-invalid','true');
   if(er)er.textContent=`请填${f(min)}到${f(max)}之间${step===1?'的整数':`、间隔为${f(step)}的数`}，暂时仍按刚才的${f(states[k])}计算。`;
   return;
  }
  states[k]=v;n.value=v;if(range)range.value=v;clear();render(states);
 };
 n.addEventListener('input',update);
 n.addEventListener('blur',()=>{if(n.value===''&&!n.validity.badInput){n.value=states[k];clear();}});
 if(range)range.addEventListener('input',update);
});
window.addEventListener('resize',()=>{clearTimeout(window.__resizeLab);window.__resizeLab=setTimeout(()=>render(states),80);});
fn(states);document.documentElement.dataset.labReady='true';
}
function set(values){for(const[k,v]of Object.entries(values)){states[k]=v;const n=document.querySelector(`[data-num="${k}"]`),r=document.querySelector(`[data-range="${k}"]`);if(n){n.value=v;n.removeAttribute('aria-invalid');}if(r)r.value=v;const e=$('error-'+k);if(e)e.textContent='';}if(render)render(states);}
function drag(id,fn){const svg=$(id);let active=null;svg.addEventListener('touchstart',e=>{if(e.target.closest('[data-drag-point]'))e.preventDefault();},{passive:false});svg.addEventListener('touchmove',e=>{if(active)e.preventDefault();},{passive:false});svg.addEventListener('pointerdown',e=>{const t=e.target.closest('[data-drag-point]');if(!t||e.button!==0)return;active={pointer:e.pointerId,key:t.dataset.dragPoint};svg.setPointerCapture(e.pointerId);e.preventDefault();});svg.addEventListener('pointermove',e=>{if(!active||active.pointer!==e.pointerId)return;const r=svg.getBoundingClientRect(),p=geom.get(id).inverse(e.clientX-r.left,e.clientY-r.top);fn(p,active.key);});const end=e=>{if(active&&active.pointer===e.pointerId){if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);active=null;}};svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);}
function heat(id,values,{rows,cols,selectedRow=-1,onClick,cornerLabel='分组',caption='',cellLabels=[]}={}){
 const host=$(id),interactive=typeof onClick==='function';
 host.innerHTML=`<table class="heat">${caption?`<caption>${esc(caption)}</caption>`:''}<thead><tr><th class="heat-corner" scope="col">${esc(cornerLabel)}</th>${cols.map(c=>`<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((r,i)=>`<tr class="${i===selectedRow?'chosen-row':''}"><th scope="row">${esc(r)}</th>${cols.map((_,j)=>{
  const index=i*cols.length+j,value=values[index],tag=interactive?'button':'span';
  return `<td><${tag}${interactive?' type="button"':''} class="heat-value" data-cell="${index}" style="background:rgba(38,114,95,${value===null?0:.06+.7*value})"><span class="cell-probability">${value===null?'—':pct(value)}</span>${cellLabels[index]!==undefined?`<span class="cell-note">${esc(cellLabels[index])}</span>`:''}</${tag}></td>`;
 }).join('')}</tr>`).join('')}</tbody></table>`;
 if(interactive)host.querySelectorAll('[data-cell]').forEach(b=>b.addEventListener('click',()=>onClick(Number(b.dataset.cell))));
}
function series(fn,a,b,n=200){return Array.from({length:n+1},(_,i)=>({x:a+(b-a)*i/n,y:fn(a+(b-a)*i/n)}));}
function refresh(){if(render)render(states);}window.Lab={$,f,pct,esc,plot,bind,set,drag,heat,series,refresh,values:()=>({...states}),term:s=>`<span class="term">${esc(s)}</span>`,colors:['#26725f','#a96239','#5579a2','#9275a6']};
})();
