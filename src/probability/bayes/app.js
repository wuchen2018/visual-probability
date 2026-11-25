import { bayesCounts } from './model.mjs';

const $ = id => document.getElementById(id);
const number = value => new Intl.NumberFormat('zh-CN', { maximumSignificantDigits: 12 }).format(value);
const percent = value => `${(value * 100).toFixed(2)}%`;
const resultLabel = c => c.posterior === null ? '无法计算'
  : c.truePositive > 0 && c.falsePositive > 0 && c.posterior < 0.0001 ? '<0.01%'
  : c.truePositive > 0 && c.falsePositive > 0 && c.posterior >= 0.99995 ? '>99.99%' : percent(c.posterior);
const resultWords = c => resultLabel(c).replace('<', '不到').replace('>', '超过');
const defaults = { prior: 0.1, sensitivity: 99, 'false-positive': 1 };
const values = { ...defaults };
const inputErrors = new Map();
const delays = { 1: 9000, 2: 12000, 3: 9000 };
let step = 2;
let mode = 'experiment';
let playing = false;
let timer = null;

function playbackLabel() {
  $('autoplay').textContent = playing ? '暂停播放' : step === 4 ? '从头自动播放' : step === 1 ? '开始自动播放' : '继续自动播放';
}

function stop() {
  clearTimeout(timer);
  timer = null;
  playing = false;
  playbackLabel();
}

function scrollToLesson() {
  $('lesson').scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}

function calculationLine(id, source, rate, result) {
  const parts = [`${number(source)}×`, `${number(rate)}%=`, number(result)];
  const nodes = [];
  for (const [index, text] of parts.entries()) {
    if (index > 0) nodes.push(document.createElement('wbr'));
    const span = document.createElement('span');
    span.textContent = text;
    nodes.push(span);
  }
  $(id).replaceChildren(...nodes);
}

function explainResult(c) {
  if (c.positive === 0) return '这次没有阳性结果，所以也没有可以用来计算“阳性后患病概率”的人群。';
  if (c.truePositive === 0) return `测出的${number(c.positive)}名阳性全部来自健康人的误判，没有真阳性，所以阳性后患病的概率是0%。`;
  if (c.falsePositive === 0) return `这组参数下，没有健康人被误判。测出的${number(c.positive)}名阳性全部来自患者，所以阳性后患病的概率是100%。`;
  if (c.falsePositive > c.truePositive && c.healthy > c.sick) return `健康人有${number(c.healthy)}人，患者只有${number(c.sick)}人。健康人中${number(values['false-positive'])}%被误判，就有${number(c.falsePositive)}名阳性，已经多过了${number(c.truePositive)}名真阳性。所以只看阳性的人，真正患病的比例${c.posterior < 0.0001 ? '' : '约为'}${resultWords(c)}。`;
  if (c.truePositive === c.falsePositive) return `真阳性和被误判的健康人各有${number(c.truePositive)}人，两组人数一样多，所以阳性的人里有一半确实患病。`;
  return `这次有${number(c.sick)}名患者，其中${number(c.truePositive)}人测出阳性；${number(c.healthy)}名健康人中，${number(c.falsePositive)}人被误判为阳性。${c.truePositive > c.falsePositive ? '真阳性比假阳性多' : '假阳性比真阳性多'}，阳性后患病的概率${resultLabel(c).startsWith('<') || resultLabel(c).startsWith('>') ? '' : '约为'}${resultWords(c)}。`;
}

function expandedCalculation(c) {
  const formulas = [
    ['真阳性人数：', '100,000 × ', `${number(values.prior)}% × `, `${number(values.sensitivity)}% = `, `${number(c.truePositive)}人。`],
    ['假阳性人数：', '100,000 × ', `(100% − ${number(values.prior)}%) × `, `${number(values['false-positive'])}% = `, `${number(c.falsePositive)}人。`]
  ];
  $('expanded-calculation').replaceChildren(...formulas.map(parts => {
    const line = document.createElement('p');
    for (const text of parts) {
      const span = document.createElement('span'); span.className = 'math-term'; span.textContent = text;
      line.append(span, document.createElement('wbr'));
    }
    return line;
  }));
}

