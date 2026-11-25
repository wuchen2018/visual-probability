(() => {
 'use strict';const L=window.Lab,M=window.ProbModels,$=L.$,term=L.term;
 let log=false,seed=20261121,batch=1,cached=null,cachedKey='';
 const number=(n,d=3)=>new Intl.NumberFormat('zh-CN',{maximumFractionDigits:d}).format(n);
 const superscript=n=>String(n).split('').map(c=>c==='-'?'⁻':'⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(c)]).join('');
 function big(n){
  if(n>=1e16){const exp=Math.floor(Math.log10(n));return `${number(n/10**exp)}×10${superscript(exp)}`;}
  if(n>=1e12)return `${number(n/1e12)}万亿`;if(n>=1e8)return `${number(n/1e8)}亿`;if(n>=1e4)return `${number(n/1e4)}万`;return number(n);
 }
 const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
 function exactTail(a,k){const ai=Math.round(a*10),d=gcd(ai-10,10),power=(ai-10)/d,rootDegree=10/d,root=Math.round(k**(1/rootDegree));return root**rootDegree===k?[1,root**power]:null;}
 function percent(p,fraction=null){
  if(p>0&&p<.00000001)return '＜0.000001%';
  if(p>.999999&&!fraction)return '＞99.9999%';
  const digits=p*100<.01?6:2,exact=fraction&&fraction[0]*100*10**digits%fraction[1]===0;
  return `${exact?'＝':'≈'}${number(p*100,digits)}%`;
 }
 function count(n,fraction=null){return n>0&&n<.001?'＜0.001个':`${fraction&&fraction[0]*1000000%fraction[1]===0?'＝':'约'}${big(n)}个`;}
 function render(v){
  const a=Math.round(v.alpha*10)/10,k=v.cut,p=k**(1-a),e=Math.exp(-(k-1));
  const key=[a,seed].join('/');if(key!==cachedKey){cached=M.pareto(a,200,seed);cachedKey=key;}const data=cached;
  const curve=fn=>Array.from({length:501},(_,i)=>{const x=log?10**(i/250):1+99*i/500;return{x,y:fn(x)};});
  L.plot('tails',{x:[1,100],y:log?[.000001,1]:[0,1],logX:log,logY:log,left:log?92:60,xlabel:log?'大小X（对数刻度）':'大小X',ylabel:'尾部概率',xticks:log?[1,10,100]:[1,25,50,75,100],yticks:log?[.000001,.0001,.01,1]:[0,.25,.5,.75,1],ytickLabels:log?{1:'1',.01:'10⁻²',.0001:'10⁻⁴',.000001:'10⁻⁶'}:{0:'0%',.25:'25%',.5:'50%',.75:'75%',1:'100%'},series:[{data:curve(x=>x**(1-a))},{data:curve(x=>Math.exp(-(x-1))),color:'#a96239'}],guides:[{a:{x:k,y:log?.000001:0},b:{x:k,y:1},color:'#5579a2',dash:true}]});
  const shares=data.values.slice(0,20).map((x,i)=>({x:i+1,y:x/data.total,width:.72})),rest=M.sum(data.values.slice(20));
  shares.push({x:25,y:rest/data.total,width:1.25,color:'#a96239'});
  L.plot('rank',{x:[.3,27],y:[0,1],xticks:[1,5,10,15,20,25],xtickLabels:{25:'其余'},yticks:[0,.25,.5,.75,1],ytickLabels:{0:'0%',.25:'25%',.5:'50%',.75:'75%',1:'100%'},xlabel:'从大到小的排名',ylabel:'占这组总和',bars:shares});
  const tailFraction=exactTail(a,k),powerPercent=percent(p,tailFraction),exponentialPercent=percent(e,k===1?[1,1]:null);
  $('tail-result').innerHTML=`<p>至少达到${k}：幂律${term(powerPercent)}，指数${term(exponentialPercent)}。</p><p>观察1,000个值，预计达到门槛的数量：幂律${k===1?'＝1,000个':count(1000*p,tailFraction)}，指数${k===1?'＝1,000个':count(1000*e)}。这是平均预计数量，可以有小数。</p>`;
  $('coordinate-note').textContent=log?'横轴每向右一个相同间隔，数值乘相同倍数。纵轴10⁻²＝0.01，10⁻⁴＝0.0001，10⁻⁶＝0.000001。低于图底的指数尾部仍大于0，只是已经掉出当前范围。':'普通坐标中，两条很低的尾巴容易贴近横轴。点“双对数坐标”，把不同大小的尾部放大看。';
  $('shares').innerHTML=`<p>第${batch}批，从当前幂律中抽出200个数。最大值约${term(big(data.values[0]))}，占这组总和${term(percent(data.topOne))}。</p><p>前20名（200个值的10%）合计约${term(big(M.sum(data.values.slice(0,20))))}，占总和${term(percent(data.topTen))}；其余180名占${term(percent(rest/data.total))}。</p><p>总和约${term(big(data.total))}，除以200，样本平均值约${term(big(data.mean))}。</p>`;
  const tailIndex=number(a-1),meanNumerator=Math.round(a*10)-10,meanDenominator=Math.round(a*10)-20;
  let theory='';
  if(a>2){const units=Math.round(meanNumerator/meanDenominator*1000),exact=meanNumerator*1000===units*meanDenominator;theory=`<p>当前α＞2，理论平均值${term(`＝(α−1)÷(α−2)`)}${term(`＝${number(a-1)}÷${number(a-2)}`)}${term(`${exact?'＝':'≈'}${number(units/1000)}`)}。它是分布的总体平均值；上面200个数的平均随抽到的具体数值改变。</p>`;}
  else theory='<p>当前α≤2，这个理想幂律模型的总体平均值为无穷大。每次只抽200个数，仍能算出有限的样本平均；继续增加样本时，极大值会反复影响平均数，样本平均不会收敛到一个有限的总体平均值。</p>';
  const meanWithout=M.sum(data.values.slice(1))/199;
  $('calculation').innerHTML=`<p>本页X从1开始，1表示我们设定的最小规模。密度${term('f(x)＝(α−1)x⁻ᵅ')}，尾部概率${term('P(X≥x)＝x¹⁻ᵅ')}。α越小，尾部下降越慢，出现特别大数的机会越多。</p><p>本页α减1，就是书中尾指数k。当前尾指数${term(`＝${number(a)}−1＝${tailIndex}`)}。</p><div class="calculation-steps"><section><h3>幂律：至少达到${k}</h3><p>${term(`P(X≥${k})＝`)}<span class="term">${k}<sup>−${tailIndex}</sup></span>${term(powerPercent)}。</p></section><section><h3>指数参照：至少达到${k}</h3><p>从1开始，超过1的部分按速率1的指数分布变化，${term(`P(X≥${k})＝`)}<span class="term">e<sup>−(${k}−1)</sup></span>${term(exponentialPercent)}。</p><p>e约为2.718。门槛每增加1，剩下的概率就再乘${term('e⁻¹≈0.368')}。它固定用这条规则作参照，改变α只会改变幂律。</p></section></div>${theory}<div class="mean-comparison"><h3>一个最大值，怎样改变这批平均数？</h3><p>暂时拿掉最大的那个${term(`约${big(data.values[0])}`)}，其余199个数平均约${term(big(meanWithout))}。放回它后，200个数平均约${term(big(data.mean))}。</p><p>这两个平均数都由当前这批样本算出。换一组数据，可以看头部的大数怎样影响平均值。</p></div>`;
  $('linear').setAttribute('aria-pressed',String(!log));$('log').setAttribute('aria-pressed',String(log));
 }
 L.bind(render);$('linear').onclick=()=>{log=false;L.refresh();};$('log').onclick=()=>{log=true;L.refresh();};$('resample').onclick=()=>{seed++;batch++;L.refresh();};
})();
