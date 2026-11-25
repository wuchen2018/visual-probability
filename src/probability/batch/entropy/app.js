(() => {
 'use strict';const L=window.Lab,M=window.ProbModels,$=L.$,term=L.term;
 let selected=0;const labels=['A','B','C','D'];
 const number=(n,d=4)=>new Intl.NumberFormat('zh-CN',{maximumFractionDigits:d}).format(n===0?0:n);
 function ratio(num,den,digits=4,multiplier=1){const scale=10**digits,units=Math.floor((2*num*multiplier*scale+den)/(2*den));return {sign:num*multiplier*scale===units*den?'＝':'≈',text:number(units/scale,digits)};}
 const shown=x=>x.sign+x.text;
 function integerInformation(weight,total){if(!weight||total%weight)return null;const q=total/weight;return (q&(q-1))===0?Math.log2(q):null;}
 function entropyFraction(weights,total){
  const exponents=new Map();
  const add=(value,times)=>{for(let prime=2;prime*prime<=value;prime++){while(value%prime===0){exponents.set(prime,(exponents.get(prime)||0)+times);value/=prime;}}if(value>1)exponents.set(value,(exponents.get(value)||0)+times);};
  add(total,total);for(const w of weights)if(w)add(w,-w);
  return [...exponents].some(([prime,power])=>prime!==2&&power!==0)?null:[exponents.get(2)||0,total];
 }
 L.bind(v=>{
  const weights=[v.w0,v.w1,v.w2,v.w3],a=M.normalize(weights),prob=a.p,info=prob.map(p=>p>0?-Math.log2(p):null),h=a.total?M.entropy(prob):null;
  const powers=weights.map(w=>a.total?integerInformation(w,a.total):null),contributions=prob.map((p,i)=>p===null?null:p===0?0:p*info[i]);
  const hFraction=a.total?entropyFraction(weights,a.total):null,hDisplay=h===null?null:hFraction?ratio(...hFraction):{sign:'≈',text:number(h)};
  const maxI=Math.max(1,...info.filter(x=>x!==null)),ymax=Math.ceil(maxI),step=ymax<=3?1:2,yticks=[];for(let y=0;y<=ymax;y+=step)yticks.push(y);
  L.plot('probabilities',{x:[-.5,3.5],y:[0,1],xticks:[0,1,2,3],xtickLabels:{0:'A',1:'B',2:'C',3:'D'},yticks:[0,.25,.5,.75,1],ytickLabels:{0:'0%',.25:'25%',.5:'50%',.75:'75%',1:'100%'},xlabel:'结果',ylabel:'概率',bars:prob.map((y,x)=>({x,y}))});
  L.plot('surprises',{x:[-.5,3.5],y:[0,ymax],xticks:[0,1,2,3],xtickLabels:{0:'A',1:'B',2:'C',3:'D'},yticks,xlabel:'结果',ylabel:'信息量（bit）',bars:info.map((y,x)=>({x,y,color:'#a96239'}))});
  let conclusion='';const positive=weights.map((w,i)=>w?i:null).filter(i=>i!==null),top=weights.indexOf(Math.max(...weights));
  if(a.total){
   if(positive.length===1)conclusion=`只会出现${labels[top]}，你事先就知道结果，平均信息量＝0 bit。`;
   else if(positive.every(i=>weights[i]===weights[positive[0]]))conclusion=`当前${positive.length}种可能结果一样多，谁都不占优势。各项信息量相同，平均信息量就等于每项的信息量。`;
   else if(prob[top]>=.8){const rare=positive.reduce((i,j)=>prob[i]<prob[j]?i:j);conclusion=`${labels[top]}的概率${shown(ratio(weights[top],a.total,2,100))}%，多数时候会看到它。${labels[rare]}的概率${shown(ratio(weights[rare],a.total,2,100))}%，出现时的信息量约${number(info[rare])} bit；按各自概率加权，平均信息量${shown(hDisplay)} bit。`;}
   else conclusion='每种结果的信息量不同。先乘各自的出现概率，再相加，得到每次平均的信息量，也就是信息熵。';
  }
  $('result').innerHTML=a.total?`<p>总份数${a.total}，信息熵${term(`H${hDisplay.sign}`)}<strong>${hDisplay.text} bit</strong>。</p><p>${conclusion}</p>`:'总份数为0，无法形成概率分布。请给至少一种结果增加份数。';
  $('quick-entropy').textContent=a.total?`当前四款一共${a.total}份。确定抽到哪一款，平均所需的信息量（信息熵H）${shown(hDisplay)} bit。`:'总份数0，暂时无法计算H。先增加一种份数。';
  const contributionDisplay=i=>powers[i]!==null?ratio(weights[i]*powers[i],a.total):{sign:'≈',text:number(contributions[i])};
  const infoDisplay=i=>powers[i]!==null?`＝${powers[i]}`:`≈${number(info[i])}`;
  $('calculation').innerHTML=`<table class="entropy-table"><caption>点结果字母，查看这一项怎样算</caption><thead><tr><th>结果／份数</th><th>概率p</th><th>信息量<br>−log₂p</th><th>熵贡献<br>p×信息量</th></tr></thead><tbody>${weights.map((w,i)=>`<tr class="${selected===i?'selected-row':''}"><td><button type="button" data-result="${i}" aria-pressed="${selected===i}">${labels[i]}：${w}份</button></td><td>${a.total?`${w}÷${a.total}<br>${shown(ratio(w,a.total,2,100))}%`:'—'}</td><td>${!a.total?'—':w===0?'不会出现':infoDisplay(i)+' bit'}</td><td>${!a.total?'—':w===0?'＝0 bit':shown(contributionDisplay(i))+' bit'}</td></tr>`).join('')}</tbody></table><div class="contribution-detail"><h3>当前${labels[selected]}这一项</h3>${!a.total?'<p>总份数为0，先增加份数再计算。</p>':weights[selected]===0?'<p>这一款的概率为0，不会出现。它在平均信息量中的贡献记为0。</p>':`<p>概率${term(`p＝${weights[selected]}÷${a.total}`)}${term(shown(ratio(weights[selected],a.total,2,100))+'%')}。</p><p>信息量${term(`＝log₂(${a.total}÷${weights[selected]})`)}${term(infoDisplay(selected)+' bit')}。</p><p>这一项贡献${term(`＝(${weights[selected]}÷${a.total})×`)}${powers[selected]!==null?term(String(powers[selected])):term(`log₂(${a.total}÷${weights[selected]})`)}${term(shown(contributionDisplay(selected))+' bit')}。</p>`}</div><p class="formula">${a.total?`四项贡献相加，${term(`H${shown(hDisplay)} bit`)}。H用原始概率和信息量计算。`:'总份数为0时，不计算信息熵。'}</p>`;
  const active={coin:weights[0]>0&&weights[0]===weights[1]&&weights[2]===0&&weights[3]===0,certain:weights[0]>0&&weights.slice(1).every(w=>w===0),equal:weights[0]>0&&weights.every(w=>w===weights[0]),rare:weights[1]>0&&weights[1]===weights[2]&&weights[2]===weights[3]&&weights[0]===97*weights[1]};
  for(const [id,on]of Object.entries(active))$(id).setAttribute('aria-pressed',String(on));
 });
 const set=w=>L.set(Object.fromEntries(w.map((value,i)=>['w'+i,value])));
 $('coin').onclick=()=>set([1,1,0,0]);$('certain').onclick=()=>set([1,0,0,0]);$('equal').onclick=()=>set([25,25,25,25]);$('rare').onclick=()=>set([97,1,1,1]);
 $('calculation').onclick=e=>{const b=e.target.closest('[data-result]');if(b){selected=Number(b.dataset.result);L.refresh();}};
})();