function render() {
  const c = bayesCounts(values.prior, values.sensitivity, values['false-positive']);
  const experiment = mode === 'experiment';
  const onlyPositive = !experiment && step === 3;
  const put = (id, value) => { $(id).textContent = number(value); };
  $('scene').classList.toggle('has-long-counts', [c.sick, c.healthy, c.truePositive, c.falsePositive].some(value => number(value).length > 7));
  $('lesson').dataset.mode = mode;
  $('scene').dataset.step = experiment ? 2 : step;
  $('step-copy').hidden = experiment;
  $('back-to-experiment').hidden = experiment;
  $('step-navigation').hidden = experiment;
  $('interaction-region').hidden = !experiment;
  $('experiment-controls').hidden = !experiment;
  $('mobile-result-summary').hidden = !experiment;
  $('lesson-actions').hidden = experiment;
  $('experiment-actions').hidden = !experiment;
  $('playback-settings').hidden = experiment;
  $('after-lesson').hidden = !experiment && step !== 4;
  $('population').hidden = experiment || step > 2;
  $('groups').hidden = !experiment && step === 4;
  $('counts-title').hidden = !experiment;
  $('counts-intro').hidden = !experiment;
  for (const id of ['sick-derivation', 'healthy-derivation']) $(id).hidden = !experiment && step > 2;
  for (const id of ['sick-explanation', 'healthy-explanation']) $(id).hidden = !experiment;
  for (const id of ['sick-origin', 'healthy-origin', 'sick-source', 'healthy-source']) $(id).hidden = onlyPositive;
  $('sick-results').hidden = !experiment && step === 1;
  $('healthy-results').hidden = !experiment && step === 1;
  for (const id of ['sick-transform', 'healthy-transform']) $(id).hidden = !experiment && step !== 2;
  for (const id of ['sick-negative', 'healthy-negative']) $(id).hidden = experiment || step !== 2;
  $('answer').hidden = !experiment && step !== 4;

  put('sick-count', c.sick); put('healthy-count', c.healthy);
  put('tp-count', c.truePositive); put('fp-count', c.falsePositive);
  $('population-explanation').textContent = `患病率是${number(values.prior)}%，也就是每1000人中约有${number(values.prior * 10)}人患病。放到这10万人中，就是100,000×${number(values.prior)}%=${number(c.sick)}名患者，剩下${number(c.healthy)}人没有患病。`;
  const fractional = [c.sick, c.healthy, c.truePositive, c.falsePositive, c.falseNegative, c.trueNegative].some(n => Math.abs(n - Math.round(n)) > Number.EPSILON * Math.max(1, Math.abs(n)) * 8);
  $('counts-intro').textContent = `先按患病比例把10万人分成患者和健康人，再分别对这两组人做检测。下面每一组都写出起始人数、检测比例和阳性人数。${fractional ? '人数出现小数，是说反复检测很多批10万人时，平均每批会有这么多人。' : ''}`;
  $('sick-derivation').textContent = `先算患者人数：100,000×${number(values.prior)}%=${number(c.sick)}人。`;
  $('healthy-derivation').textContent = `其余人没有患病：100,000−${number(c.sick)}=${number(c.healthy)}人。`;
  $('sick-explanation').textContent = c.sick === 0 ? '当前人群里没有患者，所以这一组的真阳性和漏检人数都是0。' : `这${number(c.sick)}名患者中，有${number(values.sensitivity)}%会测出阳性，所以得到${number(c.truePositive)}人。确实患病、也测出阳性的人叫“真阳性”；另外${number(c.falseNegative)}名患者漏检了，测成阴性。`;
  $('healthy-explanation').textContent = c.healthy === 0 ? '当前人群里没有健康人，所以这一组的假阳性和阴性人数都是0。' : `这${number(c.healthy)}名健康人中，有${number(values['false-positive'])}%会被误判为阳性，所以得到${number(c.falsePositive)}人。没有患病、却测出阳性的人叫“假阳性”；另外${number(c.trueNegative)}名健康人测出阴性，结果与他们没有患病的情况相符。`;
  $('sick-label').textContent = onlyPositive ? '确实患病，也测出阳性' : '实际患病';
  $('healthy-label').textContent = onlyPositive ? '没有患病，却测出阳性' : '没有患病';
  $('sick-rate').textContent = `其中${number(values.sensitivity)}%测出阳性`;
  $('healthy-rate').textContent = `其中${number(values['false-positive'])}%被误判`;
  calculationLine('sick-calculation', c.sick, values.sensitivity, c.truePositive);
  calculationLine('healthy-calculation', c.healthy, values['false-positive'], c.falsePositive);
  $('tp-label').textContent = onlyPositive ? '确实患病，也测出阳性' : '测出阳性';
  $('fp-label').textContent = onlyPositive ? '没有患病，却测出阳性' : '被误判为阳性';
  $('tp-note').textContent = onlyPositive ? `真阳性 · 从${number(c.sick)}名患者中测出` : '真阳性';
  $('fp-note').textContent = onlyPositive ? `假阳性 · 从${number(c.healthy)}名健康人中测出` : '假阳性';
  $('sick-negative').textContent = `这组患者中，${number(c.falseNegative)}人漏检，测成阴性。`;
  $('healthy-negative').textContent = `这组健康人中，${number(c.trueNegative)}人测出阴性，结果正确。`;
  $('scene-note').textContent = experiment ? '' : step === 1 ? '两组人数相加，仍然是最开始的10万人。' : step === 2 ? c.positive === 0 ? '两组阳性人数都是0。接下来看看，这时还能不能计算阳性后患病的概率。' : '下一步，只看两组中测出阳性的人。' : step === 3 ? '阴性的人退出计算。接下来，只把这两组阳性的人加起来。' : '';

  const titles = ['先把10万人分成两组', '给两组人做检测', '现在，只看测出阳性的人', '分母只数测出阳性的人'];
  const descriptions = [
    `患病率是${number(values.prior)}%，也就是每1000人中约有${number(values.prior * 10)}人患病。10万人中，约${number(c.sick)}人患病，另外${number(c.healthy)}人没有患病。${fractional ? '人数带小数，表示反复检测很多批10万人时，平均每批的人数。' : ''}`,
    `给两组人用同一种方法做检测。患者中${number(values.sensitivity)}%测出阳性；健康人中${number(values['false-positive'])}%会被误判为阳性。分别乘一下，看看各有多少人。${fractional ? '人数带小数，表示反复检测很多批10万人时，平均每批的人数。' : ''}`,
    c.positive === 0 ? '当前两组阳性人数都是0，这组参数下没有人测出阳性。' : c.truePositive === 0 ? '这组阳性的人全是被误判的健康人，没有查出的患者。' : c.falsePositive === 0 ? '这组阳性的人全部确实患病，没有被误判的健康人。' : '假设有一个人刚刚测出阳性。他可能确实患病，也可能没有患病、被误判了。接下来，只看这两组阳性的人。',
    `两组阳性的人加起来，${number(c.truePositive)} + ${number(c.falsePositive)} = ${number(c.positive)}人。现在问：其中确实患病的${number(c.truePositive)}人，占多少？`
  ];
  $('step-label').textContent = experiment ? '自己试一试' : `第${step}步 / 共4步`;
  $('step-title').textContent = experiment ? '你来改一改，看看人数怎样变化' : titles[step - 1];
  $('step-description').textContent = experiment ? '先只改变患病率，观察真阳性、假阳性的人数和最后的概率。需要时，也可以直接在下面“可选操作项二”里修改检测的准确率。' : descriptions[step - 1];
  document.querySelectorAll('#step-navigation [data-step]').forEach(button => {
    if (Number(button.dataset.step) === step) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  });
  $('previous-step').disabled = step === 1;
  $('next-step').textContent = ['下一步：做检测', '下一步：只看阳性的人', '下一步：算出概率', '回到交互实验'][step - 1];

  $('numerator').textContent = number(c.truePositive);
  $('denominator').textContent = `${number(c.truePositive)} + ${number(c.falsePositive)}`;
  $('posterior').textContent = resultLabel(c);
  $('summary-posterior').textContent = $('posterior').textContent;
  $('summary-tp').textContent = `患者测出阳性：${number(c.truePositive)}人`;
  $('summary-fp').textContent = `健康人被误判：${number(c.falsePositive)}人`;
  $('positive-total-explanation').textContent = c.positive === 0 ? '两组阳性人数都是0，0＋0＝0。这组参数下没有人测出阳性，无法继续计算阳性后患病的概率。' : `把上面两组阳性的人加起来：${number(c.truePositive)}名测出阳性的患者＋${number(c.falsePositive)}名被误判的健康人＝${number(c.positive)}名阳性。我们已经知道检测结果是阳性，接下来只看这${number(c.positive)}人中，有多少人确实患病。`;
  const boundedResult = resultLabel(c).startsWith('<') || resultLabel(c).startsWith('>');
  const exactEnd = c.positive > 0 && (c.truePositive === 0 || c.falsePositive === 0);
  $('approximately').hidden = c.posterior === null || boundedResult;
  $('approximately').textContent = exactEnd ? '=' : '≈';
  document.querySelector('.answer-equation').setAttribute('aria-label', c.posterior === null ? '阳性人数为0，分母为0，无法计算。' : `${number(c.truePositive)}名真阳性，除以全部${number(c.positive)}名阳性，结果${boundedResult ? '' : exactEnd ? '为' : '约为'}${resultWords(c)}。`);
  $('answer-explanation').textContent = c.posterior === null
    ? '按这组参数，没有人测出阳性。分母是0，阳性后患病的概率无法计算。'
    : `在这${number(c.positive)}名阳性的人中，确实患病的是${number(c.truePositive)}人。用${number(c.truePositive)}除以${number(c.positive)}，算出的比例${boundedResult ? '' : exactEnd ? '是' : '约为'}${resultWords(c)}。这就是测出阳性后患病的概率。`;
  $('why-result').textContent = explainResult(c);
  $('denominator-explanation').querySelector('summary').textContent = `“患者中有${number(values.sensitivity)}%测出阳性”和“阳性后患病的概率”，分母为什么不同？`;
  document.querySelector('.positive-composition').hidden = c.posterior === null;
  $('true-share').style.width = `${(c.posterior ?? 0) * 100}%`;
  $('false-share').style.width = `${c.positive === 0 ? 0 : c.falsePositive / c.positive * 100}%`;
  $('true-legend').textContent = `测出阳性的患者：${number(c.truePositive)}人`;
  $('false-legend').textContent = `被误判的健康人：${number(c.falsePositive)}人`;
  $('positive-bar').setAttribute('aria-label', c.posterior === null ? '没有阳性结果' : `测出阳性的${number(c.positive)}人中，${number(c.truePositive)}人确实患病，占${resultWords(c)}；${number(c.falsePositive)}人是被误判的健康人。`);
  const patientComparison = c.sick === 0 ? `检测方法设为能查出${number(values.sensitivity)}%的患者；当前人群没有患者，不能用这批人数计算检出比例。` : `“患者中有${number(values.sensitivity)}%测出阳性”，先只看实际患病的那${number(c.sick)}个人，再数出${number(c.truePositive)}名阳性，分母是${number(c.sick)}：${number(c.truePositive)} ÷ ${number(c.sick)} = ${number(values.sensitivity)}%。`;
  const positiveComparison = c.positive === 0 ? '这组参数下没有人测出阳性，无法计算阳性后患病的概率。' : `“阳性后患病的概率”先选中全部${number(c.positive)}名阳性，再数出${number(c.truePositive)}名患者，分母是${number(c.positive)}：${number(c.truePositive)} ÷ ${number(c.positive)}，结果${boundedResult ? '' : exactEnd ? '为' : '约为'}${resultWords(c)}。`;
  $('comparison-explanation').textContent = `${patientComparison}${positiveComparison}`;
  expandedCalculation(c);
  $('current-method').textContent = `当前设置：${number(values.sensitivity)}%的患者会测出阳性，${number(values['false-positive'])}%的健康人会被误判为阳性。`;
  playbackLabel();
}

