(()=>{
'use strict';
const L=Lab,C=Third,$=L.$,random=C.rng(20261123);
let triangles=[],triangleG=null;
const presets=[['equilateral',[0,120,240]],['right',[0,90,180]],['obtuse',[0,30,150]],['duplicate',[0,0,120]],['acute-reset',[0,120,240]]];
const relative=(a,b)=>((a-b)%360+360)%360;
function drawTriangle(html){
  const svg=$('triangle'),temp=document.createElementNS(svg.namespaceURI,'svg');temp.innerHTML=html;
  let content=svg.querySelector('[data-static]'),handles=svg.querySelector('[data-handles]');
  if(!content){content=document.createElementNS(svg.namespaceURI,'g');content.dataset.static='';svg.appendChild(content)}
  if(!handles){handles=document.createElementNS(svg.namespaceURI,'g');handles.dataset.handles='';svg.appendChild(handles)}
  for(const circle of temp.querySelectorAll('[data-angle]')){
    let target=handles.querySelector(`[data-angle="${circle.dataset.angle}"]`);
    if(!target){target=document.createElementNS(svg.namespaceURI,'circle');handles.appendChild(target)}
    for(const attr of circle.attributes)target.setAttribute(attr.name,attr.value);
    circle.remove();
  }
  content.innerHTML=temp.innerHTML;
}
function render(v){
  const angles=[v.angle0,v.angle1,v.angle2],ar=C.acute(angles),svg=$('triangle');
  const W=svg.getBoundingClientRect().width,R=W*.36,cx=W/2,cy=W/2;
  const pts=angles.map(a=>({x:cx+Math.cos(a*Math.PI/180)*R,y:cy-Math.sin(a*Math.PI/180)*R}));
  triangleG={W,R,cx,cy};svg.setAttribute('viewBox',`0 0 ${W} ${W}`);
  const labels=pts.map((p,i)=>{
    if(angles.some((a,j)=>j<i&&a===angles[i]))return '';
    const a=angles[i]*Math.PI/180,offset=23;
    const names=angles.map((v,j)=>v===angles[i]?'ABC'[j]:'').filter(Boolean).join('、');
    const half=names.length*6+2,x=Math.max(half,Math.min(W-half,p.x+Math.cos(a)*offset));
    const y=names.length>1?p.y-20:p.y-Math.sin(a)*offset+4;
    return `<text x="${x}" y="${y}" text-anchor="middle">${names}</text>`;
  }).join('');
  drawTriangle(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#9eafa3"/><polygon points="${pts.map(p=>`${p.x},${p.y}`).join(' ')}" fill="${ar.acute?'#e2eee6':'#f6ece0'}" stroke="${ar.acute?'#26725f':'#a96239'}" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="3.5" fill="#56645e"/><text x="${cx+7}" y="${cy-8}">O</text>${labels}${pts.map((p,i)=>`<circle data-angle="${i}" class="third-handle" cx="${p.x}" cy="${p.y}" r="11" fill="${['#26725f','#a96239','#5579a2'][i]}" stroke="white" stroke-width="2"/>`).join('')}`);
  const headline=ar.zero?'有些点重合了，连不成三角形':ar.right?'这是直角三角形':ar.acute?'这是锐角三角形':'这是钝角三角形';
  const reason=ar.zero?'点一个例子，或把重合的点拖开试试。':ar.right?'一个角恰好是90°，圆心在三角形的边上。':ar.acute?'三个角都小于90°，圆心在三角形内部。':'一个角大于90°，圆心在三角形外面。';
  $('acute-result').innerHTML=`<p><strong>${headline}</strong></p>${ar.zero?'':`<p class="angle-readings">${ar.angles.map((a,i)=>`<span class="term">∠${'ABC'[i]}${C.val(new C.R(a),2)}°</span>`).join('')}</p>`}<p>${reason}</p>`;
  const count=triangles.filter(t=>t.acute).length;
  $('acute-simulation').innerHTML=triangles.length
    ?`<p>电脑新选的500组中，<strong>${count}组是锐角三角形</strong>。</p><p>这一批的比例：<span class="term">${count} ÷ 500${C.prob(count/500,new C.R(count,500),2)}</span>。</p>`
    :'<p>电脑还没开始随机选点。</p><p>点“随机选500组”，这里会显示其中有多少组是锐角三角形，以及它们占多少。</p>';
  L.plot('acute-area',{
    x:[0,360],y:[0,360],left:47,equal:true,xticks:[0,180,360],yticks:[0,180,360],
    xlabel:'B 相对 A 的角度',ylabel:'C 相对 A 的角度',
    polygons:[{points:[{x:0,y:180},{x:180,y:180},{x:180,y:360}],opacity:.15},{points:[{x:180,y:0},{x:180,y:180},{x:360,y:180}],opacity:.15}],
    points:[...triangles.map(t=>({x:relative(t.input[1],t.input[0]),y:relative(t.input[2],t.input[0]),r:1.8,color:t.acute?'#26725f':'#a96239'})),{x:relative(angles[1],angles[0]),y:relative(angles[2],angles[0]),r:6,color:'#5579a2'}]
  });
  for(const[id,p]of presets.slice(0,4))$(id).setAttribute('aria-pressed',String(p.every((a,i)=>a===angles[i])));
  window.currentModel={...v,mode:'acute',acute:{...ar,input:angles},triangles};
}
L.bind(render);
for(const[id,values]of presets)$(id).onclick=()=>L.set(Object.fromEntries(values.map((a,i)=>['angle'+i,a])));
$('acute-sim').onclick=()=>{
  triangles=Array.from({length:500},()=>{const input=Array.from({length:3},()=>random()*360);return{input,...C.acute(input)}});
  L.refresh();
};
const svg=$('triangle');let active=null;
svg.addEventListener('pointerdown',e=>{
  const target=e.target.closest('[data-angle]');if(!target||e.button!==0)return;
  active={key:target.dataset.angle,pointer:e.pointerId};svg.setPointerCapture(e.pointerId);e.preventDefault();
});
svg.addEventListener('pointermove',e=>{
  if(!active||active.pointer!==e.pointerId)return;
  const b=svg.getBoundingClientRect(),g=triangleG;
  const a=Math.atan2(g.cy-(e.clientY-b.top),e.clientX-b.left-g.cx)*180/Math.PI;
  L.set({['angle'+active.key]:relative(Math.round(a),0)});e.preventDefault();
});
for(const type of ['pointerup','pointercancel'])svg.addEventListener(type,e=>{
  if(active&&active.pointer===e.pointerId){if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);active=null}
});
for(const type of ['touchstart','touchmove'])svg.addEventListener(type,e=>{if(active)e.preventDefault()},{passive:false});
})();
