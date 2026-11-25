(() => { 'use strict'; const L = Lab, $ = L.$; let heads = 0, tails = 0, truth = .3, reveal = false, lastEvent = '还没记下抛掷结果，两条曲线重合。', lastPlot = null; const maxCount = 1000;
const f=(v,d=4)=>Number(v.toFixed(d)).toString();
function fraction(num,den,digits=2){const scale=10**digits,scaled=num*100*scale;const exact=scaled%den===0;return {value:f(num/den*100,digits)+'%',sign:exact?'＝':'≈'};}
function quotient(num,den){const r=fraction(num,den);return `${f(num)}÷${f(den)}${r.sign}${r.value}`;}
function logGamma(z){const c=[676.5203681218851,-1259.1392167224028,771.3234287776531,-176.6150291621406,12.507343278686905,-.13857109526572012,9.984369578019572e-6,1.5056327351493116e-7];z-=1;let x=.9999999999998099;for(let i=0;i<c.length;i++)x+=c[i]/(z+i+1);const t=z+7.5;return .5*Math.log(2*Math.PI)+(z+.5)*Math.log(t)-t+Math.log(x);}
function density(p,a,b){if(p===0)return a<1?Infinity:a===1?b:0;if(p===1)return b<1?Infinity:b===1?a:0;return Math.exp((a-1)*Math.log(p)+(b-1)*Math.log1p(-p)-logGamma(a)-logGamma(b)+logGamma(a+b));}
function mode(a,b){if(a===1&&b===1)return {kind:'flat',text:'整条水平线一样高'};if(a<1&&b<1)return {kind:'both',text:'0和1附近的两端'};if(a<=1&&b>=1)return {kind:'left',p:0,text:'0%边界'};if(b<=1)return {kind:'right',p:1,text:'100%边界'};const r=fraction(a-1,a+b-2);return {kind:'inside',p:(a-1)/(a+b-2),text:r.value};}
function snapshot(){const {alpha:a0,beta:b0}=L.values(),a=a0+heads,b=b0+tails,mean=a/(a+b),variance=a*b/((a+b)**2*(a+b+1));return {a0,b0,a,b,heads,tails,total:heads+tails,mean,priorMean:a0/(a0+b0),variance,priorVariance:a0*b0/((a0+b0)**2*(a0+b0+1)),mode:mode(a,b),truth,reveal,plot:lastPlot};}
function grid(a,b){const xs=new Set([0,1,a/(a+b)]),sd=Math.sqrt(a*b/((a+b)**2*(a+b+1))),mean=a/(a+b);for(let i=1;i<800;i++)xs.add(i/800);for(let i=0;i<=240;i++){const x=mean+sd*(-7+14*i/240);if(x>0&&x<1)xs.add(x);}for(let i=2;i<=8;i++){xs.add(10**-i);xs.add(1-10**-i);}if(a>1&&b>1)xs.add((a-1)/(a+b-2));return [...xs].sort((a,b)=>a-b).map(p=>({p,y:density(p,a,b)}));}
function characteristicHeight(a,b){if(a===1&&b===1)return 1;if(a>1&&b>1)return density((a-1)/(a+b-2),a,b);let h=1;for(const p of [Math.min(.5,.5/(a+b)),Math.max(.5,1-.5/(a+b))])h=Math.max(h,density(p,a,b));if(a===1)h=Math.max(h,b);if(b===1)h=Math.max(h,a);return h;}
function draw(s){const svg=$('density'),w=svg.getBoundingClientRect().width,h=svg.getBoundingClientRect().height,left=45,top=25,iw=w-left-16,ih=h-top-53;
const need=Math.max(1.2,characteristicHeight(s.a0,s.b0),characteristicHeight(s.a,s.b))*1.12,unit=10**Math.floor(Math.log10(need)),tick=[.25,.5,1,2,2.5,5,10].map(x=>x*unit).find(v=>4*v>=need),yMax=tick*4;
const X=x=>left+x*iw,Y=y=>top+ih-y/yMax*ih,prior=grid(s.a0,s.b0),posterior=grid(s.a,s.b);
let html=`<title>初始Beta(${s.a0},${s.b0})，当前Beta(${s.a},${s.b})</title><defs><clipPath id="density-clip"><rect x="${left}" y="${top}" width="${iw}" height="${ih}"/></clipPath></defs>`;
for(let i=0;i<5;i++){const x=i/4,y=i*tick;html+=`<line class="gridline" x1="${X(x)}" y1="${top}" x2="${X(x)}" y2="${top+ih}"/><text x="${X(x)}" y="${h-28}" text-anchor="middle">${x}</text><line class="gridline" x1="${left}" y1="${Y(y)}" x2="${left+iw}" y2="${Y(y)}"/><text x="${left-7}" y="${Y(y)+4}" text-anchor="end">${f(y,2)}</text>`;}
html+=`<text x="${left}" y="15">概率密度</text><text x="${left+iw/2}" y="${h-5}" text-anchor="middle">可能的正面概率p</text><g clip-path="url(#density-clip)">`;
const line=points=>points.filter(p=>Number.isFinite(p.y)).map((p,i)=>`${i?'L':'M'}${X(p.p)},${Y(p.y)}`).join(' '),postPath=line(posterior),priorPath=line(prior);
html+=`<path d="${postPath} L${X(1)},${Y(0)} L${X(0)},${Y(0)} Z" fill="#26725f" opacity=".12"/><path d="${postPath}" stroke="#26725f" stroke-width="3" fill="none"/><path d="${priorPath}" stroke="#77817c" stroke-width="1.6" stroke-dasharray="5 5" fill="none"/><line x1="${X(s.mean)}" y1="${top}" x2="${X(s.mean)}" y2="${top+ih}" stroke="#a96239" stroke-width="1.7"/>`;
if(s.reveal)html+=`<line x1="${X(s.truth)}" y1="${top}" x2="${X(s.truth)}" y2="${top+ih}" stroke="#5579a2" stroke-width="2.5" stroke-dasharray="2 4"/>`;html+='</g>';
const leftRise=s.a<1||s.a0<1,rightRise=s.b<1||s.b0<1,postRise=s.a<1||s.b<1;
if(leftRise)html+=`<text class="boundary-label" x="${X(0)+6}" y="${top+18}">↑</text>`;if(rightRise)html+=`<text class="boundary-label" x="${X(1)-6}" y="${top+18}" text-anchor="end">↑</text>`;
svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.innerHTML=html;lastPlot={yMax,tick,leftRise,rightRise};
$('boundary-note').textContent=postRise?`${leftRise&&rightRise?'两端':leftRise?'靠0的一端':'靠1的一端'}有曲线不断升高，超出图顶后用↑表示；实际曲线还会继续上升。`:leftRise||rightRise?`灰虚线代表的初始猜测在${leftRise&&rightRise?'两端':leftRise?'靠0的一端':'靠1的一端'}不断升高（超出图顶用↑表示）；加上新记录后，绿实线已经不再贴着边界往上冲。`:'纵轴会随曲线调整，请结合刻度比较高度。';}
function render(){const s=snapshot(),mean=fraction(s.a,s.a+s.b),prior=fraction(s.a0,s.a0+s.b0),count=s.total;
document.querySelectorAll('[data-prior]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.prior===`${s.a0},${s.b0}`)));
$('prior-summary').innerHTML=`初始：Beta(${s.a0},${s.b0})；平均估计${quotient(s.a0,s.a0+s.b0)}，合计${f(s.a0+s.b0)}份初始权重。<br>${count?`保留${count}次抛掷后：Beta(${s.a},${s.b})，平均估计${quotient(s.a,s.a+s.b)}。`:'还没记下抛掷结果，下面假设你开始抛硬币：可以逐次记下正反面，也可以让电脑连抛10次。'}`;
$('counts').innerHTML=`<span>正面 <strong>${heads}</strong>次</span><span>反面 <strong>${tails}</strong>次</span><span>共 <strong>${count}</strong>次</span>`;
for(const id of ['head','tail','auto'])$(id).disabled=count>=maxCount;$('book').disabled=maxCount-count<10;$('clear').disabled=count===0;
$('auto').textContent=count===maxCount?'已满1000次':`让电脑按真概率连抛${Math.min(10,maxCount-count)}次`;
$('event').textContent=count===maxCount?`${lastEvent} 已满1000次，可以清空记录再试。`:lastEvent;
$('local-update').innerHTML=`<p>当前：Beta(${f(s.a0)}＋${heads}，${f(s.b0)}＋${tails})＝Beta(${s.a},${s.b})</p><p>平均估计：${quotient(s.a,s.a+s.b)}</p>`;
$('truth-controls').hidden=!reveal;$('truth-legend').hidden=!reveal;
$('metrics').innerHTML=`<div class="metric"><span>当前α，β</span><strong>(${s.a}, ${s.b})</strong><p>初始权重加抛掷次数</p></div><div class="metric"><span>当前平均估计（期望）</span><strong>${mean.value}</strong><p>${quotient(s.a,s.a+s.b)}</p></div><div class="metric"><span>曲线最高处（众数）</span><strong>${s.mode.text}</strong><p>${s.mode.kind==='inside'?'两个参数都大于1，峰在内部':s.mode.kind==='flat'?'每处密度都相同':'最高处在边界附近'}</p></div><div class="metric"><span>已抛结果：正 / 反</span><strong>${heads} / ${tails}</strong><p>共${count}次；不含初始权重</p></div>`;
const recordNote=count?`这${count}次记了${heads}次正面，正面比例${quotient(heads,count)}。加入后，平均估计从${prior.value}变为${mean.value}。`:`目前还没记下抛掷结果，当前曲线就是初始猜测，平均估计为${prior.value}。`;
$('interpretation').innerHTML=`<p>${recordNote}</p><p>初始权重共${f(s.a0+s.b0)}份，加上${count}次已抛结果，更新后合计${f(s.a+s.b)}份。继续抛并记下结果，数据在估计中占的份量会越来越大；曲线往哪里移，要看你记下的是正面还是反面。</p>`;
$('update-calculation').innerHTML=`<p>正面参数：α＝α₀＋正面次数<br>＝${s.a0}＋${heads}＝${s.a}</p><p>反面参数：β＝β₀＋反面次数<br>＝${s.b0}＋${tails}＝${s.b}</p><p>所以，Beta(${s.a0},${s.b0})变成Beta(${s.a},${s.b})。</p><p>每出现一次正面，我们就给较大的p更多支持；出现一次反面，就给较小的p更多支持。贝塔曲线按这条规则更新后，仍能写成Beta(α,β)，两个参数分别加上正反面次数。</p>`;
$('mean-calculation').innerHTML=`<p>初始平均估计：${quotient(s.a0,s.a0+s.b0)}</p><p>当前平均估计：<span class="line">α÷(α＋β)＝${f(s.a)}÷(${f(s.a)}＋${f(s.b)})</span><span class="line">＝${f(s.a)}÷${f(s.a+s.b)}${mean.sign}${mean.value}</span></p>`;
$('mode-calculation').innerHTML=s.mode.kind==='inside'?`<p>当前α＝${s.a}、β＝${s.b}，两者都大于1，可以用：</p><p>(α−1)÷(α＋β−2)<br>＝(${s.a}−1)÷(${f(s.a+s.b)}−2)<br>＝${f(s.a-1)}÷${f(s.a+s.b-2)}${fraction(s.a-1,s.a+s.b-2).sign}${s.mode.text}</p><p>平均估计为${mean.value}，最高处在${s.mode.text}。</p>`:s.mode.kind==='flat'?'<p>当前Beta(1,1)是一条水平线，各处同样高，平均估计是50%。</p>':`<p>当前Beta(${s.a},${s.b})的最高处在${s.mode.text}。内部峰顶的公式只适用于两个参数都大于1的情况；当前直接看曲线升向哪一端。</p>`;
$('curve-note').textContent=count?`灰线保留最初Beta(${s.a0},${s.b0})，绿线是加入${count}次记录后的Beta(${s.a},${s.b})。棕线的横坐标为当前平均估计${mean.value}。`:`还没记下抛掷结果，灰线与绿线重合，都是Beta(${s.a0},${s.b0})。棕线标出平均估计${mean.value}。`;
draw(s);}
function add(k,m,message){if(heads+tails+k+m>maxCount)return;heads+=k;tails+=m;lastEvent=message;L.refresh();}
$('presets').addEventListener('click',e=>{const b=e.target.closest('[data-prior]');if(!b)return;const [alpha,beta]=b.dataset.prior.split(',').map(Number);L.set({alpha,beta});});
$('head').addEventListener('click',()=>add(1,0,'刚记下1次正面。'));$('tail').addEventListener('click',()=>add(0,1,'刚记下1次反面。'));
$('book').addEventListener('click',()=>add(3,7,'刚加入原书例题的3次正面、7次反面。'));
$('auto').addEventListener('click',()=>{const n=Math.min(10,maxCount-heads-tails);let k=0;for(let i=0;i<n;i++)if(Math.random()<truth)k++;add(k,n-k,`电脑刚模拟抛了${n}次，得到${k}次正面、${n-k}次反面。`);});
$('clear').addEventListener('click',()=>{heads=tails=0;lastEvent='已记下的抛掷结果已清空，当前曲线回到初始猜测。';L.refresh();});
$('reveal').addEventListener('change',e=>{reveal=e.target.checked;L.refresh();});$('truth').addEventListener('change',e=>{truth=+e.target.value;heads=tails=0;lastEvent=`已换成正面概率${f(truth*100)}%的模拟硬币，已记下的抛掷结果已清空。`;L.refresh();});
L.bind(render);window.BetaLab={snapshot,density};
})();
