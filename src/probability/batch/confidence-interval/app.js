(()=>{'use strict';
const $=id=>document.getElementById(id),zValues={90:1.645,95:1.96,99:2.576};
let level=95,n=36,groups=[],selected=0,geometry;
const f=(v,d=5)=>Number(v.toFixed(d)).toString();
function normal(){let u=0;while(!u)u=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*Math.random());}
function sample(){const raw=Array.from({length:n},()=>171+6*normal());return {raw,mean:raw.reduce((a,b)=>a+b,0)/n};}
function fresh(count){groups=Array.from({length:count},sample);selected=0;render();}
function snapshot(){const se=6/Math.sqrt(n),radius=zValues[level]*se;return {n,level,z:zValues[level],se,radius,selected,groups:groups.map(g=>({...g,low:g.mean-radius,high:g.mean+radius,hit:Math.abs(g.mean-171)<=radius}))};}
function draw(s){const svg=$('intervals'),w=svg.getBoundingClientRect().width,h=svg.getBoundingClientRect().height,left=35,right=16,top=22,bottom=50,iw=w-left-right,ih=h-top-bottom;
const minReach=s.n<=9?9:s.n<=16?7:s.n<=36?5.5:4,reach=Math.max(minReach,...s.groups.flatMap(g=>[Math.abs(g.mean-171)+zValues[99]*s.se+.5])),step=Math.ceil(reach/2),lo=171-2*step,hi=171+2*step;
const X=v=>left+(v-lo)/(hi-lo)*iw,Y=i=>top+(i+.5)/s.groups.length*ih;
let html=`<title>${groups.length}组区间，真实平均身高固定为171厘米</title>`;
for(let i=0;i<5;i++){const v=lo+i*step;html+=`<line x1="${X(v)}" y1="${top}" x2="${X(v)}" y2="${top+ih}" stroke="#e4ebe5"/><text x="${X(v)}" y="${h-28}" text-anchor="middle">${v}</text>`;}
html+=`<text x="${left+iw/2}" y="${h-5}" text-anchor="middle">估计的平均身高（厘米）</text>`;
const sg=s.groups[selected];html+=`<rect x="${X(sg.low)-3}" y="${Y(selected)-5}" width="${Math.max(8,X(sg.high)-X(sg.low)+6)}" height="10" rx="2" fill="#5579a2" fill-opacity=".22" stroke="#5579a2" stroke-width="1.5"/>`;
const ordered=[...s.groups.map((g,i)=>({g,i})).filter(x=>x.g.hit),...s.groups.map((g,i)=>({g,i})).filter(x=>!x.g.hit)];
for(const {g,i} of ordered){const color=g.hit?'#26725f':'#b65b23';html+=`<g data-pick="${i}"><title>第${i+1}组：${f(g.low)}至${f(g.high)}厘米，${g.hit?'包含':'未包含'}171</title><line x1="${X(g.low)}" y1="${Y(i)}" x2="${X(g.high)}" y2="${Y(i)}" stroke="${color}" stroke-width="${g.hit?2:3.2}"/><circle cx="${X(g.mean)}" cy="${Y(i)}" r="2" fill="${color}"/></g>`;}
html+=`<line x1="${X(171)}" y1="${top-10}" x2="${X(171)}" y2="${top+ih+2}" stroke="#fcfdfb" stroke-width="3.6" opacity=".82"/><line x1="${X(171)}" y1="${top-10}" x2="${X(171)}" y2="${top+ih+2}" stroke="#233029" stroke-width="1.9" stroke-dasharray="5 4"/>`;
for(const i of [...new Set([selected,...[0,s.groups.length-1].filter(i=>Math.abs(Y(i)-Y(selected))>=18)])])html+=`<text class="group-label" x="${left-7}" y="${Y(i)+4}" text-anchor="end">${i+1}</text>`;
svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.innerHTML=html;geometry={top,ih,count:s.groups.length};}
function render(){const s=snapshot(),count=groups.length,hits=s.groups.filter(g=>g.hit).length,miss=count-hits,g=s.groups[selected];
document.querySelectorAll('[data-level]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.level===level)));
$('level-help').textContent=`${level}%采用z＝${s.z}，区间两边各加${f(s.radius)}厘米。倍数越大，区间越宽。`;
$('size-help').textContent=`n＝${n}，√${n}＝${Math.sqrt(n)}；标准误差＝6÷${Math.sqrt(n)}＝${f(s.se)}厘米。`;
$('summary').innerHTML=`<span>已抽 <strong>${count}组</strong></span><span>覆盖 <strong>${hits}组</strong>（${f(hits/count*100,2)}%）</span><span>未覆盖 <strong>${miss}组</strong></span><span>单侧宽度 <strong>${f(s.radius)}厘米</strong></span>`;
$('add').disabled=count===100;$('next-miss').disabled=miss===0;
$('next-miss').textContent=miss?'查看一组未覆盖的区间':'当前各组都覆盖了171';
const picker=$('group');if(picker.options.length!==count)picker.innerHTML=groups.map((_,i)=>`<option value="${i}">第${i+1}组</option>`).join('');picker.value=String(selected);
$('selected').innerHTML=`<p>第${selected+1}组：随机测量${n}人，把身高相加后除以${n}，样本平均数<span class="term">x̄≈${f(g.mean,4)}厘米</span>。x̄就是用来表示样本平均数的符号。</p><p>标准误差＝6÷√${n}＝${f(s.se)}厘米<br>单侧宽度＝${s.z}×${f(s.se)}＝${f(s.radius)}厘米</p><p>区间＝（x̄−${f(s.radius)}，x̄＋${f(s.radius)}）<br>两端约为（${f(g.low,4)}，${f(g.high,4)}）<span class="term">厘米</span>。<br><span class="coverage-word ${g.hit?'':'miss'}">${g.hit?'包含':'未包含'}固定的171厘米。</span></p>${g.hit?'':'<p class="caption">假设现实中只做了这一次抽样，调查员拿着这组区间，其实并不知道自己刚好碰上了漏掉真值的那少数情况。</p>'}<p class="caption">平均数和端点最多显示4位小数，图和判断使用未四舍五入的数值。</p>`;
$('raw-note').textContent=`单位：厘米，共${n}人。这里显示到小数点后两位，平均数用四舍五入前的身高计算。`;
$('raw-values').innerHTML=g.raw.map(v=>`<span>${v.toFixed(2)}</span>`).join('');
$('interpretation').innerHTML=`<p>这${count}组区间里，${hits}组包含171厘米，${miss}组没包含。171一直没变，变的是每次抽到的平均数，以及围绕平均数画出的区间。</p><p>${level}%说的是这套方法在反复抽样中的覆盖比例，当前${count}组得到的是${f(hits/count*100,2)}%。多抽几批，这个比例仍会有起伏。某一组区间算好以后，它是否包含171已经确定；调查员在实际调查中不知道真值，也就不知道这一组有没有覆盖。</p>`;
$('example-se').textContent=`标准误差＝6÷√${n}＝6÷${Math.sqrt(n)}＝${f(s.se)}厘米`;
$('example-radius').textContent=`${level}%：单侧宽度＝${s.z}×${f(s.se)}＝${f(s.radius)}厘米`;
$('example-ends').innerHTML=`<p>170.2−${f(s.radius)}＝${f(170.2-s.radius)}<br>170.2＋${f(s.radius)}＝${f(170.2+s.radius)}</p><p>区间为（${f(170.2-s.radius)}，${f(170.2+s.radius)}）厘米。</p>`;
draw(s);}
$('levels').addEventListener('click',e=>{const b=e.target.closest('[data-level]');if(b){level=+b.dataset.level;render();}});
$('sample-size').addEventListener('change',e=>{n=+e.target.value;fresh(groups.length);});
$('add').addEventListener('click',()=>{if(groups.length<100){groups.push(sample());selected=groups.length-1;render();}});
$('hundred').addEventListener('click',()=>fresh(100));$('restart').addEventListener('click',()=>fresh(1));
$('group').addEventListener('change',e=>{selected=+e.target.value;render();});
$('next-miss').addEventListener('click',()=>{const s=snapshot();for(let offset=1;offset<=groups.length;offset++){const i=(selected+offset)%groups.length;if(!s.groups[i].hit){selected=i;render();break;}}});
$('intervals').addEventListener('click',e=>{const target=e.target.closest('[data-pick]');if(target)selected=+target.dataset.pick;else{const r=e.currentTarget.getBoundingClientRect();selected=Math.max(0,Math.min(groups.length-1,Math.floor((e.clientY-r.top-geometry.top)/geometry.ih*geometry.count)));}render();});
window.addEventListener('resize',()=>render());window.ConfidenceLab={snapshot};fresh(20);document.documentElement.dataset.labReady='true';
})();
