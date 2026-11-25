(() => {
  'use strict';
  const L=window.Lab,M=window.ProbModels,$=L.$,term=L.term;
  let seed=20261121,strategy='flat',cache=null,cacheKey='',batchNumber=1,preset='';
  const power=n=>String(n).split('').map(d=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)]).join('');
  function percent(num,den) {
    num=BigInt(num);den=BigInt(den);if(den<0n){num=-num;den=-den;}
    const scale=num*10000n,units=(scale*2n+den)/(2n*den);
    if(num>0n&&units===0n)return '＜0.01%';
    if(num<den&&units===10000n)return '＞99.99%';
    return `${scale%den===0n?'＝':'≈'}${L.f(Number(units)/100,2)}%`;
  }
  function theory(capital,p) {
    if(p===0)return percent(1,1);if(p===100)return percent(0,1);
    if(p===50)return percent(100-capital,100);
    const a=BigInt(capital),q=BigInt(100-p),win=BigInt(p);
    return percent(q**100n-q**a*win**(100n-a),q**100n-win**100n);
  }
  L.bind(v=>{
    const key=[v.capital,v.p,strategy,seed].join('/');
    if(key!==cacheKey){cache=M.gambler(v.capital,100,v.p/100,strategy,300,4000,seed);cacheKey=key;}
    const a=cache,xmax=Math.max(10,...a.paths.map(path=>path.at(-1).x));
    const step=xmax<=20?5:xmax<=100?25:xmax<=500?100:xmax<=1000?250:1000,xticks=[];
    for(let t=0;t<=xmax;t+=step)xticks.push(t);
    const colors=['#26725f','#a96239','#5579a2','#74548b','#8b6d22','#bf5c69','#267c86','#5d6f30'];
    L.plot('paths',{x:[0,xmax],y:[0,100],xticks,yticks:[0,25,50,75,100],xlabel:'已经玩了几局',ylabel:'剩余资金（元）',series:a.paths.map((data,i)=>({data,color:colors[i],width:1.5})),guides:[{a:{x:0,y:100},b:{x:xmax,y:100},dash:true},{a:{x:0,y:0},b:{x:xmax,y:0},dash:true}]});
    $('path-ends').innerHTML=a.paths.map((path,i)=>{const end=path.at(-1);return `<span><i style="background:${colors[i]}"></i>第${i+1}次：${end.x}局后${end.y===0?'输光':end.y===100?'达到100元':`剩${end.y}元，未结束`}</span>`;}).join('');
    L.plot('outcomes',{x:[-.5,2.5],y:[0,300],xticks:[0,1,2],xtickLabels:{0:'输光',1:'到100元',2:'未结束'},yticks:[0,100,200,300],xlabel:'4,000局以内的结果',ylabel:'实验次数',bars:[{x:0,y:a.ruined,color:'#a96239'},{x:1,y:a.won},{x:2,y:a.pending,color:'#5579a2'}]});
    $('strategy-note').textContent=strategy==='flat'?'当前每局下注1元，钱到0元或100元时停止。':'当前输了就把下一注翻倍，赢后恢复下1元。钱不够时押上全部余款；离100元不足这一注时，只下达到100元还差的金额。';
    $('result').innerHTML=`<p>第${batchNumber}批，共300次：输光${a.ruined}次，达到100元${a.won}次，还有${a.pending}次玩了4,000局仍未结束。</p><p>已输光的比例${term(`＝${a.ruined}÷300${percent(a.ruined,300)}`)}。</p>`;
    const canTheory=strategy==='flat'||v.p===50||v.p===0||v.p===100;
    const currentTheory=theory(v.capital,v.p);
    $('quick-result').textContent=`本金${v.capital}元，每局胜率${v.p}%。${canTheory?`一直玩到0元或100元，理论输光概率${currentTheory}；`:''}这批在4,000局内已输光${a.ruined}次。`;
    $('preset-feedback').textContent=preset&&v.p===Number(preset)?`当前已设为${v.p}%${strategy==='flat'?`，理论输光概率${currentTheory}`:'。可切回“每局下注1元”查看理论计算'}。`:'';
    let explanation='';
    if(v.p===50){
      explanation=`<p class="theory-number">一直玩到0元或100元，理论输光概率＝1−${v.capital}÷100＝${100-v.capital}%。</p><p>为什么是这个数？每局公平，平均下来不赚不赔，结束时的平均资金仍是最初的${v.capital}元。可每次结束只会剩0元或100元，所以${term(`${v.capital}＝0×输光概率＋100×达标概率`)}。达标概率只能是${v.capital}%，余下${100-v.capital}%就是输光概率。</p><p>从${v.capital}元到0元只差${v.capital}元，到100元还差${100-v.capital}元。${v.capital<50?'本金少、离输光更近，这也能帮你理解为什么输光机会更大。':v.capital===50?'两端一样远，最终各占50%。':'本金多、离100元更近，所以达到目标的机会更大。'}${strategy==='double'?'输后翻倍改变了经过哪些金额、多久走到终点；只要仍是这个公平游戏，并且到0或100元停止，上面的平均资金计算也适用。':''}</p>`;
    } else if(v.p===0||v.p===100){
      explanation=`<p class="theory-number">每局${v.p===0?'必输':'必赢'}，最终输光概率${currentTheory}。</p><p>每次下注至少1元，资金一直${v.p===0?'减少直到0元':'增加直到100元'}。</p>`;
    } else if(strategy==='flat') {
      explanation=`<p class="theory-number">每次下注1元，最终输光概率${currentTheory}。</p><p>${v.p<50?`每下注1元，平均净收益＝${v.p}%×1−${100-v.p}%×1＝−${L.f((100-2*v.p)/100,2)}元。单局的差距会在反复下注中积累。试试48%和50%，用同样的本金比较最终输光概率。`:`每下注1元，平均净收益＝${v.p}%×1−${100-v.p}%×1＝${L.f((2*v.p-100)/100,2)}元。每局对你有利，达到100元的机会随之增加。`}</p>`;
    } else {
      explanation=`<p>现在是输后翻倍，每局获胜机会仍为${v.p}%。每下注1元的平均净收益＝${v.p}%−${100-v.p}%＝${L.f((2*v.p-100)/100,2)}元；下的金额变大，这个平均收益也按金额成倍增加。</p><p>${v.p<50?'每局平均亏钱时，翻倍也会把平均亏损放大。':'现在每局对你有利，翻倍仍会带来一串连输时资金快速减少的风险。'}切回“每局下注1元”，可以看固定下注的理论输光概率；当前翻倍规则的结局见上方300次模拟。</p>`;
    }
    const pending=a.pending?`其中${a.pending}次还没有结局。把它们继续玩下去，最终输光次数会在${a.ruined}到${a.ruined+a.pending}次之间；每次结果会补进“输光”或“达到100元”一列。`:'这300次都已到达0元或100元。';
    $('calculation').innerHTML=explanation;$('simulation-caveat').innerHTML=`<p>上方只模拟到第4000局，理论计算则一直等到每次分出结果。${pending}只取300次实验，也会出现随机起伏，重新模拟会看到不同的计数。</p>`;
    if(v.p===0||v.p===100) $('formula-detail').innerHTML='<p>当前每局的结果已经确定，不需要用一般公式。</p>';
    else if(v.p===50) $('formula-detail').innerHTML=`<p>当前胜率50%，固定下1元时，用上面的平均资金计算即可：最终输光概率＝1−${v.capital}÷100＝${100-v.capital}%。</p>`;
    else $('formula-detail').innerHTML=`<p>这里的${term(`p＝${v.p}%＝${L.f(v.p/100,2)}`)}表示每局胜率，${term(`r＝(1−p)÷p＝${100-v.p}÷${v.p}`)}是输与赢的概率之比。${term(`r${power(v.capital)}`)}表示把${v.capital}个r相乘。</p><p>固定下1元、到0元或100元停止时，输光概率${term(`＝1−(1−r${power(v.capital)})÷(1−r¹⁰⁰)`)}${term(currentTheory)}。</p><p>这条公式按固定下注1元计算。${strategy==='double'?'当前翻倍模拟要看上方的实际统计。':'括号内的分式算达到100元的概率，再用1减去它。'}</p>`;
    $('doubling-expectation').textContent=v.p===50?`公平游戏中，下1元平均净收益为0，下2、4、8元也仍是0。按本页到0元或100元停止的规则，即使输后翻倍，最终输光概率仍＝${100-v.capital}%。翻倍会让一些循环赢回1元，也会在连输时迅速消耗本金。`:`现在每局胜率为${v.p}%，翻倍只改变下注金额，下一局胜率仍是${v.p}%。前面输了多少次，都不会让下一局自动更容易赢。`;
    for(const s of ['flat','double'])$(s).setAttribute('aria-pressed',String(strategy===s));
  });
  $('flat').onclick=()=>{strategy='flat';L.refresh();};$('double').onclick=()=>{strategy='double';L.refresh();};
  $('resample').onclick=()=>{seed++;batchNumber++;L.refresh();};
  $('fair').onclick=()=>{preset='50';L.set({p:50});};$('slight-loss').onclick=()=>{preset='48';L.set({p:48});};
})();