function sync() {
  for (const [name, value] of Object.entries(values)) {
    $(name).value = value;
    $(`${name}-number`).value = value;
  }
  inputErrors.clear(); $('input-error').textContent = '';
  render();
}

function schedule() {
  clearTimeout(timer);
  if (!playing || step === 4) { stop(); return; }
  timer = setTimeout(() => {
    step += 1; render();
    if (step === 4) stop(); else schedule();
  }, delays[step] * Number($('pace').value));
}

function setStep(nextStep) {
  stop(); step = Math.max(1, Math.min(4, nextStep)); render(); scrollToLesson();
}

for (const name of Object.keys(values)) {
  for (const id of [name, `${name}-number`]) {
    const read = event => {
      if (event.type === 'input' && event.target.value === '') {
        inputErrors.delete(name); $('input-error').textContent = [...inputErrors.values()].join(' '); return;
      }
      const raw = event.target.valueAsNumber;
      const value = id === name ? Math.round(raw * 1000) / 1000 : raw;
      if (!Number.isFinite(value) || value < 0 || value > 100) {
        const label = { prior: '患病比例', sensitivity: '患者测出阳性的比例', 'false-positive': '健康人被误判的比例' }[name];
        inputErrors.set(name, `${label}请填写0到100之间的数。现在仍按刚才的数值计算。`);
        $('input-error').textContent = [...inputErrors.values()].join(' ');
        return;
      }
      inputErrors.delete(name); $('input-error').textContent = [...inputErrors.values()].join(' ');
      if (event.type === 'blur') return;
      values[name] = value;
      $(name).value = value; $(`${name}-number`).value = value;
      render();
    };
    $(id).addEventListener('input', read);
    if (id.endsWith('-number')) $(id).addEventListener('blur', read);
  }
}
document.querySelectorAll('#step-navigation [data-step]').forEach(button => button.addEventListener('click', () => setStep(Number(button.dataset.step))));
$('previous-step').addEventListener('click', () => setStep(step - 1));
$('next-step').addEventListener('click', () => {
  if (step < 4) { setStep(step + 1); return; }
  stop(); mode = 'experiment'; render(); scrollToLesson();
});
$('autoplay').addEventListener('click', () => {
  if (playing) { stop(); return; }
  if (step === 4) { step = 1; render(); }
  playing = true; playbackLabel(); scrollToLesson(); schedule();
});
$('pace').addEventListener('change', () => { if (playing) schedule(); });
$('playback-settings').querySelector('summary').addEventListener('click', () => { if ($('playback-settings').open) stop(); });
$('playback-settings').addEventListener('toggle', () => { if (!$('playback-settings').open) stop(); });
$('book-example').addEventListener('click', () => { Object.assign(values, defaults); sync(); });
$('higher-prior').addEventListener('click', () => { values.prior = 10; sync(); });
$('back-to-lesson').addEventListener('click', () => {
  stop(); mode = 'lesson'; step = 1; sync(); scrollToLesson();
});
$('back-to-experiment').addEventListener('click', () => {
  stop(); mode = 'experiment'; step = 2; render(); scrollToLesson();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
render();
document.documentElement.dataset.labReady = 'true';
