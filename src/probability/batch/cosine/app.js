(() => {
 'use strict';const L=window.Lab,M=window.ProbModels,$=L.$,term=L.term;
 const presets={reset:{ux:2,uy:1,vx:1,vy:3},same:{ux:2,uy:1,vx:4,vy:2},perpendicular:{ux:2,uy:1,vx:-1,vy:2},opposite:{ux:2,uy:1,vx:-4,vy:-2},zero:{ux:2,uy:1,vx:0,vy:0},books:{ux:4.5,uy:.5,vx:4,vy:1},different:{ux:4.5,uy:.5,vx:.5,vy:4.5}};
 const names={reset:'起始示例',same:'同方向、不同长度',perpendicular:'互相垂直',opposite:'完全反向',zero:'v为零向量',books:'小说与历史演义',different:'小说与学术专著'};
 let active='reset';const text=(n,d=3)=>L.f(n,d).replaceAll('-','−');
 const factor=n=>n<0?`(${text(n)})`:text(n);
 function length(n){const units=Math.round(Math.sqrt(n)/10*1000);return {text:text(units/1000),sign:BigInt(n)*10000n===BigInt(units)**2n?'＝':'≈'};}
 function render(v){
  const u={x:v.ux,y:v.uy},w={x:v.vx,y:v.vy},a=M.cosine(u,w),[ux,uy,vx,vy]=[v.ux,v.uy,v.vx,v.vy].map(x=>Math.round(x*10));
  const dot=ux*vx+uy*vy,cross=ux*vy-uy*vx,n1=ux*ux+uy*uy,n2=vx*vx+vy*vy,valid=n1>0&&n2>0;
  const cos=valid?dot/Math.sqrt(n1*n2):null,units=valid?Math.round(cos*1000):0;
  const cosSign=valid&&BigInt(dot)**2n*1000000n===BigInt(units)**2n*BigInt(n1)*BigInt(n2)?'＝':'≈';
  const cosText=valid?`${cosSign}${text(units/1000)}`:'无法计算';
  const angle=valid?Math.atan2(Math.abs(cross),dot)*180/Math.PI:null;
  const angleExact=valid&&(cross===0||dot===0||Math.abs(cross)===Math.abs(dot));
  const angleText=valid?`${angleExact?'＝':'≈'}${text(angle,1)}°`:'无法计算';
  const lu=length(n1),lv=length(n2);
  L.plot('vectors',{equal:true,x:[-5,5],y:[-5,5],xticks:[-5,0,5],yticks:[-5,0,5],xlabel:'第1个数（横坐标）',ylabel:'第2个数（纵坐标）',series:[{data:[{x:0,y:0},u]},{data:[{x:0,y:0},w],color:'#a96239'}],points:[{...u,color:'#26725f',drag:true,key:'u'},{...w,color:'#a96239',drag:true,key:'v'}],extra:({X,Y,left,top,iw,ih})=>{
   const ox=X(0),oy=Y(0),vectors=[{p:u,key:'u',color:'#26725f',n:n1},{p:w,key:'v',color:'#a96239',n:n2}];let svg='';
   const positions=[];
   for(const [i,{p,key,color,n}]of vectors.entries()){
    const px=X(p.x),py=Y(p.y),dx=px-ox,dy=py-oy,d=Math.hypot(dx,dy);
    if(n)svg+=`<polygon class="vector-head" data-vector="${key}" pointer-events="none" points="0,0 -10,-5 -10,5" fill="${color}" transform="translate(${px},${py}) rotate(${Math.atan2(dy,dx)*180/Math.PI})"/>`;
    const ex=d?dx/d:0,ey=d?dy/d:0,side=i===0?-1:1;
    positions.push({key,color,zero:!n,x:Math.max(left+12,Math.min(left+iw-12,px+ex*12-ey*side*13)),y:Math.max(top+15,Math.min(top+ih-8,py+ey*12+ex*side*13+(n?0:side*18)))});
   }
   if(Math.hypot(positions[0].x-positions[1].x,positions[0].y-positions[1].y)<25){positions[0].y=Math.max(top+13,positions[0].y-13);positions[1].y=Math.min(top+ih-8,positions[1].y+13);}
   for(const p of positions)svg+=`<text class="vector-label" data-vector="${p.key}" x="${p.x}" y="${p.y}" text-anchor="middle" style="fill:${p.color};font-weight:700;paint-order:stroke;stroke:#fcfdfb;stroke-width:4px" pointer-events="none">${p.key}${p.zero?'＝0':''}</text>`;
   if(valid&&cross!==0){
    const start=Math.atan2(Y(u.y)-oy,X(u.x)-ox),end=Math.atan2(Y(w.y)-oy,X(w.x)-ox);let delta=end-start;
    while(delta>Math.PI)delta-=2*Math.PI;while(delta< -Math.PI)delta+=2*Math.PI;
    const radius=Math.min(28,Math.hypot(X(u.x)-ox,Y(u.y)-oy)*.45,Math.hypot(X(w.x)-ox,Y(w.y)-oy)*.45);
    const point=(theta,r=radius)=>({x:ox+r*Math.cos(theta),y:oy+r*Math.sin(theta)});
    const startP=point(start),endP=point(start+delta);
    if(dot===0){const corner={x:startP.x+endP.x-ox,y:startP.y+endP.y-oy};svg+=`<path class="angle-mark right-angle" d="M${startP.x},${startP.y} L${corner.x},${corner.y} L${endP.x},${endP.y}"/>`;}
    else svg+=`<path class="angle-mark" d="M${startP.x},${startP.y} A${radius},${radius} 0 0 ${delta>0?1:0} ${endP.x},${endP.y}"/>`;
   }
   return svg;
  }});
  $('local-vector-result').textContent=`当前余弦相似度${cosText}，夹角${angleText}。`;
  $('metrics').innerHTML=[['余弦相似度',cosText],['夹角',angleText],['点积',`＝${text(dot/100)}`]].map(([name,value])=>`<div class="metric"><span>${name}</span><strong>${value}</strong></div>`).join('');
  $('calculation').innerHTML=`<p>${term(`u＝(${text(u.x)}, ${text(u.y)})`)}，${term(`v＝(${text(w.x)}, ${text(w.y)})`)}。</p><p>点积${term(`＝${factor(u.x)}×${factor(w.x)}`)}${term(`＋${factor(u.y)}×${factor(w.y)}`)}${term(`＝${text(dot/100)}`)}。</p><p>u长度${term(`＝√[(${text(u.x)})²＋(${text(u.y)})²]`)}${term(lu.sign+lu.text)}。</p><p>v长度${term(`＝√[(${text(w.x)})²＋(${text(w.y)})²]`)}${term(lv.sign+lv.text)}。</p><p>${valid?`余弦相似度＝点积÷两根向量长度的乘积。<br>用原式计算：${term(`＝${factor(dot/100)}÷`)}${term(`(√${text(n1/100)}×√${text(n2/100)})`)}${term(cosText)}。`:'有一根向量的长度是0，分母不能为0，所以算不出相似度。'}</p>`;
  $('explain').textContent=!valid?`${n1===0&&n2===0?'两根向量':n1===0?'u':'v'}缩成原点上的一个点，长度为0，没有方向。算不出两根箭头的夹角，也算不出余弦相似度。`:cross===0&&dot>0?'两根向量同方向，夹角＝0°，余弦相似度＝1。长度可以不同。':cross===0&&dot<0?'两根向量完全反向，夹角＝180°，余弦相似度＝−1。':dot===0?'两根向量垂直，夹角＝90°，点积和余弦相似度都＝0。':`当前夹角${angleExact?'':'约'}${text(angle,1)}°。余弦相似度越接近1，方向越接近；等于0时垂直，等于−1时完全反向。`;
  if(active&&!Object.entries(presets[active]).every(([k,value])=>v[k]===value))active='';
  for(const key of Object.keys(presets))$(key).setAttribute('aria-pressed',String(key===active));
  $('preset-note').textContent=active?`当前：${names[active]}。`:'当前是你调整后的两根向量。';
  $('scenario-feedback').textContent=active==='books'?`当前小说u＝(4.5,0.5)，历史演义v＝(4,1)，相似度${cosText}。两本都偏向情节较强、知识评分较低的方向。`:active==='different'?`当前小说u＝(4.5,0.5)，学术专著v＝(0.5,4.5)，相似度${cosText}。在这两项模拟评分上，二者方向差得更多。`:'点上面的按钮，比较两组模拟书籍评分，看看同一计算怎样用于比较。';
 }
 L.bind(render);
 L.drag('vectors',(p,key)=>{active='';L.set(key==='u'?{ux:Math.round(Math.max(-5,Math.min(5,p.x))*10)/10,uy:Math.round(Math.max(-5,Math.min(5,p.y))*10)/10}:{vx:Math.round(Math.max(-5,Math.min(5,p.x))*10)/10,vy:Math.round(Math.max(-5,Math.min(5,p.y))*10)/10});});
 for(const [key,values] of Object.entries(presets))$(key).onclick=()=>{active=key;L.set(values);};
})();
