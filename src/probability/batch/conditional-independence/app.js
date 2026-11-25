(() => {
  'use strict';
  const L = window.Lab, M = window.ProbModels, $ = L.$;
  const TOTAL = 8000;
  let kind = 'mixed';
  const f = n => L.f(n, 2);
  const term = L.term;
  const names = { mixed: '还没看清手里拿的是哪种硬币', fair: '已经看清：手里拿的这枚是正常硬币', double: '已经看清：手里拿的这枚是双正面硬币' };
  function probability(n, d) {
    const scaled = n * 10000;
    const units = Math.floor((2 * scaled + d) / (2 * d));
    return { text: `${f(units / 100)}%`, sign: scaled % d === 0 ? '＝' : '≈' };
  }
  const percentNumber = n => `${f(n)}%`;
  function drawBars(a, before, after) {
    L.plot('comparison', {
      x: [-.5, 1.5], y: [0, 1], xticks: [0, 1], xtickLabels: { 0: '', 1: '' },
      yticks: [0, .25, .5, .75, 1], ytickLabels: { 0: '0%', .25: '25%', .5: '50%', .75: '75%', 1: '100%' },
      xlabel: '', ylabel: '第2抛出现正面的概率',
      bars: a ? [{ x: 0, y: a.b }, { x: 1, y: a.after, color: '#a96239' }] : [],
      extra: a ? ({ X, Y }) => `<text x="${X(0)}" y="${Y(0)+18}" text-anchor="middle" style="font-size:12px"><tspan x="${X(0)}">还不知道</tspan><tspan x="${X(0)}" dy="14">第1抛的</tspan><tspan x="${X(0)}" dy="14">结果时</tspan></text><text x="${X(1)}" y="${Y(0)+18}" text-anchor="middle" style="font-size:12px"><tspan x="${X(1)}">已经知道</tspan><tspan x="${X(1)}" dy="14">第1抛是</tspan><tspan x="${X(1)}" dy="14">正面之后</tspan></text><text class="bar-value" id="before-bar-value" x="${X(0)}" y="${Math.max(15, Y(a.b) - 9)}" text-anchor="middle">${before.text}</text><text class="bar-value" id="after-bar-value" x="${X(1)}" y="${Math.max(15, Y(a.after) - 9)}" text-anchor="middle">${after.text}</text>` : null
    });
    $('comparison').setAttribute('aria-label', a ? `${names[kind]}。对比两根柱子：左边是还不知道第1抛结果的时候，第2抛出现正面的概率，为${before.text}；右边是已经知道第1抛出现正面之后，第2抛出现正面的概率，为${after.text}。` : '袋子里没有这种硬币，无法比较这组概率。');
  }
  function interpret(q, doubleCount, firstHeads, before, after) {
    const doubleKnown = kind === 'double' || (kind === 'mixed' && q === 100);
    const fairKnown = kind === 'fair' || (kind === 'mixed' && q === 0);
    if (doubleKnown) {
      $('interpretation').innerHTML = `<p>${kind === 'mixed' ? '袋子里全是双正面硬币，所以即使没有另外看清手里是哪种硬币，你也已经知道拿到的是哪一种。' : '你已经确认这枚硬币两面都是正。'}第2抛在抛之前就一定是正面，概率是100%。再告诉你第1抛出了正面，第2抛的概率仍是100%。</p><p class="definition">判断独立，看的就是第1抛的结果有没有改变第2抛的概率。100%到100%没有变，所以这种必然出现的结果同样可以独立。</p><p>也可以看两次都正的概率：${term('100%×100%＝100%')}，正好等于两次各自为正的概率相乘。</p>`;
    } else if (fairKnown) {
      $('interpretation').innerHTML = `<p>${kind === 'mixed' ? '袋子里全是正常硬币，所以即使没有另外看清手里是哪种硬币，你也已经知道拿到的是哪一种。' : '你已经确认拿到的是正常硬币。'}第2抛为正面的机会原本就是50%。第1抛无论出了正面还是反面，第2抛仍是50%，不用再猜“是不是拿到了双正面硬币”。</p><p class="definition">先看清手里是哪种硬币以后，第1抛的结果没有改变第2抛的概率。这就叫在已经知道手里是哪种硬币的条件下，两次结果独立。</p>`;
    } else {
      const posterior = probability(doubleCount, firstHeads);
      $('interpretation').innerHTML = `<p>还没看清手里是哪种硬币时，第1抛出了正面，你会更怀疑拿到的是双正面硬币。用本页预计次数算，第1抛为正的${f(firstHeads)}次里，有${f(doubleCount)}次来自双正面硬币。它的占比从${q}%升到${posterior.text}，所以第2抛为正的机会也从${before.text}升到了${after.text}。</p><p>如果先确认是正常硬币，第2抛为正的机会一直是50%；如果先确认是双正面硬币，第2抛为正的机会一直是100%。第1抛出正面，都不会再提供判断手里是哪种硬币的新线索。</p><p class="definition">已经知道手里是哪种硬币后，第1抛的结果不再改变第2抛的概率，这就是这里的条件独立。两次都必然为正的双正面硬币，也是100%到100%没有变。</p>`;
    }
  }
  L.bind(v => {
    const q = v.q, model = M.coin(q / 100, kind);
    const doubleCount = TOTAL * q / 100, fairCount = TOTAL - doubleCount;
    const scope = kind === 'mixed' ? '全部拿硬币再连抛两次的结果' : kind === 'fair' ? '抽到正常硬币的情况' : '抽到双正面硬币的情况';
    $('bag-description').textContent = `正常硬币占${100 - q}%，双正面硬币占${q}%。每轮从袋子里拿出一枚硬币，再连续抛两次。`;
    for (const k of ['mixed', 'fair', 'double']) $(k).setAttribute('aria-pressed', String(kind === k));
    const tableOptions = { rows: ['第1抛是正面', '第1抛是反面'], cols: ['第2抛正面', '第2抛反面'], cornerLabel: '第1抛／\n第2抛', caption: '当前范围内的概率与预计次数' };
    if (!model.possible) {
      $('population-note').textContent = `现在选择了“${names[kind]}”，但袋子里没有这种硬币，也就抽不出这一组。`;
      $('quick-result').textContent = '袋子里没有这种硬币，当前这一组的概率无法计算。';
      L.heat('joint', [null, null, null, null], tableOptions);
      drawBars(null);
      $('counts').textContent = '假如电脑把“拿出一枚硬币、连抛两次、放回袋子”重复8,000轮，抽到这种硬币的预计次数为0。';
      $('table-guide').textContent = '横线表示这一组概率无法计算。';
      $('result').textContent = '袋子里一枚这种硬币都没有，没法单独看这一组的结果。';
      $('calculation-scope').textContent = '袋子里抽不到这种硬币，没有这一组结果，不能用0作分母。';
      $('calculation').innerHTML = '<p class="empty-message">改变袋子里的比例，或者选择“还没看清手里是哪种硬币”，再继续观察。</p>';
      $('interpretation').innerHTML = '<p>先让袋子里有这种硬币，再看清手里是哪种硬币，才能比较知道第1抛结果前后的概率。</p>';
      return;
    }
    const groupTotal = kind === 'mixed' ? TOTAL : kind === 'fair' ? fairCount : doubleCount;
    const counts = kind === 'mixed' ? [fairCount / 4 + doubleCount, fairCount / 4, fairCount / 4, fairCount / 4]
      : kind === 'fair' ? Array(4).fill(fairCount / 4) : [doubleCount, 0, 0, 0];
    const firstHeads = counts[0] + counts[1];
    const before = probability(counts[0] + counts[2], groupTotal);
    const joint = probability(counts[0], groupTotal), first = probability(firstHeads, groupTotal);
    const after = probability(counts[0], firstHeads);
    $('population-note').textContent = kind === 'mixed'
      ? `每100次从袋子里拿硬币，预计${q}次拿到双正面硬币、${100 - q}次拿到正常硬币。${q === 0 || q === 100 ? '袋子里只有一种硬币，所以硬币的种类已经确定。' : '这次还没有查看手里是哪一种。'}`
      : `现在只看${kind === 'fair' ? '正常硬币' : '双正面硬币'}。袋子里的比例保持原样，只统计拿到这种硬币的那些轮次。`;
    $('quick-result').innerHTML = kind === 'fair'
      ? '当前设定：抛之前已经看清手里拿的这枚是正常硬币。<br>不管知不知道第1抛的结果，第2抛出现正面的概率始终都是<strong>50%</strong>，完全没变。'
      : kind === 'double'
        ? '当前设定：抛之前已经看清手里拿的这枚是双正面硬币。<br>不管知不知道第1抛的结果，第2抛出现正面的概率本来就一直是<strong>100%</strong>，完全没变。'
        : `当前设定：还没看清手里这枚硬币是哪一种。<br>还不知道第1抛结果的时候，第2抛出现正面的概率是<strong>${before.text}</strong>；如果已经知道第1抛出现的是正面，第2抛出现正面的概率${before.text === after.text ? '仍然是' : '就变成了'}<strong>${after.text}</strong>。`;
    $('counts').textContent = `假如电脑按袋子里的比例，把“拿出一枚硬币、连抛两次、放回袋子”重复8,000轮。现在只统计${scope}，预计共${f(groupTotal)}轮。每格的预计次数＝这${f(groupTotal)}轮×该格概率。`;
    L.heat('joint', model.joint, { ...tableOptions, selectedRow: 0, cellLabels: counts.map(n => `${f(n)}次`) });
    $('table-guide').textContent = '行看第1抛，列看第2抛。绿色深浅表示每格的概率，文字给出预计次数。棕色边框圈出第1抛为正的一行，知道第1抛为正后就只看这一行。';
    drawBars(model, before, after);
    $('result').innerHTML = `<p>还不知道第1抛结果的时候，第2抛出现正面的概率是${before.text}；如果已经知道第1抛出现了正面，第2抛出现正面的概率${before.text === after.text ? '仍然是' : '就变成了'}<strong>${after.text}</strong>。</p><p>只看棕框里的“第1抛是正面”这一行：${term(`${f(counts[0])}＋${f(counts[1])}＝${f(firstHeads)}次`)}，其中第2抛也出现正面的有${f(counts[0])}次。</p><p class="equation" id="conditional-count-equation">${term(`${f(counts[0])}÷${f(firstHeads)}${after.sign}${after.text}`)}。</p>`;
    const fairWeight = kind === 'mixed' ? 100 - q : kind === 'fair' ? 100 : 0;
    const doubleWeight = 100 - fairWeight;
    $('calculation-scope').textContent = `以下概率都在“${scope}”中计算：正常硬币占${fairWeight}%，双正面硬币占${doubleWeight}%。`;
    $('calculation').innerHTML = `<section class="calculation-card"><h3>1. 两次都为正面</h3><p>正常硬币两次抛掷互不影响，正、正的机会是${term('50%×50%＝25%')}；双正面硬币两次都正的机会是100%。分别乘当前所看范围里两种硬币各自的占比，再相加：</p><p class="equation">${term(`${fairWeight}%×25%`)}<wbr>＋${term(`${doubleWeight}%×100%`)}<wbr>＝${term(percentNumber(fairWeight / 4))}<wbr>＋${term(percentNumber(doubleWeight))}<wbr>＝${term(joint.text)}</p></section>
      <section class="calculation-card"><h3>2. 第1抛为正面</h3><p>正常硬币第1抛为正的机会是50%，双正面硬币是100%，按两种硬币各自的占比相加：</p><p class="equation">${term(`${fairWeight}%×50%`)}<wbr>＋${term(`${doubleWeight}%×100%`)}<wbr>＝${term(percentNumber(fairWeight / 2))}<wbr>＋${term(percentNumber(doubleWeight))}<wbr>＝${term(first.text)}</p><p>在还不知道第1抛结果的时候，两次抛掷用的都是这轮从袋子里随机拿出的同一枚硬币。第1抛和第2抛各自出现正面的概率，都等于这里算出的数。</p></section>
      <section class="calculation-card"><h3>3. 已知第1抛为正，再算第2抛</h3><p>先把“第1抛为正”当作全部范围，再看其中“两次都正”占多少：</p><p class="equation">${term(joint.text)}<wbr>÷${term(first.text)}<wbr>${after.sign}${term(after.text)}</p><p>这和上面的${term(`${f(counts[0])}÷${f(firstHeads)}`)}算的是同一个比例。</p><p>用P记概率，“|”读作“已知”，那么${term('P(第2抛正 | 第1抛正)')}说的就是：已经知道第1抛为正时，第2抛为正的概率。</p><p class="equation">${term('P(第2抛正 | 第1抛正)')}<wbr>＝${term(joint.text)}<wbr>÷${term(first.text)}<wbr>${after.sign}${term(after.text)}</p></section>`;
    interpret(q, doubleCount, firstHeads, before, after);
  });
  for (const k of ['mixed', 'fair', 'double']) $(k).addEventListener('click', () => { kind = k; L.refresh(); });
})();
