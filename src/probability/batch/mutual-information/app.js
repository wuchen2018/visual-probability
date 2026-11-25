(() => {
 'use strict';const L=window.Lab,M=window.ProbModels,$=L.$,term=L.term;
 let view='unknown',cell=0;const N=10000;
 const number=(n,d=4)=>new Intl.NumberFormat('zh-CN',{maximumFractionDigits:d}).format(n===0?0:n);
 const pct=n=>`${number(n/100,2)}%`;
 function ratio(num,den,digits=4){const scale=10**digits,units=Math.sign(num)*Math.floor((2*Math.abs(num)*scale+den)/(2*den));return {sign:num*scale===units*den?'＝':'≈',text:number(units/scale,digits)};}
 function entropy(weights){
  const coeff=new Map(),add=(n,times)=>{for(let prime=2;prime*prime<=n;prime++){while(n%prime===0){coeff.set(prime,(coeff.get(prime)||0)+times);n/=prime;}}if(n>1)coeff.set(n,(coeff.get(n)||0)+times);};
  add(N,N);for(const w of weights)if(w)add(w,-w);
  return {coeff,value:M.entropy(weights.map(w=>w/N))};
 }
 function combine(a,b,sign=1){const coeff=new Map(a.coeff);for(const [p,e]of b.coeff)coeff.set(p,(coeff.get(p)||0)+sign*e);return {coeff,value:Math.max(0,a.value+sign*b.value)};}
 function display(m){
  if(![...m.coeff].some(([p,e])=>p!==2&&e!==0))return ratio(m.coeff.get(2)||0,N);
  if(m.value>0&&m.value<.00005)return {sign:'＜',text:'0.0001'};
  return {sign:'≈',text:number(m.value)};
 }
 const shown=m=>{const d=display(m);return d.sign+d.text;};
 function information(n){if(!n)return null;const q=N/n,integer=Number.isInteger(q)&&(q&(q-1))===0;return {value:-Math.log2(n/N),sign:integer?'＝':'≈',text:number(-Math.log2(n/N))};}
 function contribution(n){const info=information(n);return n===0?'＝0':info.sign==='＝'?(()=>{const d=ratio(n*info.value,N);return d.sign+d.text;})():`≈${number(n/N*info.value)}`;}
 function entropyExpression(weights){return weights.filter(w=>w>0).map(w=>`${term(pct(w)+'×')}${term(`(−log₂(${pct(w)}))`)}`).join('＋');}
 function render(v){
  const p=v.p,e=v.noise,joint=[(100-p)*(100-e),(100-p)*e,p*e,p*(100-e)],xWeights=[(100-p)*100,p*100],yWeights=[joint[0]+joint[2],joint[1]+joint[3]],noiseWeights=[(100-e)*100,e*100];
  const hx=entropy(xWeights),hy=entropy(yWeights),hc=entropy(noiseWeights),hxy=entropy(joint),mi=combine(hy,hc,-1);
  L.heat('joint',joint.map(n=>n/N),{rows:['X=0（反面）','X=1（正面）'],cols:['Y=0','Y=1'],cornerLabel:'行X／列Y',caption:'四格概率相加＝100%；点格子查看这一行',selectedRow:view==='unknown'?-1:view==='x0'?0:1,onClick:i=>{cell=i;view=i<2?'x0':'x1';L.refresh();}});
  $('joint').querySelectorAll('[data-cell]').forEach(b=>{const i=Number(b.dataset.cell);b.setAttribute('aria-pressed',String(i===cell));b.setAttribute('aria-label',`硬币X=${Math.floor(i/2)}，消息Y=${i%2}，联合概率${pct(joint[i])}`);});
  const x=Math.floor(cell/2),y=cell%2,px=xWeights[x],flip=x!==y,chance=flip?e:100-e;
  $('joint-calculation').innerHTML=`<p>蓝框当前格：${term(`X=${x}，Y=${y}`)}。硬币这一面的概率${term(`＝${pct(px)}`)}，${flip?'抄反':'抄对'}概率${term(`＝${chance}%`)}。</p><p>同时发生${term(`＝${pct(px)}×${chance}%`)}${term(`＝${pct(joint[cell])}`)}。</p><p>这一格对联合熵的贡献${joint[cell]===0?'＝0 bit。':`${term(`＝${pct(joint[cell])}×`)}${term(`(−log₂(${pct(joint[cell])}))`)}${term(contribution(joint[cell])+' bit')}。`}</p>`;
  let probs,note;
  if(view==='unknown'){
   probs=yWeights.map(n=>n/N);note=`还没看硬币X，分别把两行相加：Y=0的概率＝${pct(joint[0])}＋${pct(joint[2])}＝${pct(yWeights[0])}；Y=1的概率＝${pct(joint[1])}＋${pct(joint[3])}＝${pct(yWeights[1])}。`;
  }else{
   const row=view==='x0'?0:1,rowTotal=xWeights[row];
   if(!rowTotal){probs=[null,null];note=`X=${row}这一行概率＝0%，不会观察到这个条件，此图暂时无法计算。下方的平均条件熵按实际会出现的另一行计算。`;}
   else{probs=[joint[row*2]/rowTotal,joint[row*2+1]/rowTotal];note=`已知X=${row}，棕框这一行共占${pct(rowTotal)}。Y=0：${pct(joint[row*2])}÷${pct(rowTotal)}＝${row===0?100-e:e}%；Y=1：${pct(joint[row*2+1])}÷${pct(rowTotal)}＝${row===0?e:100-e}%。`;
   }
  }
  L.plot('conditional',{x:[-.5,1.5],y:[0,1],xticks:[0,1],xtickLabels:{0:'Y=0',1:'Y=1'},yticks:[0,.25,.5,.75,1],ytickLabels:{0:'0%',.25:'25%',.5:'50%',.75:'75%',1:'100%'},xlabel:'消息Y的结果',ylabel:'概率',bars:probs.map((y,x)=>({x,y}))});$('conditional-note').textContent=note;
  const metrics=[['H(X)','硬币自己有多难猜',hx],['H(Y)','没看硬币时，猜消息',hy],['H(X,Y)','把硬币和消息都弄清',hxy],['H(Y|X)','已知硬币，平均还剩多少',hc],['I(X;Y)','知道硬币后减少的部分',mi]];
  $('metrics').innerHTML=metrics.map(([name,meaning,m])=>`<div class="metric"><span>${name}</span><small>${meaning}</small><strong>${shown(m)} bit</strong></div>`).join('');
  $('quick-mi').textContent=`当前互信息I(X;Y)${shown(mi)} bit。意思是：知道硬币的真实结果X后，猜收到的消息Y时，不确定性平均减少了这些bit。`;
  let meaning='';
  if(p===0||p===100)meaning=`硬币X本来就确定为${p===0?0:1}，看它没有增加线索，互信息＝0 bit。`;
  else if(e===50)meaning='抄对和抄反各一半，消息Y与硬币X独立。知道X后，猜Y仍一样难，互信息＝0 bit。';
  else if(e===0)meaning='没有抄反，知道X就确定Y，平均剩余不确定性＝0 bit。互信息等于硬币自身的信息熵。';
  else meaning=`看过X后，仍有${e}%抄反的随机性，这部分平均不确定性留下来了。`;
  $('summary').innerHTML=`<p>没看X时，猜消息的平均不确定性${term(`H(Y)${shown(hy)} bit`)}；看了X后，平均剩下${term(`H(Y|X)${shown(hc)} bit`)}。</p><p>减少的部分就是互信息，${term(`I(X;Y)${shown(mi)} bit`)}。${meaning}</p>`;
  const infoGood=information(noiseWeights[0]),infoBad=information(noiseWeights[1]);
  const rowExplanation=p===0||p===100?`当前只有X=${p===0?0:1}这一行会出现，概率100%。这一行抄对${100-e}%、抄反${e}%，还剩下的不确定性（条件熵）${shown(hc)} bit。`:`X=0这一行占${100-p}%，X=1这一行占${p}%。抄反概率对两种输入都是${e}%，所以两行各自的还剩下的不确定性（条件熵）都${shown(hc)} bit。按${100-p}%和${p}%加权，平均后仍是这个值。`;
  $('calculation').innerHTML=`<div class="calculation-grid"><section><h3>① 分别猜X和Y</h3><p>H表示平均信息量。对某个概率q＞0的结果，信息量＝−log₂q；概率为0的项不出现，平均贡献记为0。</p><p>−log₂q＝log₂(1÷q)，是在找2的几次方等于1÷q。例如q＝1/2时，1÷q＝2，信息量＝1 bit；q＝10%时，求2的几次方等于10，得到约3.3219 bit。</p><p>硬币两种结果占${100-p}%、${p}%。${term('H(X)＝')}${entropyExpression(xWeights)}${term(shown(hx)+' bit')}。</p><p>消息Y=1的概率${term(`＝${pct(joint[1])}＋${pct(joint[3])}`)}${term(`＝${pct(yWeights[1])}`)}，Y=0占${pct(yWeights[0])}。</p><p>${term('H(Y)＝')}${entropyExpression(yWeights)}${term(shown(hy)+' bit')}。</p></section><section><h3>② 看过X后，还剩多少？</h3><p>抄对占${100-e}%，其信息量${infoGood?`${term(`＝−log₂(${100-e}%)`)}${term(infoGood.sign+infoGood.text+' bit')}`:'不计算，因为不会抄对'}。</p><p>抄反占${e}%，${infoBad?`其信息量${term(`＝−log₂(${e}%)`)}${term(infoBad.sign+infoBad.text+' bit')}`:'不会出现，熵贡献记为0'}。</p><p>对实际会出现的X，剩余不确定性按这两个概率加权：${entropyExpression(noiseWeights)}${term(shown(hc)+' bit')}。</p><p>${rowExplanation}</p><p>这个按实际出现的X取平均的结果，就是${term(`H(Y|X)${shown(hc)} bit`)}。它不随硬币正面比例变化，因为抄写规则的抄反概率没有改变。</p></section><section><h3>③ 同时弄清X和Y</h3><p>先弄清X，再弄清消息中剩下的部分：${term('H(X,Y)＝H(X)＋H(Y|X)')}。</p><p>当前${term(`H(X)${shown(hx)} bit`)}，${term(`H(Y|X)${shown(hc)} bit`)}；两项按原始概率相加，${term(`H(X,Y)${shown(hxy)} bit`)}。</p><p>也可以直接把四格联合熵贡献相加：</p><div class="cell-contributions">${joint.map((n,i)=>`<p>${term(`X=${Math.floor(i/2)},Y=${i%2}`)}：${contribution(n)} bit</p>`).join('')}</div><p>蓝框格子的原式在联合表下方，四格按原始概率相加，也得到${term(`H(X,Y)${shown(hxy)} bit`)}。</p></section><section><h3>④ 知道X，少了多少不确定性？</h3><p>${term('I(X;Y)＝H(Y)−H(Y|X)')}。</p><p>从${term(`H(Y)${shown(hy)} bit`)}中减去${term(`H(Y|X)${shown(hc)} bit`)}，原始数值计算得到${term(`I(X;Y)${shown(mi)} bit`)}。</p><p>用联合熵核对：${term('I(X;Y)＝H(X)＋H(Y)−H(X,Y)')}。当前${term(`H(X)${shown(hx)} bit`)}、${term(`H(Y)${shown(hy)} bit`)}、${term(`H(X,Y)${shown(hxy)} bit`)}，按原始数值算，结果同样${term(shown(mi)+' bit')}。</p></section></div>`;
  for(const id of ['unknown','x0','x1'])$(id).setAttribute('aria-pressed',String(view===id));
  for(const [id,on]of Object.entries({perfect:p===50&&e===0,random:p===50&&e===50,fixed:p===0,reset:p===50&&e===10}))$(id).setAttribute('aria-pressed',String(on));
 }
 L.bind(render);
 for(const id of ['unknown','x0','x1'])$(id).onclick=()=>{view=id;if(id!=='unknown')cell=(id==='x1'?2:0)+cell%2;L.refresh();};
 $('perfect').onclick=()=>L.set({p:50,noise:0});$('random').onclick=()=>L.set({p:50,noise:50});$('fixed').onclick=()=>L.set({p:0,noise:10});$('reset').onclick=()=>{view='unknown';cell=0;L.set({p:50,noise:10});};
})();
