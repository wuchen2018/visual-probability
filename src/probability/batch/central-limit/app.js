(() => {
 'use strict';const L=window.Lab,M=window.ProbModels,$=L.$,term=L.term;
 let kind='uniform',seed=20261121,key='',data=null,showAll=false,batches=0;
 const names={uniform:'0—1均匀分布',die:'六面骰子',coin:'正面概率10%的硬币'};
 const specs={uniform:{mu:[1,2],variance:[1,12],domain:[0,1]},die:{mu:[7,2],variance:[35,12],domain:[1,6]},coin:{mu:[1,10],variance:[9,100],domain:[0,1]}};
 const number=(n,d=5)=>new Intl.NumberFormat('zh-CN',{maximumFractionDigits:d}).format(n===0?0:n).replaceAll('-','−');
 function rational(num,den=1,digits=5){
  let n=BigInt(num),d=BigInt(den);if(d<0n){n=-n;d=-d;}const scale=10n**BigInt(digits),abs=n<0n?-n:n,units=((abs*scale*2n+d)/(2n*d))*(n<0n?-1n:1n);
  return {sign:n*scale===units*d?'＝':'≈',text:number(Number(units)/10**digits,digits)};
 }
 function fraction(num,den){const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a),g=gcd(num,den);return den/g===1?number(num/g,0):`${number(num/g,0)}/${number(den/g,0)}`;}
 function root(num,den=1,digits=5){const value=Math.sqrt(num/den),units=Math.round(value*10**digits);return {value,sign:BigInt(num)*10n**BigInt(2*digits)===BigInt(units)**2n*BigInt(den)?'＝':'≈',text:number(units/10**digits,digits)};}
 const formatted=v=>v.sign+v.text;
 function histogram(values,min,max,bins){
  const counts=Array(bins).fill(0),width=(max-min)/bins;let outside=0;
  for(const value of values){if(value<min-1e-12||value>max+1e-12){outside++;continue;}const raw=(value-min)/(max-min)*bins,nearest=Math.round(raw),slot=Math.abs(raw-nearest)<1e-10?nearest:Math.floor(raw);counts[Math.max(0,Math.min(bins-1,slot))]++;}
  return {bars:counts.map((count,i)=>({x:min+(i+.5)*width,y:count/values.length/width,width,count})),counts,width,outside};
 }
 function hist(id,values,domain,label){
  const a=histogram(values,...domain,24),max=Math.max(.01,...a.bars.map(b=>b.y)),xticks=domain[1]===1?[0,.25,.5,.75,1]:[1,2,3,4,5,6];
  const ymax=Math.ceil(max*1.1*10)/10;
  L.plot(id,{x:domain,y:[0,ymax],xticks,xlabel:label,ylabel:'概率密度',bars:a.bars,yticks:[0,ymax/2,ymax]});return a;
 }
 L.bind(v=>{
  const k=[kind,v.n,v.repeats,seed].join('/');if(k!==key){data=M.clt(kind,v.n,v.repeats,seed);key=k;batches++;}const d=data,spec=specs[kind];
  if(kind==='uniform')hist('mother',d.mother,[0,1],'单个数的取值');
  else{const vals=kind==='die'?[1,2,3,4,5,6]:[0,1],probs=vals.map(x=>d.mother.filter(z=>z===x).length/d.mother.length);L.plot('mother',{x:kind==='die'?[.5,6.5]:[-.15,1.15],y:[0,kind==='die'?.3:1],xticks:vals,yticks:kind==='die'?[0,.1,.2,.3]:[0,.25,.5,.75,1],ytickLabels:kind==='die'?{0:'0%',.1:'10%',.2:'20%',.3:'30%'}:{0:'0%',.25:'25%',.5:'50%',.75:'75%',1:'100%'},xlabel:'单次结果',ylabel:'概率',bars:vals.map((x,i)=>({x,y:probs[i],width:kind==='die'?.65:.22}))});}
  const mh=hist('means',d.means,spec.domain,'每组的平均值'),peakIndex=mh.counts.indexOf(Math.max(...mh.counts)),peak=mh.bars[peakIndex],span=spec.domain[1]-spec.domain[0],lowNum=spec.domain[0]*24+peakIndex*span,highNum=lowNum+span;
  const proportion=rational(peak.count*100,v.repeats,2),height=rational(peak.count*24,v.repeats*span,4),width=rational(span,24,5);
  $('mean-bin-explanation').innerHTML=`<p>例如从${term(fraction(lowNum,24))}（含）到${term(fraction(highNum,24))}${peakIndex===23?'（含）':'（不含）'}这一段，有${peak.count}组。</p><p>比例${term(`＝${peak.count}÷${v.repeats}`)}${term(formatted(proportion)+'%')}；柱宽${term(`＝${fraction(span,24)}`)}${width.sign==='≈'?`≈${width.text}`:''}。</p><p>柱高＝比例÷柱宽${term(`＝(${peak.count}÷${v.repeats})`)}${term(`÷(${fraction(span,24)})`)}${term(formatted(height))}。柱高乘柱宽，就是这段的比例。</p>`;
  let bound=Math.max(4,Math.ceil(Math.max(...d.zs.map(Math.abs)))),zh;
  if(kind==='uniform')zh=histogram(d.zs,-bound,bound,28);
  else{
   const latticeGap=1/(v.n*d.standardError),combine=Math.max(1,Math.ceil(.25/latticeGap)),minSum=kind==='coin'?0:v.n,counts=new Map();
   for(const group of d.groups){const slot=Math.floor((M.sum(group)-minSum)/combine);counts.set(slot,(counts.get(slot)||0)+1);}
   const width=combine*latticeGap,bars=[...counts].map(([slot,count])=>({x:((minSum+slot*combine+(combine-1)/2)/v.n-d.spec.mu)/d.standardError,y:count/v.repeats/width,width,count}));
   bound=Math.max(4,Math.ceil(Math.max(...bars.map(b=>Math.abs(b.x)))+width/2));zh={bars};
  }
  const ymax=Math.max(.45,...zh.bars.map(b=>b.y))*1.1;
  L.plot('standardized',{x:[-bound,bound],y:[0,ymax],xticks:[-bound,-2,-1,0,1,2,bound],yticks:[0,.2,.4,...(ymax>.6?[.6]:[])],xlabel:'标准化值Z',ylabel:'概率密度',bars:zh.bars,series:[{data:L.series(x=>Math.exp(-x*x/2)/Math.sqrt(2*Math.PI),-bound,bound),color:'#a96239'}]});
  $('discrete-note').textContent=kind==='coin'&&v.n<20?`现在每组只有${v.n}次，平均值只能取0、${number(1/v.n,4)}等少数离散值，形状仍明显偏斜。试着把每组个数调到50或100，观察变化。`:(kind==='coin'||kind==='die')?'这组平均值仍由离散取值组成，第三幅按间距选柱宽，柱面积表示所占比例。增加每组个数，再看整体轮廓怎样变化。':'第三幅统一到中心0、标准差1，便于与同一条棕色正态曲线比较。';
  const sigma=root(...spec.variance),se=root(spec.variance[0],spec.variance[1]*v.n),sqrtN=root(v.n);
  $('result').innerHTML=`取数规则：${names[kind]}。每组${v.n}个数，重复${v.repeats}组，得到${v.repeats}个平均值。<br>单个数的理论平均${term(`μ＝${number(d.spec.mu)}`)}，标准差${term(`σ${formatted(sigma)}`)}。平均值的理论标准差${term(`σ/√n${formatted(se)}`)}。`;
  const allDen=kind==='uniform'?4294967296:1,allNum=d.groups.reduce((total,group)=>total+M.sum(group.map(x=>Math.round(x*allDen))),0),observed=rational(allNum,allDen*v.n*v.repeats);
  $('result').innerHTML+=`<p>电脑刚才生成的是第${batches}批。这${v.repeats}个组平均值，再取一次平均${term(formatted(observed))}。重新抽一批，这个实测数字和上面的柱子都会跟着变；取数规则和理论平均保持原样。</p>`;
  const index=Math.min(v.group,v.repeats)-1,raw=d.groups[index],rawDen=kind==='uniform'?4294967296:1,rawNum=M.sum(raw.map(x=>Math.round(x*rawDen))),sum=rational(rawNum,rawDen),avg=rational(rawNum,rawDen*v.n);
  const diffNum=BigInt(rawNum)*BigInt(spec.mu[1])-BigInt(spec.mu[0])*BigInt(rawDen*v.n),diffDen=BigInt(rawDen*v.n*spec.mu[1]),z=d.zs[index],zUnits=Math.sign(z)*Math.floor(Math.abs(z)*10000+.5),zExact=diffNum**2n*BigInt(spec.variance[1]*v.n)*100000000n===BigInt(zUnits)**2n*diffDen**2n*BigInt(spec.variance[0]);
  const zText=`${zExact?'＝':'≈'}${number(zUnits/10000,4)}`;
  const meanForSubstitution=kind==='uniform'?avg.text:fraction(rawNum,rawDen*v.n),substitutionSign=kind==='uniform'&&avg.sign==='≈'?'≈':'＝';
  $('calculation').innerHTML=`<p>查看第${index+1}组${v.group>v.repeats?'，填写的组号超出当前组数，所以查看最后一组':''}。</p><p>按当前规则取一个数的理论平均${term(`μ＝${number(d.spec.mu)}`)}，标准差${term(`σ＝√(${fraction(...spec.variance)})`)}${term(formatted(sigma))}。平方根里的${fraction(...spec.variance)}是单个数的方差，也就是标准差的平方。</p><p>${term(`√${v.n}${formatted(sqrtN)}`)}。平均值的标准差${term('σ/√n')}${term(`＝√(${fraction(...spec.variance)}÷${v.n})`)}${term(formatted(se))}。</p><p>本组${v.n}个数相加${term(formatted(sum))}，再除以${v.n}，平均值${term(formatted(avg))}。</p><p>${term('Z＝（本组平均值−μ）')}÷${term('（σ/√n）')}。</p><p>把这组数代入：${term(`Z${substitutionSign}(${meanForSubstitution}−${number(d.spec.mu)})`)}÷${term(`√(${fraction(...spec.variance)}÷${v.n})`)}。</p><p>按原始数值计算，${term(`Z${zText}`)}。它表示这一组平均值比中心高或低多少个“平均值标准差”。</p>`;
  const shown=showAll||raw.length<=25?raw:raw.slice(0,20);$('raw').innerHTML=shown.map(x=>`<span>${number(x,4)}</span>`).join('');
  $('raw-note').textContent=`${shown.length<raw.length?`先显示前${shown.length}个，共${raw.length}个。`:''}${kind==='uniform'?'均匀分布的数显示到四位小数，计算使用原取值。':''}`;
  $('show-all').hidden=raw.length<=25;$('show-all').textContent=showAll?'只看前20个':`显示全部${raw.length}个`;
  for(const name of Object.keys(names))$(name).setAttribute('aria-pressed',String(kind===name));
 });
 for(const name of Object.keys(names))$(name).onclick=()=>{kind=name;L.refresh();};$('resample').onclick=()=>{seed++;L.refresh();};$('show-all').onclick=()=>{showAll=!showAll;L.refresh();};
})();
