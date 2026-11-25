(() => {
  'use strict';
  const { TOTAL, INITIAL, scenario } = window.BerksonModel;
  const $ = id => document.getElementById(id);
  const state = { ...INITIAL };
  const f = value => new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(value);
  const pct = value => value === null ? '—' : `${(value * 100).toFixed(2)}%`;
  const term = text => `<span class="formula-term">${text}</span>`;
  const sum = values => values.map(value => term(f(value))).join('<wbr>＋');
  const groupInfo = [
    { key: 'both', title: '同时骨折、患肺炎', fYes: true, pYes: true },
    { key: 'fractureOnly', title: '只有骨折，没有肺炎', fYes: true, pYes: false },
    { key: 'pneumoniaOnly', title: '只有肺炎，没有骨折', fYes: false, pYes: true },
    { key: 'neither', title: '两种病都没有', fYes: false, pYes: false }
  ];

  function table(prefix, c, selected) {
    return `<table class="count-table" id="${prefix}-count-table">
      <caption>${selected ? '按当前规则预计住院的人数' : '按当前比例计算的全体人数'}（人）</caption>
      <colgroup><col><col><col></colgroup>
      <thead><tr><th scope="col">患者</th><th scope="col">有骨折</th><th scope="col">无骨折</th></tr></thead>
      <tbody>
        <tr class="pneumonia-row"><th scope="row">有肺炎</th><td id="${prefix}-both">${f(c.both)}</td><td id="${prefix}-pneumonia-only">${f(c.pneumoniaOnly)}</td></tr>
        <tr><th scope="row">无肺炎</th><td id="${prefix}-fracture-only">${f(c.fractureOnly)}</td><td id="${prefix}-neither"${selected && c.neither === 0 ? ' class="excluded-cell"' : ''}>${f(c.neither)}</td></tr>
      </tbody>
      <tfoot><tr><th scope="row">合计</th><td id="${prefix}-fracture-total">${f(c.fractureTotal)}</td><td id="${prefix}-no-fracture-total">${f(c.noFractureTotal)}</td></tr></tfoot>
    </table>`;
  }

  function rates(prefix, c, selected) {
    return [
      { key: 'fracture', name: '骨折', numerator: c.both, denominator: c.fractureTotal, rate: c.withFracture },
      { key: 'no-fracture', name: '无骨折', numerator: c.pneumoniaOnly, denominator: c.noFractureTotal, rate: c.withoutFracture }
    ].map(g => `<div class="rate-block" id="${prefix}-${g.key}-comparison">
      <h4>${g.name}组：患肺炎的比例是多少？</h4>
      <p class="fraction-explanation">${selected ? '住院者中，' : '全体人群中，'}${g.name === '骨折' ? '骨折患者' : '没有骨折的人'}共${f(g.denominator)}人，其中${f(g.numerator)}人有肺炎。</p>
      <p class="rate-equation" id="${prefix}-${g.key}-equation">${g.rate === null
        ? '这一组没有人，分母是0，无法计算比例。'
        : `${term(`${f(g.numerator)}÷${f(g.denominator)}`)}<wbr>${Math.abs(g.rate * 100 - Number((g.rate * 100).toFixed(2))) < 1e-10 ? '＝' : '≈'}<strong id="${prefix}-${g.key}-rate">${pct(g.rate)}</strong>`}</p>
      <div class="rate-bar${g.rate === null ? ' unavailable' : ''}" role="img" aria-label="${g.rate === null ? '该组无人，无法计算患肺炎比例' : `${g.name}组患肺炎占${pct(g.rate)}，未患肺炎占${pct(1 - g.rate)}`}"><span style="width:${g.rate === null ? 0 : g.rate * 100}%"></span></div>
      <div class="bar-labels"><span>${g.rate === null ? '该组无人' : '棕色：有肺炎'}</span><span>${g.rate === null ? '' : '灰色：无肺炎'}</span></div>
    </div>`).join('');
  }

  function calculations(s) {
    $('group-calculations').innerHTML = groupInfo.map(info => {
      const fp = info.fYes ? s.fracture : 100 - s.fracture;
      const pp = info.pYes ? s.pneumonia : 100 - s.pneumonia;
      const admission = info.key === 'neither' ? s.other : 100;
      const n = s.population[info.key], h = s.hospital[info.key];
      return `<section class="group-card" data-group="${info.key}">
        <h3>${info.title}</h3>
        <p>${info.fYes ? `骨折占${s.fracture}%` : `没有骨折占100%−${s.fracture}%＝${fp}%`}；${info.pYes ? `肺炎占${s.pneumonia}%` : `没有肺炎占100%−${s.pneumonia}%＝${pp}%`}。</p>
        <p class="population-formula">全体中的人数：<br>${term(`${f(TOTAL)}×${fp}%×${pp}%`)}<wbr>＝${term(`${f(n)}人`)}。</p>
        <div class="admission-flow" aria-label="这组共${f(n)}人，按${admission}%的比例住院，预计住院${f(h)}人">
          <div><span class="flow-label">这组人数</span><strong class="flow-value">${f(n)}</strong></div>
          <div><p class="flow-rate">住院比例<br>${admission}%</p><div class="flow-arrow" aria-hidden="true"></div></div>
          <div><span class="flow-label">住院人数</span><strong class="flow-value">${f(h)}</strong></div>
        </div>
        <p>住院人数：${term(`${f(n)}×${admission}%`)}<wbr>＝${term(`${f(h)}人`)}。</p>
      </section>`;
    }).join('');
    $('hospital-total-equation').innerHTML = `<h3>四组住院人数相加，得到住院总人数</h3><p>${sum(groupInfo.map(g => s.hospital[g.key]))}<wbr>＝${term(`${f(s.hospital.total)}人`)}。</p>`;
  }

  function explain(s) {
    const { population: p, hospital: h } = s;
    if (h.total === 0) {
      $('explanation').innerHTML = '<p>当前没有住院者，所以没有可比较的住院人群。你可以提高两种病的比例，或者让两种病都没有的人也有一部分住院，再观察筛选的影响。</p>';
    } else if (!s.comparable) {
      $('explanation').innerHTML = `<p>当前住院者中，${h.fractureTotal === 0 ? '骨折组' : '无骨折组'}没有人，这一组没有人，分母是0，没法算出患肺炎的比例。我们无法拿一个不存在的组来做两组比较。</p><p>你可以把骨折和肺炎的比例恢复为5%和3%，再改变住院比例，观察两组都有人的情况。</p>`;
    } else if (s.status === 'equal') {
      $('explanation').innerHTML = s.other === 100 && s.pneumonia > 0 && s.pneumonia < 100
        ? `<p>现在全部${f(TOTAL)}人都住院，住院人群与全体人群完全相同。骨折组和无骨折组患肺炎的比例都为${pct(h.withFracture)}，原来独立的两种病，在这个比较中也没有出现关联。</p><p>把两种病都没有的人的住院比例调低，住院人群就会少掉一部分“既没骨折、也没肺炎”的人。你可以观察无骨折组患肺炎的比例怎样上升。</p>`
        : `<p>现在全体人群的肺炎比例为${s.pneumonia}%，两组住院者患肺炎的比例也相同。当前设置下，住院筛选没有让两组产生比例差异。你可以把肺炎比例调到0%和100%之间，再改变住院筛选。</p>`;
    } else {
      $('explanation').innerHTML = `<p>骨折组的${f(p.fractureTotal)}人全部住院，所以组里有肺炎的比例仍是${pct(h.withFracture)}。无骨折组就不同了：有肺炎的${f(p.pneumoniaOnly)}人全部住院，两种病都没有的${f(p.neither)}人却只有${s.other}%住院，也就是${f(h.neither)}人。</p><p>这样，无骨折组里有肺炎的人全留下了，没有肺炎的人只留下${s.other}%。只看住院者时，这组患肺炎的比例就升到了${pct(h.withoutFracture)}。${s.other === 0 ? '当前无骨折的住院者全都有肺炎：他们如果也没有肺炎，就不会被这条规则选进医院。' : ''}</p><p>我们没有改变任何人的患病情况，只改变了你能看到哪些人。在这个模型里，骨折和肺炎都能让人住院；按“是否住院”筛选后，原本独立的两种病，在筛选出来的人群里出现了关联。这就是伯克森悖论。</p>`;
    }
    $('everyone-result').textContent = s.other === 100
      ? s.comparable ? `现在全部${f(TOTAL)}人都住院，两组患肺炎的比例同为${pct(h.withFracture)}。` : '现在全部人都住院；当前有一组人数为0，所以仍不能做两组比例比较。'
      : '这个按钮只把住院比例改成100%，保留你设置的骨折和肺炎比例。';
  }

  function render() {
    const s = scenario(state.fracture, state.pneumonia, state.other);
    const { population: p, hospital: h } = s;
    $('population-premise').textContent = `我们设一组${f(TOTAL)}人的假想人群，其中${s.fracture}%的人骨折，${s.pneumonia}%的人患肺炎。先假定有没有骨折和得不得肺炎互不相干：无论有没有骨折，患肺炎的比例都沿用${s.pneumonia}%。`;
    $('multiplication-intro').innerHTML = `没有骨折的人占${100 - s.fracture}%。在这群人里，患肺炎的比例仍沿用${s.pneumonia}%。所以，只有肺炎、没有骨折的人占${term(`${100 - s.fracture}%×${s.pneumonia}%`)}，人数就是${term(`${f(TOTAL)}×${100 - s.fracture}%×${s.pneumonia}%＝${f(p.pneumoniaOnly)}人`)}。其余三组也这样算，下面分别列出每组人数、住院比例和住院人数。`;
    $('fracture-calculation').textContent = `骨折人数：${f(TOTAL)}×${s.fracture}%＝${f(p.fractureTotal)}人。`;
    $('pneumonia-calculation').textContent = `肺炎人数：${f(TOTAL)}×${s.pneumonia}%＝${f(p.both + p.pneumoniaOnly)}人。`;
    $('other-calculation').innerHTML = `<p>没有骨折占${term(`100%−${s.fracture}%＝${100 - s.fracture}%`)}；没有肺炎占${term(`100%−${s.pneumonia}%＝${100 - s.pneumonia}%`)}。</p><p>两种病独立：没有骨折的这群人里，没有肺炎的比例也沿用${100 - s.pneumonia}%。把两个比例相乘，再乘总人数，得到两种病都没有的人数：${term(`${f(TOTAL)}×${100 - s.fracture}%×${100 - s.pneumonia}%`)}<wbr>＝${term(`${f(p.neither)}人`)}。</p><p>这组预计住院：${term(`${f(p.neither)}×${s.other}%`)}<wbr>＝<strong>${term(`${f(h.neither)}人`)}</strong>。</p>`;
    $('summary-fracture').textContent = pct(h.withFracture);
    $('summary-no-fracture').textContent = pct(h.withoutFracture);
    $('summary-verdict').textContent = h.total === 0 ? '当前没有住院者。' : !s.comparable ? '有一组无人，无法比较。' : s.status === 'equal' ? '两组相同。' : `骨折组更低，约差${(s.difference * 100).toFixed(2)}个百分点。`;
    $('population-table').innerHTML = table('population', p, false);
    $('hospital-table').innerHTML = table('hospital', h, true);
    $('hospital-count').textContent = `按当前规则，预计有${f(h.total)}人住院。下面只保留这些人的记录。`;
    $('excluded-note').textContent = `两种病都没有的人中，${f(s.excluded)}人没有住院，因此没有进入住院记录。`;
    $('population-rates').innerHTML = rates('population', p, false);
    $('hospital-rates').innerHTML = rates('hospital', h, true);
    $('population-conclusion').textContent = p.withFracture === null || p.withoutFracture === null
      ? '全体人群中有一组人数为0，不能计算这一组患肺炎的比例。'
      : `全体人群里，两组患肺炎的比例都是${pct(p.withFracture)}，和我们设定的两种病独立一致。`;
    $('hospital-conclusion').textContent = h.total === 0 ? '当前没有住院者，不能计算比例。' : !s.comparable ? '住院者中有一组人数为0，不能做两组比较。' : s.status === 'equal' ? `住院者中，两组患肺炎的比例同为${pct(h.withFracture)}。` : `住院者中，骨折组患肺炎为${pct(h.withFracture)}，低于无骨折组的${pct(h.withoutFracture)}。`;
    calculations(s);
    explain(s);
    document.querySelectorAll('[data-preset]').forEach(button => {
      const active = button.dataset.preset === 'initial'
        ? Object.keys(INITIAL).every(key => state[key] === INITIAL[key])
        : button.dataset.preset === 'everyone' ? state.other === 100 : state.other === 0;
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function sync() {
    for (const key of Object.keys(INITIAL)) for (const suffix of ['range', 'number']) {
      $(`${key}-${suffix}`).value = state[key];
      $(`${key}-${suffix}`).removeAttribute('aria-invalid');
    }
    for (const key of Object.keys(INITIAL)) $(`${key}-error`).textContent = '';
    render();
  }
  for (const key of Object.keys(INITIAL)) {
    const number = $(`${key}-number`);
    const label = { other: '两种病都没有的人的住院比例', fracture: '骨折比例', pneumonia: '肺炎比例' }[key];
    for (const suffix of ['range', 'number']) $(`${key}-${suffix}`).addEventListener('input', event => {
      if (event.target.value === '' && !event.target.validity.badInput) {
        event.target.removeAttribute('aria-invalid');
        $(`${key}-error`).textContent = '';
        return;
      }
      const value = event.target.valueAsNumber;
      if (!Number.isInteger(value) || value < 0 || value > 100) {
        event.target.setAttribute('aria-invalid', 'true');
        $(`${key}-error`).textContent = `${label}填0到100之间的整数即可，暂时仍按${state[key]}%计算。`;
        return;
      }
      state[key] = value;
      event.target.removeAttribute('aria-invalid');
      $(`${key}-${suffix === 'range' ? 'number' : 'range'}`).value = value;
      $(`${key}-${suffix === 'range' ? 'number' : 'range'}`).removeAttribute('aria-invalid');
      $(`${key}-error`).textContent = '';
      render();
    });
    number.addEventListener('blur', () => {
      if (number.value === '') {
        number.setAttribute('aria-invalid', 'true');
        $(`${key}-error`).textContent = `${label}还没填，暂时仍按${state[key]}%计算。`;
      }
    });
  }
  document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.preset === 'initial') Object.assign(state, INITIAL);
    else state.other = button.dataset.preset === 'everyone' ? 100 : 0;
    sync();
  }));
  sync();
  document.documentElement.dataset.labReady = 'true';
})();
