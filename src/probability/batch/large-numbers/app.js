(() => {
 'use strict';const L=window.Lab,M=window.ProbModels,$=L.$,term=L.term;
 let seed=20261121,batch=1;
 const number=(n,d=5)=>new Intl.NumberFormat('zh-CN',{maximumFractionDigits:d}).format(n).replaceAll('-','−');
 const thin=a=>a.filter((_,i)=>i<60||i===a.length-1||i%Math.ceil(a.length/600)===0);
 function ratio(num,den,percent=false){const scale=percent?10000:100000,units=Math.sign(num)*Math.floor((2*Math.abs(num)*scale+den)/(2*den));return `${num*scale===units*den?'＝':'≈'}${number(units/(percent?100:100000),percent?2:5)}${percent?'%':''}`;}
 function legend(target){$(target).innerHTML=L.colors.map((color,i)=>`<span><i style="border-color:${color}"></i>第${i+1}组</span>`).join('')+'<span><i class="gray-dash"></i>参考虚线</span>';}
 legend('frequency-legend');legend('error-legend');
 L.bind(v=>{
  const p=v.p/100,n=v.n,data=M.largeNumbers(p,n,seed),allErrors=data.flatMap(d=>d.errors.map(p=>p.y)),max=Math.max(2,...allErrors.map(Math.abs));
  let limit=2;while(limit<max*1.05){const scale=10**Math.floor(Math.log10(limit));limit=limit<4*scale?4*scale:limit<10*scale?10*scale:20*scale;}
  const step=[25,50,100,200,250,500,1000,2000,2500].find(step=>step>=n/4),xticks=[];for(let x=0;x<=n;x+=step)xticks.push(x);
  L.plot('frequencies',{x:[0,n],y:[0,1],xticks,yticks:[0,.25,.5,.75,1],ytickLabels:{0:'0%',.25:'25%',.5:'50%',.75:'75%',1:'100%'},xlabel:'抛掷次数',ylabel:'正面频率',series:data.map((d,i)=>({data:thin(d.path),color:L.colors[i]})),guides:[{a:{x:0,y:p},b:{x:n,y:p},color:'#56645e',dash:true}]});
  L.plot('errors',{x:[0,n],y:[-limit,limit],xticks,yticks:[-limit,-limit/2,0,limit/2,limit],xlabel:'抛掷次数',ylabel:'与平均次数的差',series:data.map((d,i)=>({data:thin(d.errors),color:L.colors[i]})),guides:[{a:{x:0,y:0},b:{x:n,y:0},color:'#56645e',dash:true}]});
  const d=data[0],expected=n*v.p/100,difference=d.heads-expected;
  $('result').innerHTML=`<p>电脑按设定规则模拟的第${batch}批实验，四组各抛${number(n,0)}次，设定正面概率${v.p}%。</p><div class="group-results">${data.map((d,i)=>`<p style="border-color:${L.colors[i]}">第${i+1}组：正面${number(d.heads,0)}次，频率${term(ratio(d.heads,n,true))}。</p>`).join('')}</div>`;
  $('calculation').innerHTML=`<p>正面频率${term(`＝${number(d.heads,0)}÷${number(n,0)}`)}${term(ratio(d.heads,n,true))}。</p><p>按概率算的平均正面次数${term(`＝${number(n,0)}×${v.p}%＝${number(expected)}`)}。它是大量重复实验的平均值。</p><p>次数差${term(`＝${number(d.heads,0)}−${number(expected)}＝${number(difference)}`)}。</p><p>频率与概率之差${term(`＝${number(difference)}÷${number(n,0)}`)}${term(ratio(difference,n))}。${difference===0?'当前频率恰好等于设定概率。':`当前频率比设定值${difference>0?'高':'低'}${number(Math.abs(difference)/n*100)}个百分点。`}</p><div class="denominator-example"><h3>次数差更大，比例为什么还能更接近？</h3><p>拿50%的硬币举例：抛100次出了55次正面，比平均的50次多5次，${term('5÷100＝0.05')}，频率高5个百分点；抛10,000次出了5,050次正面，比平均的5,000次多50次，${term('50÷10,000＝0.005')}，频率只高0.5个百分点。</p><p>次数差扩大10倍，总次数却扩大100倍，除完反而小了。次数增加时，典型的次数差增长没有总次数快，所以频率的波动会逐渐缩小；一条具体记录中仍会有上下起伏。</p></div>`;
  $('last').innerHTML=d.outcomes.map((x,i)=>`<span aria-label="第${n-19+i}次${x?'正面':'反面'}">${x?'正':'反'}</span>`).join('');
  $('last-intro').textContent=v.p===0||v.p===100?`当前正面概率${v.p}%，每次结果都确定，四条曲线重合。下面是第一组最后20次的结果。`:`下面是第一组第${number(n-19,0)}至${number(n,0)}次的实际结果，正表示正面，反表示反面。即使整体频率已经接近设定概率，局部仍可能连出多个正面或反面。`;
  $('more').disabled=n===10000;$('fast').disabled=n===10000;$('limit-note').textContent=n===10000?'已到本页上限10,000次。可重新做4组，或减少次数查看同批记录的前一段。':'增加次数会沿同一批记录继续抛，不重抽前面的结果。';
 });
 $('more').onclick=()=>L.set({n:Math.min(10000,L.values().n+100)});$('fast').onclick=()=>L.set({n:10000});$('resample').onclick=()=>{seed++;batch++;L.refresh();};
})();
