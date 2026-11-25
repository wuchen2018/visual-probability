(() => {
 'use strict';const L=window.Lab,$=L.$,term=L.term;
 const number=(n,d=3)=>new Intl.NumberFormat('zh-CN',{maximumFractionDigits:d}).format(n);
 const exponent=(rate,hours)=>`<span class="term">e<sup>${hours===0?'0':`−${number(rate)}×${number(hours)}`}</sup></span>`;
 function probability(exp){
  const value=Math.exp(-exp),percent=value*100,digits=percent>=.01?2:Math.min(12,Math.ceil(-Math.log10(percent))+2);
  return {value,text:`${number(percent,digits)}%`,sign:exp===0?'＝':'≈'};
 }
 L.bind(v=>{
  const ri=Math.round(v.rate*10),si=Math.round(v.elapsed*10),ti=Math.round(v.extra*10),r=ri/10,s=si/10,t=ti/10,total=(si+ti)/10;
  const ps=probability(ri*si/100),pst=probability(ri*(si+ti)/100),pt=probability(ri*ti/100);
  const max=Math.max(12,6/r),curve=L.series(x=>r*Math.exp(-r*x),0,max),step=r<=.25?.05:r<=.6?.1:r<=1.2?.2:.5,ymax=Math.ceil((r*1.05)/step)*step,yticks=[];
  for(let y=0;y<=ymax+1e-8;y+=step)yticks.push(Math.round(y*100)/100);
  const xstep=max<=12?3:5,xticks=[];for(let x=0;x<=max;x+=xstep)xticks.push(x);
  const yAt=x=>r*Math.exp(-r*x);
  const guides=[{a:{x:s,y:0},b:{x:s,y:yAt(s)},color:'#26725f',dash:true}];
  if(t!==0)guides.push({a:{x:total,y:0},b:{x:total,y:yAt(total)},color:'#a96239',dash:true});
  L.plot('original',{x:[0,max],y:[0,ymax],xticks,yticks,xlabel:'从开始算的等待小时',ylabel:'概率密度',series:[{data:curve},{data:L.series(yAt,s,max),fill:true,color:'#26725f'},{data:L.series(yAt,total,max),fill:true,color:'#a96239'}],guides,extra:({X,Y})=>t===0?`<path class="overlap-line" d="M${X(s)},${Y(0)} V${Y(yAt(s))}" fill="none" stroke="#a96239" stroke-width="2" stroke-dasharray="3 5" pointer-events="none"/>`:''});
  L.plot('remaining',{x:[0,max],y:[0,ymax],xticks,yticks,xlabel:'从现在算的剩余小时',ylabel:'概率密度',series:[{data:curve},{data:L.series(yAt,t,max),fill:true,color:'#a96239'}],guides:[{a:{x:t,y:0},b:{x:t,y:yAt(t)},color:'#a96239',dash:true}]});
  const merge=`${s===0?'已等0小时，绿线与纵轴重合。':''}${t===0?'再等0小时，两条虚线重合，棕色短虚线叠在绿色上。':''}`;
  $('original-wait-note').innerHTML=`<p class="green-area">绿线往右：总等待超过${number(s)}小时，面积${term(ps.sign+ps.text)}。</p><p class="brown-area">棕线往右：总等待超过${number(total)}小时，面积${term(pst.sign+pst.text)}。</p><p>只在绿线右边这部分里比较，棕色尾巴所占的比例就是第二幅图的${pt.sign==='＝'?'':'约'}${pt.text}。${merge}</p>`;
  $('remaining-wait-note').innerHTML=s===0?`当前已等0小时，保留的总概率＝100%，第二幅图直接从现在开始计时。棕色尾部面积${term(pt.sign+pt.text)}。`:`已知等了${number(s)}小时还没来，就排除第一幅图绿线左边的情况，把保留下来的${ps.sign==='＝'?'':'约'}${ps.text}当作新的100%。前面白等的时间已经过去，我们从现在这一刻重新计时，把剩下的部分放大成新的100%。将曲线向左移${number(s)}小时，再把高度除以原来这部分的概率，曲线下的总面积就回到100%。棕色尾巴在其中所占的比例${term(pt.sign+pt.text)}。`;
  const mean=10/ri,meanUnits=Math.round(mean*1000),meanSign=meanUnits*ri===10000?'＝':'≈';
  $('result').innerHTML=`<p>已经等了${number(s)}小时，电话还没来。接下来还要等超过${number(t)}小时的概率${term(pt.sign)}<strong>${pt.text}</strong>，与从头开始等超过${number(t)}小时相同。</p><p class="mean-wait">平均等待时间＝1÷${number(r)}${meanSign}${number(mean)}小时。每小时平均来${number(r)}通，速率越大，平均要等的时间越短。</p>`;
  $('calculation').innerHTML=`<p>λ（读作“拉姆达”）就是上面设定的来电速率，当前${number(r)}通/小时。T是从开始到下一通电话的总等待时间。e是约等于2.718的数学常数。</p><p>P(…)表示括号里这件事的概率，“&gt;”表示超过，“|”后面是已知条件。曲线下某个时间以后的面积，用${exponent(r,1)}这种指数形式计算；这里把1换成要等待的小时数。</p><div class="calculation-steps"><section><h3>① 等满${number(s)}小时，还没来</h3><p>${term(`P(T＞${number(s)})＝`)}${exponent(r,s)}${term(ps.sign+ps.text)}。</p></section><section><h3>② 等满${number(total)}小时，还没来</h3><p>${term(`P(T＞${number(total)})＝`)}${exponent(r,total)}${term(pst.sign+pst.text)}。</p></section><section class="ratio-step"><h3>③ 已知等到现在，再等超过${number(t)}小时</h3><p>${term(`P(T＞${number(total)} | T＞${number(s)})`)}${term('＝两块面积相除')}。</p><p>用指数原式相除：${exponent(r,total)}÷${exponent(r,s)}<br>＝<span class="term">e<sup>−${number(r)}×(${number(total)}−${number(s)})</sup></span><br>＝${exponent(r,t)}${term(pt.sign+pt.text)}。</p><p>相除时，已经等的${number(s)}小时被消掉，只剩接下来这${number(t)}小时。直接从头等超过${number(t)}小时，也是${exponent(r,t)}${term(pt.sign+pt.text)}。</p></section></div>`;
 });
})();
