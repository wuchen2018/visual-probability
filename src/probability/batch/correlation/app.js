(() => {
 'use strict';
 const L=window.Lab,M=window.ProbModels,$=L.$,term=L.term;
 const presets={positive:[1,1.9,3,3.8,5.4,5.7,7],perfect:[1,2,3,4,5,6,7],negative:[7,6,5,4,3,2,1],'u-shape':[9,4,1,0,1,4,9],outlier:[1,2,3,4,5,6,0],flat:[2,2,2,2,2,2,2]};
 const names={positive:'起始示例',perfect:'上升直线',negative:'下降直线','u-shape':'U形',outlier:'一个异常点',flat:'Y全部相同'};
 let points=presets.positive.map((y,i)=>({x:i+1,y})),active='positive',selected=0;
 const text=n=>L.f(n,3).replaceAll('-','−');
  const numberWord=v=>`${v.sign==='≈'?'约':''}${v.text}`;
 const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
 function fraction(num,den=1){const d=gcd(num,den);num/=d;den/=d;return den===1?text(num):`${text(num)}/${text(den)}`;}
 function decimal(num,den=1){const value=num/den,units=Math.round(value*1000);return {value,text:text(units/1000),sign:num*1000===units*den?'＝':'≈'};}
 function rootValue(num,den=1){const value=Math.sqrt(num/den),units=Math.round(value*1000);return {value,text:text(units/1000),sign:BigInt(num)*1000000n===BigInt(units)**2n*BigInt(den)?'＝':'≈'};}
 function describe(num,den=1){const d=decimal(num,den);return `${d.sign}${d.text}`;}
 function exact(){
  const xs=points.map(p=>Math.round(p.x*10)),ys=points.map(p=>Math.round(p.y*10)),sx=M.sum(xs),sy=M.sum(ys);
  const dx=xs.map(x=>7*x-sx),dy=ys.map(y=>7*y-sy),products=dx.map((d,i)=>d*dy[i]);
  return {sx,sy,dx,dy,products,t:M.sum(products),u:M.sum(dx.map(d=>d*d)),v:M.sum(dy.map(d=>d*d))};
 }
 function render(){
  const a=M.covariance(points),e=exact(),sx=rootValue(e.u,34300),sy=rootValue(e.v,34300);
  let r={text:'无法计算',sign:'',value:null};
  if(e.u&&e.v){const value=e.t/Math.sqrt(e.u*e.v),units=Math.round(value*1000);r={value,text:text(units/1000),sign:BigInt(e.t)**2n*1000000n===BigInt(units)**2n*BigInt(e.u)*BigInt(e.v)?'＝':'≈'};}
  const guides=[{a:{x:a.mx,y:0},b:{x:a.mx,y:10},dash:true},{a:{x:0,y:a.my},b:{x:10,y:a.my},dash:true}];
  const fit=e.u?[{data:[{x:0,y:a.my+a.xy/a.xx*(0-a.mx)},{x:10,y:a.my+a.xy/a.xx*(10-a.mx)}],color:'#a96239',width:2}]:[];
  L.plot('scatter',{x:[0,10],y:[0,10],xticks:[0,5,10],yticks:[0,5,10],xlabel:'X：投入（千元）',ylabel:'Y：订单（十单）',points:points.map((p,i)=>({...p,drag:true,key:i})),guides,series:fit,extra:({X,Y})=>`<circle class="selected-point" cx="${X(points[selected].x)}" cy="${Y(points[selected].y)}" r="9" fill="none" stroke="#5579a2" stroke-width="2" pointer-events="none"/>`});
  $('stats').innerHTML=[['X平均数',describe(e.sx,70)],['Y平均数',describe(e.sy,70)],['协方差',describe(e.t,34300)],['X标准差',sx.sign+sx.text],['Y标准差',sy.sign+sy.text],['相关系数r',r.sign+r.text]].map(([name,value])=>`<div class="metric"><span>${name}</span><strong>${value}</strong></div>`).join('');
  $('local-correlation').textContent=`正在看第${selected+1}组：X＝${text(points[selected].x)}，Y＝${text(points[selected].y)}。当前相关系数r${r.value===null?'无法计算':r.sign+r.text}。`;
  $('line-note').textContent=!e.u?'X都相同，7家店的X全都一样，点竖成一排，没法用X画出斜着的趋势线。':!e.v?'Y都相同，棕色趋势线是一条水平线，与Y平均数虚线重合。':'棕色实线是使各点到它的竖直距离平方之和最小的直线，用来概括整体的直线趋势。';
  let explanation='';
  if(!e.u||!e.v) explanation=`${!e.u&&!e.v?'X、Y都没有变化':!e.u?'X全部相同':'Y全部相同'}，对应的标准差为0。算r时要除以两个标准差的乘积，分母为0，所以没法算出相关系数。`;
  else if(active==='u-shape') explanation='r＝0。左边先降、右边后升，正负偏离乘积正好抵消，棕色趋势线变平。点仍严格排成U形，相关系数为0也可以有明确的曲线关系。';
  else if(e.t===0) explanation='r＝0：偏离乘积正负抵消，没有整体的直线趋势。接着看点怎样排列，曲线关系需要另外观察。';
  else explanation=`r${r.sign}${r.text}，这些点总体${e.t>0?'随X增加而升高，表现为正相关':'随X增加而降低，表现为负相关'}。${active==='outlier'?'前六个点排在上升直线上，只改最后一个点，整体的r就明显变小。':'试着把一个点拖过均值虚线，看看这一组的乘积和整体r怎样变化。'}`;
  $('explain').textContent=explanation;
  $('preset-note').textContent=active?`当前预设：${names[active]}。拖动或填写数值后，会改为你自己的数据。`:'当前是你修改后的数据；上方按钮可以换回对应的形状。';
  for(const key of Object.keys(presets))$(key).setAttribute('aria-pressed',String(active===key));
  const cov=decimal(e.t,34300),scaledCov=decimal(e.t*10,34300),scaledSy=rootValue(e.v*100,34300);
  $('unit-example').innerHTML=`<h3>为什么协方差还要除以标准差？</h3><p>如果订单改用“单”记录，所有Y都乘以10，订单一张没变，协方差却从${term(numberWord(cov))}变成${term(numberWord(scaledCov))}。Y标准差也从${term(numberWord(sy))}变成${term(numberWord(scaledSy))}，同样扩大10倍。</p><p>把协方差除以X、Y标准差的乘积，两处的10倍就抵消了。得到的相关系数r没有单位，范围是−1到1，换成单记录也仍${r.value===null?'无法计算':r.sign+r.text}。</p>`;
  const i=selected,p=points[i],dx=fraction(e.dx[i],70),dy=fraction(e.dy[i],70),product=decimal(e.products[i],4900);
  const mx=fraction(e.sx,70),my=fraction(e.sy,70);
  const sumX=points.map(p=>text(p.x)).join('＋'),sumY=points.map(p=>text(p.y)).join('＋');
  $('calculation').innerHTML=`<p class="formula">平均X＝(${sumX})÷7＝${term(mx)}${decimal(e.sx,70).sign==='≈'?`≈${text(a.mx)}`:''}。<br>平均Y＝(${sumY})÷7＝${term(my)}${decimal(e.sy,70).sign==='≈'?`≈${text(a.my)}`:''}。</p><div class="current-point"><h3>第${i+1}组怎样算</h3><p>X偏离平均数：${term(`${text(p.x)}−(${mx})＝${dx}`)}。<br>Y偏离平均数：${term(`${text(p.y)}−(${my})＝${dy}`)}。</p><p>两项相乘：${term(`(${dx})×(${dy})`)}${term(`＝${fraction(e.products[i],4900)}`)}${product.sign==='≈'?`≈${product.text}`:''}。</p><p>${e.dx[i]===0||e.dy[i]===0?'其中一项偏离量为0，所以乘积为0。':e.products[i]>0?'两项偏离量同号，乘积为正。':'两项偏离量异号，乘积为负。'}</p></div><table class="point-table"><caption>点组号查看对应计算；乘积按原始数据计算后显示</caption><thead><tr><th>数据组</th><th>（X，Y）</th><th>偏离量相乘</th></tr></thead><tbody>${points.map((p,j)=>`<tr class="${j===selected?'selected-row':''}"><td><button type="button" data-select="${j}" aria-pressed="${j===selected}">第${j+1}组</button></td><td>(${text(p.x)}, ${text(p.y)})</td><td>${describe(e.products[j],4900)}</td></tr>`).join('')}</tbody></table><div class="calculation-steps"><section><h3>① 对乘积求平均：协方差</h3><p>上面7个乘积相加${term(`＝${fraction(e.t,4900)}`)}，再除以7：协方差${term(`＝${fraction(e.t,34300)}`)}${cov.sign==='≈'?`≈${cov.text}`:''}。</p></section><section><h3>② 计算两个标准差</h3><p>标准差表示各组数的起伏大小。先把各自偏离量平方、求平均，再开平方。√表示开平方，例如√4＝2，因为2×2＝4。</p><p class="square-sum">X的偏离量平方相加${term(`＝${fraction(e.u,4900)}`)}。X标准差${term(`＝√(${fraction(e.u,4900)}÷7)`)}${term(sx.sign+sx.text)}。</p><p class="square-sum">Y的偏离量平方相加${term(`＝${fraction(e.v,4900)}`)}。Y标准差${term(`＝√(${fraction(e.v,4900)}÷7)`)}${term(sy.sign+sy.text)}。</p></section><section><h3>③ 除去单位，得到r</h3><p>r＝协方差÷（X标准差×Y标准差）。</p><p>${r.value===null?'当前分母为0，无法计算。':`${term(`r${cov.sign==='＝'&&sx.sign==='＝'&&sy.sign==='＝'?'＝':'≈'}${cov.text}÷(${sx.text}×${sy.text})`)}。用原始数值计算，${term(`r${r.sign}${r.text}`)}。${cov.sign==='≈'||sx.sign==='≈'||sy.sign==='≈'?'代入数值已显示到三位小数，r用原始数值计算。':''}`}</p></section></div>`;
  $('point-select').value=String(selected);
  if(document.activeElement!==$('point-x'))$('point-x').value=String(points[selected].x);
  if(document.activeElement!==$('point-y'))$('point-y').value=String(points[selected].y);
 }
 $('point-select').innerHTML=Array.from({length:7},(_,i)=>`<option value="${i}">${i+1}</option>`).join('');
 L.bind(render);
 L.drag('scatter',(p,key)=>{selected=Number(key);active='';points[selected]={x:Math.round(Math.max(0,Math.min(10,p.x))*10)/10,y:Math.round(Math.max(0,Math.min(10,p.y))*10)/10};$('point-error').textContent='';L.refresh();});
 for(const name of Object.keys(presets))$(name).onclick=()=>{points=presets[name].map((y,i)=>({x:i+1,y}));active=name;$('point-error').textContent='';L.refresh();};
 $('point-select').onchange=()=>{selected=Number($('point-select').value);$('point-error').textContent='';L.refresh();};
 $('calculation').onclick=e=>{const b=e.target.closest('[data-select]');if(b){selected=Number(b.dataset.select);$('point-error').textContent='';L.refresh();}};
 for(const key of ['x','y']){
  const input=$(`point-${key}`);
  input.oninput=()=>{if(input.value==='')return;const value=Number(input.value);if(!Number.isFinite(value)||value<0||value>10||Math.abs(value*10-Math.round(value*10))>1e-8){$('point-error').textContent='X、Y请填0到10之间的数，最多一位小数。';return;}points[selected][key]=value;active='';$('point-error').textContent='';L.refresh();};
  input.onblur=()=>{input.value=String(points[selected][key]);};
 }
})();
