(() => {
  'use strict';
  const L = window.Lab, M = window.ProbModels, $ = L.$, term = L.term;
  let n = 3, seed = 20261121, simulationSeed = 20262121, round = null, finished = false, lastAction = '', batch = null, batchNumber = 0;
  let manual = { rounds: 0, stay: 0, switch: 0, actual: 0 };
  function ratio(a, b) {
    const scaled = a * 10000, units = Math.floor((2 * scaled + b) / (2 * b));
    return { text: `${L.f(units / 100, 2)}%`, sign: scaled % b === 0 ? '＝' : '≈' };
  }
  function decide(action) {
    if (!round || finished) return;
    finished = true; lastAction = action; manual.rounds++;
    manual[round.choice === round.prize ? 'stay' : 'switch']++;
    if ((action === 'stay' ? round.choice : round.other) === round.prize) manual.actual++;
    L.refresh();
  }
  function draw(v) {
    if (n !== v.doors) {
      n = v.doors; seed++; round = null; finished = false; batch = null; batchNumber = 0;
      manual = { rounds: 0, stay: 0, switch: 0, actual: 0 };
    }
    const stay = ratio(1, n), change = ratio(n - 1, n), opened = round?.opened ?? [];
    $('quick-result').textContent = `当前${n}扇门：坚持的胜率${stay.text}，换门${change.text}。`;
    $('game-status').textContent = !round ? `你站在${n}扇关着的门前，奖品藏在其中一扇后面。先点一扇挑出来！`
      : !finished ? `你先指了第${round.choice + 1}扇。主持人知道答案，已经避开你的门和有奖的门，帮你把另外${n - 2}扇空门都推开了，只留下第${round.other + 1}扇。现在点你最初选的那扇门表示“坚持不换”，点剩下的另一扇关着的门表示“换过去”。`
      : `你${lastAction === 'stay' ? '坚持原选择' : '换了门'}，${(lastAction === 'stay' ? round.choice : round.other) === round.prize ? '恭喜赢到奖品！' : '可惜这扇是空的，没有赢得奖品。'}奖品在第${round.prize + 1}扇，绿色边框标出你的最终选择。`;
    const final = finished ? lastAction === 'stay' ? round.choice : round.other : -1;
    $('doors').innerHTML = Array.from({ length: n }, (_, i) => {
      const isOpen = opened.includes(i), chosen = round?.choice === i;
      const state = finished ? `${i === round.prize ? '奖品' : '空门'}${i === final ? ' · 最终选它' : chosen ? ' · 最初选它' : ''}`
        : isOpen ? '主持人已打开：空门' : round ? chosen ? '你选的门 · 点它坚持' : '剩下的门 · 点它换门' : '点它开始';
      return `<button type="button" class="door${chosen ? ' chosen' : ''}${isOpen ? ' open' : ''}${i === final ? ' final-choice' : ''}${finished && i === round.prize ? ' prize' : ''}" data-door="${i}" ${finished || isOpen ? 'disabled' : ''}><span class="door-name">第${i + 1}扇门</span><span class="door-state">${state}</span></button>`;
    }).join('');
    $('stay').disabled = !round || finished; $('switch').disabled = !round || finished;
    $('manual-summary').textContent = manual.rounds
      ? `你手玩了${manual.rounds}局，实际赢${manual.actual}局。拿同样这些开局对照：如果每局都坚持，本可赢${manual.stay}局；如果每局都换门，本可赢${manual.switch}局。`
      : '你每玩完一局，这里都会累计结果，并用同一个开局对照坚持和换门各会怎样。';
    const sets = [{ color: '#26725f', values: [1 / n, (n - 1) / n] }];
    if (manual.rounds) sets.push({ color: '#5579a2', values: [manual.stay / manual.rounds, manual.switch / manual.rounds] });
    if (batch) sets.push({ color: '#a96239', values: [batch.stay / batch.repeats, batch.switch / batch.repeats] });
    const bars = sets.flatMap((set, j) => set.values.map((y, i) => ({ x: i + (j - (sets.length - 1) / 2) * .23, y, width: sets.length === 1 ? .36 : .19, color: set.color })));
    L.plot('rates', { x: [-.5, 1.5], y: [0, 1], xticks: [0, 1], xtickLabels: { 0: '始终坚持', 1: '始终换门' }, yticks: [0, .25, .5, .75, 1], ytickLabels: { 0: '0%', .25: '25%', .5: '50%', .75: '75%', 1: '100%' }, xlabel: '同样的开局，分别比较两种策略', ylabel: '获胜比例', bars });
    $('manual-key').hidden = !manual.rounds; $('batch-key').hidden = !batch;
    $('rate-table').innerHTML = `<table class="rate-table"><caption>同样一批开局，各用一种策略能赢多少</caption><thead><tr><th>对照来源</th><th>始终坚持</th><th>始终换门</th></tr></thead><tbody><tr><th>按规则计算</th><td id="theory-stay">1/${n}<wbr>${term(`${stay.sign}${stay.text}`)}</td><td id="theory-switch">${n - 1}/${n}<wbr>${term(`${change.sign}${change.text}`)}</td></tr>${manual.rounds ? `<tr><th>手玩${manual.rounds}局</th><td id="manual-stay">${manual.stay}÷${manual.rounds}<wbr>${term(`${ratio(manual.stay, manual.rounds).sign}${ratio(manual.stay, manual.rounds).text}`)}</td><td id="manual-switch">${manual.switch}÷${manual.rounds}<wbr>${term(`${ratio(manual.switch, manual.rounds).sign}${ratio(manual.switch, manual.rounds).text}`)}</td></tr>` : ''}${batch ? `<tr><th>第${batchNumber}批<br>1,000局</th><td id="batch-stay">${batch.stay}÷1,000<wbr>${term(`＝${ratio(batch.stay, batch.repeats).text}`)}</td><td id="batch-switch">${batch.switch}÷1,000<wbr>${term(`＝${ratio(batch.switch, batch.repeats).text}`)}</td></tr>` : ''}</tbody></table>`;
    $('simulation').innerHTML = batch ? `<p class="simulation-batch">第${batchNumber}批已重新模拟1,000局：坚持赢${batch.stay}局，换门赢${batch.switch}局。</p><p>每一局坚持和换门必定一赢一输，所以两种策略赢的次数加起来正好是1,000。这是拿同一局分别比较两种选择。</p>` : '<p>绿色柱是按开门规则算出的胜率。手玩后加入蓝柱；点“重新对照1,000局”后加入一批新的棕柱。</p>';
    $('calculation').innerHTML = `<section class="branch"><h3>情况一：第一把就瞎蒙对了（坚持会赢）</h3><p class="chance">${term(`1/${n}${stay.sign}${stay.text}`)}</p><p>奖品就在你最初指的那扇门后，这种时候坚持原门就能拿奖，换门反而输；但一共${n}扇门，刚开局就刚好蒙中的机会只有1/${n}。</p></section><section class="branch"><h3>情况二：第一把指错了（换门会赢）</h3><p class="chance">${term(`${n - 1}/${n}${change.sign}${change.text}`)}</p><p>只要奖品原本在你没选的那${n - 1}扇门里，主持人就躲不开它——他必须从这${n - 1}扇里把别的${n - 2}扇空门挑出来推开，唯一留到最后没开的那扇，背后一定就是奖品！换过去就赢了。</p></section>`;
    $('why-not-half').innerHTML = `<p>直觉之所以容易算成一半一半，是因为只盯着最后关着的两扇门看，忘了这两扇门的来历完全不同：原门是你两眼一抹黑随机指的，胜率一直是${stay.text}；另一扇则是主持人拿着答案、把其余${n - 1}扇里的空门统统排查过滤掉以后才留下的门，把另外那组${change.text}的胜率全吸到自己身上了。</p><p>${n === 10 ? '看现在这10扇门就特别清楚：你一开始只有10%的机会蒙对，另外9扇合起来占90%。主持人帮你排掉8扇空门，奖品并没有消失，只是把那90%的机会全部压缩到了最后留下的那一扇门上。三扇门的原理和十扇门一模一样，只是2/3没有9/10那么直观。' : '点一下“试试十扇门”再看：原门只有10%的机会，另外九扇合起来占90%；主持人帮你排除八扇空门后，那90%的机会就全集中到了留下的那一扇门上。三扇门和十扇门其实是一回事。'}</p>`;
  }
  L.bind(draw);
  $('doors').onclick = e => {
    const b = e.target.closest('[data-door]'); if (!b || b.disabled || finished) return;
    const i = Number(b.dataset.door);
    if (!round) { round = M.montyRound(n, i, seed); L.refresh(); }
    else decide(i === round.choice ? 'stay' : 'switch');
  };
  for (const action of ['stay', 'switch']) $(action).onclick = () => decide(action);
  $('new-round').onclick = () => { seed++; round = null; finished = false; L.refresh(); };
  $('simulate').onclick = () => { simulationSeed++; batchNumber++; batch = M.simulateMonty(n, 1000, simulationSeed); L.refresh(); };
  $('try-ten').onclick = () => L.set({ doors: 10 }); $('try-three').onclick = () => L.set({ doors: 3 });
})();
