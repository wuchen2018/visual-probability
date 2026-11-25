(() => {
  'use strict';
  const { BOOK, TOTAL, scenario } = window.SimpsonModel;
  const $ = id => document.getElementById(id);
  const term = text => `<span class="formula-term">${text}</span>`;
  const state = { A: BOOK.A.smallN, B: BOOK.B.smallN };

  // Keep recorded ratios exact; round only for display.
  const q = (n, d = 1) => ({ n: BigInt(n), d: BigInt(d) });
  const add = (a, b) => q(a.n * b.d + b.n * a.d, a.d * b.d);
  const divide = (a, n) => q(a.n, a.d * BigInt(n));
  function rounded(value, digits = 2, scale = 1) {
    const numerator = value.n * BigInt(scale) * 10n ** BigInt(digits);
    return { units: (2n * numerator + value.d) / (2n * value.d), exact: numerator % value.d === 0n };
  }
  function decimal(units, digits, trim = false) {
    const s = units.toString().padStart(digits + 1, '0');
    const text = digits ? `${s.slice(0, -digits)}.${s.slice(-digits)}` : s;
    return trim ? text.replace(/\.?0+$/, '') || '0' : text;
  }
  function count(value) {
    const r = rounded(value);
    return { text: decimal(r.units, 2, true), sign: r.exact ? '＝' : '≈', exact: r.exact };
  }
  function percent(value, digits = 2) {
    const r = rounded(value, digits, 100);
    return { text: `${decimal(r.units, digits)}%`, sign: r.exact ? '＝' : '≈' };
  }
  function exactCohort(scheme, c) {
    const b = BOOK[scheme];
    const small = q(c.smallN * b.smallSuccess, b.smallN);
    const large = q(c.largeN * b.largeSuccess, b.largeN);
    const success = add(small, large);
    return {
      small, large, success, rate: divide(success, TOTAL),
      failed: q(BigInt(TOTAL) * success.d - success.n, success.d),
      smallRate: q(b.smallSuccess, b.smallN), largeRate: q(b.largeSuccess, b.largeN),
      smallWeight: q(c.smallN, TOTAL), largeWeight: q(c.largeN, TOTAL)
    };
  }
  // Use enough displayed percentage digits to preserve the final rounded answer.
  function percentageTerms(e) {
    for (let digits = 2; digits <= 12; digits++) {
      const units = [e.smallRate, e.smallWeight, e.largeRate, e.largeWeight]
        .map(v => rounded(v, digits, 100).units);
      const base = 100n * 10n ** BigInt(digits);
      const displayed = q(units[0] * units[1] + units[2] * units[3], base * base);
      if (rounded(displayed, 2, 100).units === rounded(e.rate, 2, 100).units) {
        return {
          terms: [e.smallRate, e.smallWeight, e.largeRate, e.largeWeight].map(v => percent(v, digits).text),
          sign: displayed.n * e.rate.d === e.rate.n * displayed.d && percent(e.rate).sign === '＝' ? '＝' : '≈'
        };
      }
    }
    throw new Error('Percentage substitution needs more precision');
  }

  function renderCase(kind, result, exact) {
    const title = kind === 'small' ? '小结石' : '大结石';
    $(`${kind}-calculations`).innerHTML = ['A', 'B'].map(scheme => {
      const source = BOOK[scheme], c = result[scheme], e = exact[scheme];
      const originalN = source[`${kind}N`], originalSuccess = source[`${kind}Success`];
      const n = c[`${kind}N`], success = count(e[kind]), rate = percent(e[`${kind}Rate`]);
      const calculation = n === originalN
        ? `人数和原记录相同，仍为${originalSuccess}人成功。`
        : `${term(`${n}×（${originalSuccess}÷${originalN}）`)}<wbr>${success.sign}${term(`${success.text}人`)}。`;
      return `<div class="case-row" id="${scheme.toLowerCase()}-${kind}-row">
        <h4 class="row-heading">方案${scheme}</h4>
        <p class="rate-source">原记录的成功率：${term(`${originalSuccess}÷${originalN}${rate.sign}${rate.text}`)}。</p>
        <div class="flow" aria-label="当前${n}名${title}患者，乘以${originalSuccess}除以${originalN}的成功比例，预计成功${success.exact ? '' : '约'}${success.text}人">
          <div><span class="flow-label">当前${title}</span><strong class="flow-value" id="${scheme.toLowerCase()}-${kind}-n">${n}<span class="unit">人</span></strong></div>
          <div><p class="flow-rate">乘以成功率<br>${originalSuccess}/${originalN}</p><div class="flow-arrow" aria-hidden="true"></div></div>
          <div><span class="flow-label">预计成功${success.exact ? '' : '约'}</span><strong class="flow-value" id="${scheme.toLowerCase()}-${kind}-success">${success.text}<span class="unit">人</span></strong></div>
        </div>
        <p class="formula-line">${calculation}</p>
      </div>`;
    }).join('');
    $(`${kind}-conclusion`).textContent = `${title}成功率：A约${percent(exact.A[`${kind}Rate`]).text}，B${kind === 'small' ? '约' : ''}${percent(exact.B[`${kind}Rate`]).text}，A更高。`;
  }

  function renderOverall(scheme, c, e) {
    const lower = scheme.toLowerCase(), b = BOOK[scheme];
    const small = count(e.small), large = count(e.large), success = count(e.success), failed = count(e.failed);
    const rate = percent(e.rate);
    const smallTerm = `${c.smallN}×（${b.smallSuccess}÷${b.smallN}）`;
    const largeTerm = `${c.largeN}×（${b.largeSuccess}÷${b.largeN}）`;
    const sum = small.exact && large.exact
      ? `${term(`${small.text}＋${large.text}${success.sign}${success.text}人`)}`
      : `${term(smallTerm)}<wbr>＋${term(largeTerm)}<wbr>${success.sign}${term(`${success.text}人`)}`;
    const division = success.exact
      ? `${term(`${success.text}÷350${rate.sign}${rate.text}`)}`
      : `（${term(smallTerm)}<wbr>＋${term(largeTerm)}）<wbr>÷350${rate.sign}${term(rate.text)}`;
    $(`overall-${lower}`).innerHTML = `<h3>方案${scheme}合并两类患者</h3>
      <p>总人数：${term(`${c.smallN}＋${c.largeN}＝350人`)}。</p>
      <p id="${lower}-success-equation">预计成功人数：${sum}。</p>
      <p class="formula-line">全部成功人数除以350：<br>${division}。</p>
      <div class="total-rate"><span>整体成功率</span><strong id="rate-${lower}">${rate.text}</strong></div>
      <div class="outcome-bar" role="img" aria-label="方案${scheme}的350人中，小结石预计成功${small.text}人，大结石预计成功${large.text}人，预计未成功${failed.text}人">
        <span class="small-part" style="width:${c.smallContribution * 100}%"></span><span class="large-part" style="width:${c.largeContribution * 100}%"></span><span class="failed-part" style="width:${(1 - c.rate) * 100}%"></span>
      </div>
      <p class="legend"><span class="small-key">小结石成功 ${small.text}人</span><span class="large-key">大结石成功 ${large.text}人</span><span class="failed-key">两类未成功 ${failed.text}人</span></p>`;
  }

  function renderWeights(scheme, c, e) {
    const b = BOOK[scheme], rate = percent(e.rate);
    const sw = percent(e.smallWeight), lw = percent(e.largeWeight);
    const substitution = percentageTerms(e);
    const [rs, ws, rl, wl] = substitution.terms;
    $(`weight-${scheme.toLowerCase()}`).innerHTML = `<h3>方案${scheme}：用两类患者的人数占比加权</h3>
      <p>小结石占${term(`${c.smallN}÷350${sw.sign}${sw.text}`)}；大结石占${term(`${c.largeN}÷350${lw.sign}${lw.text}`)}。</p>
      <p class="weight-equation">${term(`（${b.smallSuccess}÷${b.smallN}）×（${c.smallN}÷350）`)}<wbr>＋${term(`（${b.largeSuccess}÷${b.largeN}）×（${c.largeN}÷350）`)}<wbr>${rate.sign}${term(rate.text)}</p>
      <p>换成百分比看，就是：</p>
      <p class="weight-equation percentage-equation">${term(`${rs}×${ws}`)}<wbr>＋${term(`${rl}×${wl}`)}<wbr>${substitution.sign}${term(rate.text)}</p>`;
  }

  function render() {
    const result = scenario(state.A, state.B);
    const exact = { A: exactCohort('A', result.A), B: exactCohort('B', result.B) };
    for (const scheme of ['A', 'B']) {
      const c = result[scheme], e = exact[scheme], lower = scheme.toLowerCase();
      $(`mix-${lower}-description`).textContent = `小结石${c.smallN}人（占${percent(e.smallWeight).text}），大结石${c.largeN}人（占${percent(e.largeWeight).text}）。`;
      $(`mix-${lower}-small`).style.width = `${c.smallWeight * 100}%`;
      $(`mix-${lower}-large`).style.width = `${c.largeWeight * 100}%`;
      $(`mix-${lower}-bar`).setAttribute('aria-label', `方案${scheme}的小结石${c.smallN}人，大结石${c.largeN}人`);
      $(`mix-${lower}-equation`).textContent = `大结石人数：350−${c.smallN}＝${c.largeN}人。两类加起来仍是350人。`;
      $(`summary-${lower}`).textContent = percent(e.rate).text;
      renderOverall(scheme, c, e);
      renderWeights(scheme, c, e);
    }
    renderCase('small', result, exact);
    renderCase('large', result, exact);
    const bridgeLeft = state.A === BOOK.A.smallN ? '81÷350' : `［${state.A}×（81÷87）］÷350`;
    $('bridge-example').innerHTML = `以当前A的小结石为例：<br>${term(bridgeLeft)}<wbr>＝${term(`（81÷87）×（${state.A}÷350）`)}。`;
    const differencePP = Math.abs(result.difference) * 100;
    const close = differencePP > 0 && differencePP < 0.01;
    const rateA = percent(exact.A.rate).text, rateB = percent(exact.B.rate).text;
    const verdict = close ? `两者很接近，${result.winner}略高，差不足0.01个百分点。` : result.reversed ? '分着比A都更高，合起来B更高。' : result.winner === 'equal' ? '这次合起来两者相同。' : '这次分着比、合起来比，都是A更高。';
    $('summary-verdict').textContent = verdict;
    const headline = result.reversed ? '这次反转了：分着比A更高，合起来B更高' : result.winner === 'equal' ? '这次整体成功率相同' : '这次分着比、合起来比，都是A更高';
    const mixStory = result.sameMix
      ? `现在两边都是小结石${state.A}人、大结石${TOTAL - state.A}人。两边用了相同的人数占比，A在两类患者中更高的成功率，也体现在了整体上。`
      : `现在A接收了${result.A.largeN}名大结石患者，占${percent(exact.A.largeWeight).text}；B接收了${result.B.largeN}名，占${percent(exact.B.largeWeight).text}。${result.reversed ? 'A接收的难治病例占比更高，高到把分组比较的优势反过来了。' : result.A.largeN <= result.B.largeN ? 'A的难治病例占比没有更高，分组成功率的优势在合并后也保留了下来。' : 'A的难治病例占比虽然更高，当前这个差距还没有让整体排序反过来。'}`;
    $('finding').innerHTML = `<h3>${headline}</h3><p>A的整体成功率是<strong>${rateA}</strong>，B是<strong>${rateB}</strong>。${close ? `${result.winner}略高，差不足0.01个百分点。` : ''}${result.reversed ? '分组比较和整体比较反过来，这种现象就叫辛普森悖论。' : ''}</p><p>${mixStory}</p>`;
    $('mix-explanation').textContent = `为什么人数占比会影响结果？对A、B来说，大结石的成功率都比小结石低。沿用各自的分组成功率，大结石占比越高，整体成功率就越低。`;
    $('equal-mix-result').innerHTML = result.sameMix
      ? `现在两边都是<strong>小结石${state.A}人、大结石${TOTAL - state.A}人</strong>。A为<strong>${rateA}</strong>，B为<strong>${rateB}</strong>，A更高。${state.A === 175 ? '两类人数各占50%，所以各自的整体成功率，就是两个分组成功率的平均数。' : ''}`
      : `当前结果：A为<strong>${rateA}</strong>，B为<strong>${rateB}</strong>。点击按钮后，这里会显示两边各175人＋175人的比较结果。`;
    document.querySelectorAll('[data-preset]').forEach(button => {
      if (button.dataset.preset === 'swap') {
        button.textContent = `对调原记录人数（A${BOOK.B.smallN}人／B${BOOK.A.smallN}人）`;
        return;
      }
      const selected = button.dataset.preset === 'book' ? state.A === BOOK.A.smallN && state.B === BOOK.B.smallN : state.A === 175 && state.B === 175;
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  function clearError(scheme) {
    $(`input-error-${scheme.toLowerCase()}`).textContent = '';
    $(`small-${scheme.toLowerCase()}-number`).removeAttribute('aria-invalid');
  }
  function sync() {
    for (const scheme of ['A', 'B']) {
      const id = `small-${scheme.toLowerCase()}`;
      $(id).value = state[scheme];
      $(`${id}-number`).value = state[scheme];
      clearError(scheme);
    }
    render();
  }
  for (const scheme of ['A', 'B']) {
    const id = `small-${scheme.toLowerCase()}`;
    const numberInput = $(`${id}-number`);
    const reportError = empty => {
      $(`input-error-${scheme.toLowerCase()}`).textContent = empty
        ? `${scheme}的小结石人数还没填，计算暂时沿用${state[scheme]}人。`
        : `${scheme}的小结石人数填0到350之间的整数即可，计算暂时沿用${state[scheme]}人。`;
      numberInput.setAttribute('aria-invalid', 'true');
    };
    for (const inputId of [id, `${id}-number`]) $(inputId).addEventListener('input', event => {
      if (event.target === numberInput && numberInput.value === '' && !numberInput.validity.badInput) {
        clearError(scheme);
        return;
      }
      const value = event.target.valueAsNumber;
      if (!Number.isInteger(value) || value < 0 || value > TOTAL) {
        reportError(false);
        return;
      }
      state[scheme] = value;
      $(inputId === id ? `${id}-number` : id).value = value;
      clearError(scheme);
      render();
    });
    numberInput.addEventListener('blur', () => {
      if (numberInput.value === '') reportError(!numberInput.validity.badInput);
    });
  }
  document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.preset === 'book') { state.A = BOOK.A.smallN; state.B = BOOK.B.smallN; }
    else if (button.dataset.preset === 'equal') { state.A = 175; state.B = 175; }
    else { state.A = BOOK.B.smallN; state.B = BOOK.A.smallN; }
    sync();
  }));
  sync();
  document.documentElement.dataset.labReady = 'true';
})();
