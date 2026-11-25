(() => {
 'use strict';const L=window.Lab,M=window.ProbModels,$=L.$,term=L.term;
 const defaults=[30,10,0,5,20,5,0,10,20],weights=[...defaults],invalid=new Set();let row=0,cell=0;
 const number=(n,d=5)=>new Intl.NumberFormat('zh-CN',{maximumFractionDigits:d}).format(n===0?0:n);
 function ratio(num,den,digits=4,multiplier=1){const scale=10**digits,units=Math.floor((2*num*multiplier*scale+den)/(2*den));return {sign:num*multiplier*scale===units*den?'＝':'≈',text:number(units/scale,digits)};}
 const shown=x=>x.sign+x.text,pct=(n,d)=>shown(ratio(n,d,2,100))+'%';
 const label=i=>`候车${Math.floor(i/3)*5}分、车程${10+(i%3)*10}分`;
 function axis(max){const target=max/4,scale=10**Math.floor(Math.log10(target)),step=[1,2,2.5,5,10].map(x=>x*scale).filter(x=>x<=target).at(-1)||scale,top=Math.ceil(max/step)*step,ticks=[];for(let y=0;y<=top+step*.01;y+=step)ticks.push(Math.round(y*1e6)/1e6);return {y:[0,top],yticks:ticks};}
 function error(){const ids=[...invalid];$('weight-error').textContent=ids.length?`${ids.map(label).join('；')}请填0到100的整数。计算仍用这些格上次有效的人数。`:'';}
 $('people-rows').innerHTML=[0,1,2].map(r=>`<tr><th scope="row">${r*5}分钟</th>${[0,1,2].map(c=>{const i=r*3+c;return `<td><input type="number" min="0" max="100" step="1" value="${weights[i]}" data-weight="${i}" aria-label="${label(i)}的人数" aria-describedby="weight-error"></td>`;}).join('')}<td id="row-total-${r}" class="subtotal"></td></tr>`).join('');
 L.bind(v=>{
  const a=M.joint(weights,row),rowNames=['候车0分','候车5分','候车10分'],cols=['车程10分','车程20分','车程30分'];
  for(let i=0;i<3;i++){$(`row-total-${i}`).textContent=a.rows[i];$(`column-${i}`).textContent=a.cols[i];}$('all-total').textContent=a.total;
  $('people-summary').textContent=a.total?`总人数${a.total}；当前格${weights[cell]}人，联合概率${pct(weights[cell],a.total)}。`:'总人数0，先在任意格增加人数。';
  L.heat('joint',a.p,{rows:rowNames,cols,cornerLabel:'候车X／车程Y',selectedRow:row,onClick:i=>{row=Math.floor(i/3);cell=i;L.refresh();}});
  $('joint').querySelectorAll('[data-cell]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.cell)===cell)));
  const probabilityAxis={y:[0,1],yticks:[0,.25,.5,.75,1],ytickLabels:{0:'0%',.25:'25%',.5:'50%',.75:'75%',1:'100%'}};
  L.plot('conditional',{...probabilityAxis,x:[5,35],xticks:[10,20,30],xlabel:'行驶时间（分钟）',ylabel:'条件概率',bars:a.conditional.map((y,i)=>({x:10+i*10,y,width:5}))});
  L.plot('marginal-x',{...probabilityAxis,x:[-2,12],xticks:[0,5,10],xlabel:'候车分钟',ylabel:'边际概率',bars:a.marginalX.map((y,i)=>({x:i*5,y,width:2}))});
  L.plot('marginal-y',{...probabilityAxis,x:[5,35],xticks:[10,20,30],xlabel:'行驶分钟',ylabel:'边际概率',bars:a.marginalY.map((y,i)=>({x:10+i*10,y,width:5}))});
  $('conditional-result').innerHTML=a.rows[row]?`<p>只看候车${row*5}分钟的${a.rows[row]}人：</p>${[0,1,2].map(j=>`<p>车程${10+j*10}分：${term(`${weights[row*3+j]}÷${a.rows[row]}`)}${term(pct(weights[row*3+j],a.rows[row]))}。</p>`).join('')}`:`<p>当前候车${row*5}分钟的人数是0，没有这一类出行记录，算不出这一行的条件分布。</p>`;
  $('calculation').innerHTML=a.total?`<p>总人数＝${a.total}，与输入表的行列合计一致。</p><p>当前${label(cell)}有${weights[cell]}人，联合概率${term(`＝${weights[cell]}÷${a.total}`)}${term(pct(weights[cell],a.total))}。</p>`:'所有格人数都是0，当前无法形成联合、边际和条件概率。';
  $('marginal-x-equation').innerHTML=a.total?a.rows.map((n,i)=>`<p>等${i*5}分这一行：${term(`${weights.slice(i*3,i*3+3).join('＋')}＝${n}人`)}；${term(`${n}÷${a.total}${pct(n,a.total)}`)}。</p>`).join(''):'总人数0，无法计算。';
  $('marginal-y-equation').innerHTML=a.total?a.cols.map((n,j)=>`<p>车程${10+j*10}分这一列：${term(`${[weights[j],weights[j+3],weights[j+6]].join('＋')}＝${n}人`)}；${term(`${n}÷${a.total}${pct(n,a.total)}`)}。</p>`).join(''):'总人数0，无法计算。';
  for(let i=0;i<3;i++)$(`row${i}`).setAttribute('aria-pressed',String(row===i));
  const c=Math.round(v.center*100),half=Math.round(v.width*50),lo=Math.max(0,c-half),hi=Math.min(100,c+half),mass=hi*hi-lo*lo,A=lo/100,B=hi/100,C=c/100,actualWidth=(hi-lo)/100;
  const conditional=y=>y<0||y>B?0:2*(B-Math.max(A,y))/(mass/10000),examples=[{name:'蓝色',color:'#5579a2',yNum:lo},{name:'紫色',color:'#9275a6',yNum:lo+hi}].map(ex=>{const start=Math.max(2*lo,ex.yNum),length=2*hi-start;return {...ex,y:ex.yNum/200,start:start/200,length:length/200,density:ratio(100*length,mass)};});
  const clipped=lo!==c-half||hi!==c+half,mid=(lo+hi)/200;
  $('band-summary').textContent=`实际${number(A)}≤X≤${number(B)}，带宽${number(actualWidth)}，带内概率${pct(mass,10000)}。${clipped?`被${lo===0?'0':'1'}边界截短，实际中点是${number(mid)}。`:''}`;
  L.plot('triangle',{equal:true,x:[0,1],y:[0,1],xticks:[0,.5,1],yticks:[0,.5,1],xlabel:'X',ylabel:'Y',polygons:[{points:[{x:0,y:0},{x:1,y:0},{x:1,y:1}],opacity:.1},{points:[{x:A,y:0},{x:B,y:0},{x:B,y:B},{x:A,y:A}],opacity:.3}],guides:[{a:{x:C,y:0},b:{x:C,y:C},color:'#56645e',dash:true},...examples.map(ex=>({a:{x:ex.start,y:ex.y},b:{x:B,y:ex.y},color:ex.color}))],points:examples.flatMap(ex=>[{x:ex.start,y:ex.y,color:ex.color,r:3},{x:B,y:ex.y,color:ex.color,r:3}])});
  L.plot('marginals',{x:[0,1],...axis(2.2),xticks:[0,.25,.5,.75,1],xlabel:'变量取值',ylabel:'边际密度',series:[{data:[{x:0,y:0},{x:1,y:2}]},{data:[{x:0,y:2},{x:1,y:0}],color:'#a96239'}]});
  L.plot('slice',{x:[0,1],...axis(Math.max(1/C,2/(A+B))*1.1),xticks:[0,.25,.5,.75,1],xlabel:'Y的取值',ylabel:'条件密度',series:[{data:[{x:0,y:conditional(0)},{x:A,y:conditional(A)},{x:B,y:0},{x:1,y:0}]},{data:[{x:0,y:1/C},{x:C,y:1/C},{x:C,y:0},{x:1,y:0}],color:'#a96239',dash:true}],points:examples.map(ex=>({x:ex.y,y:conditional(ex.y),color:ex.color,r:4}))});
  $('triangle-note').innerHTML=`<p>设定中心${term(`X＝${number(C)}`)}的竖线，从Y＝0到${number(C)}，长度${number(C)}。乘密度2，得到X的边际密度${term(`2×${number(C)}＝${number(2*C)}`)}。</p><p>实际竖带从${number(A)}到${number(B)}，左右高度${number(A)}、${number(B)}，宽${number(actualWidth)}。${clipped?`原设定范围${number((c-half)/100)}到${number((c+half)/100)}被边界截短，实际中点${number(mid)}，不再是设定中心${number(C)}。`:''}</p><p>这块${lo===0?'三角形':'梯形'}的面积${term(`＝(${number(A)}＋${number(B)})÷2`)}${term(`×${number(actualWidth)}`)}${term(shown(ratio(mass,20000,5)))}。再乘密度2，带内概率${term(pct(mass,10000))}。</p>`;
  $('slice-note').innerHTML=examples.map(ex=>`<section class="line-example" style="border-color:${ex.color}"><h3>${ex.name}线：取Y＝${number(ex.y)}</h3><p>允许的X从${number(ex.start)}到${number(B)}，线长${term(`＝${number(B)}−${number(ex.start)}＝${number(ex.length)}`)}。</p><p>乘密度2，再除以整条竖带的概率：条件密度${term(`＝2×${number(ex.length)}`)}${term(`÷${number(mass/10000,4)}`)}${term(shown(ex.density))}。第一幅的线段和本图的同色点，对应这次计算。</p></section>`).join('')+`<p>${lo>0?`Y不超过${number(A)}时，横线从${number(A)}到${number(B)}，长度不变，绿线先平；Y超过${number(A)}后，横线逐渐变短，绿线下降。`:'竖带从X＝0开始，横线从Y＝0起就逐渐变短，绿线直接下降。'}</p>`;
  $('continuous-calculation').innerHTML=`<p>固定X取x，Y可从0到x，长度x，乘密度2得到${term('f_X(x)＝2x')}。把2x在X从${number(A)}到${number(B)}这段下方的面积加起来，就是竖带概率。</p><p>这正是上面的${lo===0?'三角形':'梯形'}面积乘2。连续地累加面积，在微积分里写作积分，符号是∫：</p><p>带内概率＝∫<sub>${number(A)}</sub><sup>${number(B)}</sup>2x dx${term(`＝${number(B)}²−${number(A)}²`)}${term(pct(mass,10000))}。</p><p>对当前竖带：${term(`0≤y≤${number(A)}`)}时，条件密度${term(`＝2×(${number(B)}−${number(A)})`)}${term(`÷${number(mass/10000,4)}`)}；${term(`${number(A)}＜y≤${number(B)}`)}时，把线长换成${term(`${number(B)}−y`)}；其余位置密度为0。</p><p>沿设定位置${term(`X＝${number(C)}`)}把带宽缩小，Y的条件密度趋于${term(`2÷(${number(2*C)})`)}${term(shown(ratio(100,c)))}，范围${term(`0≤y≤${number(C)}`)}。棕色虚线就是这条高度固定的曲线。</p><p>边际密度也用同一种累加：${term('f_X(x)＝∫₀ˣ2dy＝2x')}，${term('f_Y(y)＝∫ᵧ¹2dx＝2(1−y)')}。dy表示沿Y方向累加，dx表示沿X方向累加。</p>`;
 });
 for(let i=0;i<3;i++)$(`row${i}`).onclick=()=>{row=i;cell=i*3+cell%3;L.refresh();};
 document.querySelectorAll('[data-weight]').forEach(input=>{
  const i=Number(input.dataset.weight);
  input.onfocus=()=>{row=Math.floor(i/3);cell=i;L.refresh();};
  input.oninput=()=>{if(input.value===''&&!input.validity.badInput){invalid.delete(i);input.removeAttribute('aria-invalid');error();return;}const value=input.valueAsNumber;if(!Number.isInteger(value)||value<0||value>100){invalid.add(i);input.setAttribute('aria-invalid','true');error();return;}invalid.delete(i);input.removeAttribute('aria-invalid');weights[i]=value;row=Math.floor(i/3);cell=i;error();L.refresh();};
  input.onblur=()=>{if(input.value===''&&!input.validity.badInput){input.value=weights[i];invalid.delete(i);input.removeAttribute('aria-invalid');error();}};
 });
 $('reset-people').onclick=()=>{weights.splice(0,9,...defaults);invalid.clear();document.querySelectorAll('[data-weight]').forEach(input=>{input.value=weights[Number(input.dataset.weight)];input.removeAttribute('aria-invalid');});error();L.refresh();};
})();
