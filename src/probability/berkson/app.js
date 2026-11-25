(() => {
  'use strict';
  const M = window.ScatterBerkson;
  const $ = id => document.getElementById(id);
  const f = value => new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 1 }).format(value);
  const term = text => `<span class="formula-term">${text}</span>`;
  const scenarios = {
    actors: {
      title: '你注意到的演员，为什么像是长相和演技只能占一样？', x: '长相', y: '演技', subject: '演员', chosen: '受到关注',
      intro: '假设在所有演员里，长得好不好看，和演技好不好本来互不相干。观众更容易注意到长相出众、或者演技出色的人，长相和演技都普通的人很少进入视野。只看受到关注的演员，两项分数会呈现什么关系？',
      guide: '每个点是一位模拟演员。越往右，长相分数越高；越往上，演技分数越高。我们先设一个简单规则：两项分数合起来达到门槛，演员才会受到关注。其中一项普通，只要另一项够高，也能把总分补上来。'
    },
    beauty: {
      title: '“红颜多薄命”，会不会也和我们记住了谁有关？', x: '美貌', y: '境遇顺遂', subject: '人物', chosen: '被记载',
      intro: '你听过的故事里，可能有不少美貌出众、命运坎坷的女子。这里先假设，美貌和境遇好坏本来互不相干；故事更容易留下特别美貌的人，或者出身、生活条件特别优越的人。按这个假设，普通而境遇不好的女子，就容易被漏掉。',
      guide: '每个点是一位模拟人物。越往右，美貌分数越高；越往上，境遇越顺遂，越往下则越坎坷。这次用“美貌分数＋境遇顺遂分数”筛选：总分达到门槛，人物才会被记载。美貌或优越境遇都能帮助一个人达到门槛。'
    },
    dating: {
      title: '“帅哥出渣男”，会不会也和你愿意认识谁有关？', x: '长相', y: '体贴程度', subject: '人物', chosen: '进入交往考虑范围',
      intro: '先假设在所有人里，长相好不好和相处时体不体贴互不相干。你更容易注意到长相出众的人，或者特别体贴的人，两项都普通的人很少进入你考虑交往的范围。只看你愿意认识的人，长相和体贴程度会呈现什么关系？',
      guide: '每个点是一位模拟人物。越往右，长相分数越高；越往上，相处时越体贴。我们用两项分数的总和筛选：总分达到门槛，才进入交往考虑范围。其中一项普通，可以靠另一项较高的分数补上来。'
    }
  };
  const state = { scenario: 'actors', threshold: M.INITIAL_THRESHOLD, seed: M.INITIAL_SEED, points: M.generate(), person: 701, inspectPlot: 'all-plot', trend: true };
  let current;
  const geometries = new Map();
  const info = () => scenarios[state.scenario];
  const required = (x, s) => {
    const need = state.threshold - x;
    return need > 100 ? `${s.y}即使100分也不够` : need <= 0 ? `${s.y}0分就已经够了` : `${s.y}至少要${need}分`;
  };

  function draw(id, onlySelected) {
    const svg = $(id), rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const width = rect.width, height = rect.height;
    const g = { left: 54, top: 24, width: width - 70, height: height - 74, frameWidth: width, frameHeight: height };
    geometries.set(id, g);
    const X = x => g.left + x / 100 * g.width, Y = y => g.top + (100 - y) / 100 * g.height;
    const s = info(), points = onlySelected ? current.selected : state.points;
    const stats = onlySelected ? current.visible : current.all;
    const polygon = M.area(state.threshold).map(p => `${X(p.x)},${Y(p.y)}`).join(' ');
    const ends = M.boundary(state.threshold), middle = { x: (ends[0].x + ends[1].x) / 2, y: (ends[0].y + ends[1].y) / 2 };
    const cut = `M${X(ends[0].x)},${Y(ends[0].y)} L${X(ends[1].x)},${Y(ends[1].y)}`;
    let content = `<defs><clipPath id="${id}-clip"><rect x="${g.left}" y="${g.top}" width="${g.width}" height="${g.height}"/></clipPath></defs>`;
    content += `<polygon class="selection-area" points="${polygon}"/>`;
    for (const tick of [0, 50, 100]) content += `<line class="plot-grid-line" x1="${X(tick)}" y1="${Y(0)}" x2="${X(tick)}" y2="${Y(100)}"/><line class="plot-grid-line" x1="${X(0)}" y1="${Y(tick)}" x2="${X(100)}" y2="${Y(tick)}"/><text class="tick-label" x="${X(tick)}" y="${Y(0) + 22}" text-anchor="middle">${tick}</text><text class="tick-label" x="${X(0) - 9}" y="${Y(tick) + 5}" text-anchor="end">${tick}</text>`;
    content += `<path class="axis-line" fill="none" d="M${X(0)},${Y(100)} L${X(0)},${Y(0)} L${X(100)},${Y(0)}"/><text class="axis-label" x="${X(50)}" y="${height - 5}" text-anchor="middle">${s.x}（分）</text><text class="axis-label" x="15" y="${Y(50)}" transform="rotate(-90 15 ${Y(50)})" text-anchor="middle">${s.y}（分）</text>`;
    content += `<path class="cut-line" d="${cut}"/>`;
    content += `<g clip-path="url(#${id}-clip)">`;
    const radius = width < 400 ? 2 : 2.5;
    for (const p of points) content += `<circle class="person-point ${current.selectedIds.has(p.id) ? 'selected' : 'excluded'}" data-person="${p.id}" cx="${X(p.x)}" cy="${Y(p.y)}" r="${radius}"/>`;
    if (state.trend && stats.slope !== null) content += `<path class="trend-line" d="M${X(0)},${Y(stats.intercept)} L${X(100)},${Y(stats.intercept + stats.slope * 100)}"/>`;
    const p = points.find(p => p.id === state.person);
    if (p) content += `<circle class="highlight-ring" cx="${X(p.x)}" cy="${Y(p.y)}" r="7"/>`;
    const hx = X(middle.x), hy = Y(middle.y);
    content += '</g>';
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    // Keep the drag hit areas alive throughout each gesture.
    if (!svg.querySelector('.rendered-content')) {
      svg.innerHTML = '<title></title><g class="rendered-content"></g><path class="drag-target" data-drag="true"/><path class="drag-handle" data-drag="true"/>';
    }
    svg.querySelector('title').textContent = `${onlySelected ? '筛选后' : '全体'}${s.subject}：横轴${s.x}，纵轴${s.y}`;
    svg.querySelector('.rendered-content').innerHTML = content;
    svg.querySelector('.drag-target').setAttribute('d', cut);
    svg.querySelector('.drag-handle').setAttribute('d', `M${hx},${hy - 9} L${hx + 9},${hy} L${hx},${hy + 9} L${hx - 9},${hy} Z`);
    svg.setAttribute('aria-label', `${onlySelected ? '筛选后' : '全体'}${points.length}位模拟${s.subject}。横轴${s.x}，纵轴${s.y}。虚线条件为两项分数相加至少${state.threshold}分。`);
    svg.dataset.pointCount = String(points.length);
  }

  function render() {
    const s = info();
    current = M.analyze(state.points, state.threshold);
    $('title').textContent = s.title;
    $('scenario-intro').textContent = s.intro;
    $('reading-guide').textContent = s.guide;
    $('selection-rule').textContent = `${s.x}分数＋${s.y}分数 ≥ ${state.threshold}分，才会${s.chosen}。`;
    $('selection-count').textContent = `共${state.points.length}人，选中${current.selected.length}人，筛掉${current.excluded}人。`;
    $('all-title').textContent = `全体模拟${s.subject}`;
    $('selected-title').textContent = `只看${s.chosen}的${s.subject}`;
    $('all-count').textContent = `${state.points.length}人`;
    $('selected-count').textContent = `${current.selected.length}人`;
    $('all-caption').textContent = state.trend ? '两个分数分别生成，棕线概括整个人群的趋势。' : '两个分数分别生成，完整的人群保留在这幅图里。';
    $('selected-caption').textContent = current.visible.slope === null ? '当前选中的点不足以画出趋势线。可以降低门槛，让更多人出现。' : state.threshold === 0 ? '所有人都留下了，两幅图包含同一群人。' : '两项都高的人只要总分达标，也会留下。留不下来的是总分没够门槛的人。';
    $('trend-legend').hidden = !state.trend;
    if (state.threshold === 0) $('change-explanation').textContent = `现在所有${state.points.length}人都出现，两幅图包含同一群人。你可以把门槛调回120分，观察筛选拿掉了哪些人。`;
    else if (current.visible.slope === null) $('change-explanation').textContent = `当前选中${current.selected.length}人，还看不出整群点的倾斜方向。把门槛调低一些，让更多人出现，再观察。`;
    else if (current.visible.r < -.1) $('change-explanation').textContent = `现在留下${current.selected.length}个绿点。两项都高的人也在其中；同时，靠近门槛时，${s.x}普通的人要靠较高的${s.y}才能留下，${s.x}高的人则允许${s.y}普通。留下的整群点向右下方倾斜：${s.x}越高，${s.y}往往越低，这叫负相关。${state.scenario === 'beauty' ? '这里境遇顺遂分数越低，表示经历越坎坷。' : ''}`;
    else $('change-explanation').textContent = `当前留下${current.selected.length}人，还没有明显向右下方倾斜。把门槛调到120分附近，看看哪些人消失了，再比较整群点的方向。`;
    const p = state.points.find(p => p.id === state.person) || state.points[0];
    const chosen = current.selectedIds.has(p.id), total = M.totalScore(p);
    const personDetail = `<span class="detail-heading">当前查看的这位${s.subject}</span><span>${s.x}${f(p.x)}分，${s.y}${f(p.y)}分。</span><span>${term(`${f(p.x)}＋${f(p.y)}＝${f(total)}分`)}，门槛${state.threshold}分。</span><span>${chosen ? `达到门槛，会${s.chosen}。` : '没达到门槛，在全体图中是灰点，筛选图里没有这个人。'}</span>`;
    const otherDetail = chosen ? '橙圈标出的，是另一幅图中正在查看的同一个人。两幅图里，他的分数和位置相同。' : '全体图中橙圈标出的这个人没有达到门槛，筛选图里没有他。';
    $('person-detail').innerHTML = state.inspectPlot === 'all-plot' ? personDetail : otherDetail;
    $('selected-person-detail').innerHTML = state.inspectPlot === 'selected-plot' ? personDetail : otherDetail;
    $('compensation-intro').textContent = `现在的门槛是${state.threshold}分。${s.x}40分的人，${required(40, s)}；${s.x}80分的人，${required(80, s)}。你可以点击下面的例子，在散点图中找到对应的人。`;
    $('examples').innerHTML = M.PROBES.map(p => {
      const total = M.totalScore(p), yes = total >= state.threshold;
      return `<section class="example-card${state.person === p.id ? ' active' : ''}"><h3>${s.x}${p.x}分，${s.y}${p.y}分</h3><p>${term(`${p.x}＋${p.y}＝${total}分`)}，${total >= state.threshold ? '达到' : '低于'}当前${state.threshold}分门槛。</p><p class="example-status${yes ? '' : ' excluded-status'}">${yes ? `会${s.chosen}，保留为绿点` : '被筛掉，在全体图中是灰点'}</p><button type="button" data-person-example="${p.id}" aria-pressed="${state.person === p.id}">在全体图中看这个人</button></section>`;
    }).join('');
    const beautyComparison = state.threshold <= 80
      ? '这次两个人都达到门槛，都会被记载。当前门槛还没有把这两个人分开。'
      : state.threshold <= 120
        ? '这次美貌80分的人够门槛，留下了故事；美貌40分的人没够门槛，没有被记住。同样坎坷的两个人，因为美貌不同，有了不同的入选结果。'
        : '这次两个人都没有达到门槛，都不会被记载。把门槛调回120分，就能看到前者留下、后者被筛掉的对照。';
    $('scenario-explanation').textContent = state.scenario === 'beauty'
      ? `看美貌80分、境遇顺遂40分，和美貌40分、境遇顺遂40分这两个人。两人的境遇都是40分，一样坎坷，总分分别是120分和80分。${beautyComparison}`
      : state.threshold === 0
      ? '当前所有人都被选中，低分人物也没有消失。把门槛恢复为120分，再对照哪些人会被筛掉，以及剩下的人为什么会显得一项高、另一项低。'
        : state.scenario === 'actors'
          ? '沿着门槛线看，长相少一分，就需要演技多一分，才能达到相同的总分。长相普通的演员，要靠演技补到门槛；长相出众的演员，演技普通也可能够分。右上角两项都高的演员，同样按总分入选。'
          : '沿着门槛线看，长相少一分，就需要体贴程度多一分，才能达到相同的总分。长相普通的人，要靠体贴程度补到门槛；长相出众的人，体贴程度普通也可能够分。两项都高的人，同样按总分入选。';
    $('berkson-explanation').textContent = `${s.x}和${s.y}本来互不相干。我们让两项分数一起决定一个人能不能${s.chosen}，再只看${s.chosen}的人。这次筛选就可能让两项分数看起来一高一低，出现原本人群里没有的关系。这就是这里演示的伯克森悖论。`;
    $('boundary-explanation').textContent = `虚线上的人，${s.x}分数与${s.y}分数之和刚好等于${state.threshold}分。虚线上方的人达到门槛，虚线下方的人没有达到门槛。例如${s.x}40分时，${required(40, s)}。门槛为0时，所有点都被选中；门槛为200时，两项都要达到100分才行。`;
    document.querySelectorAll('[data-scenario]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scenario === state.scenario)));
    document.querySelectorAll('[data-threshold]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.threshold) === state.threshold)));
    draw('all-plot', false);draw('selected-plot', true);
    document.documentElement.dataset.labReady = 'true';
  }

  function setThreshold(value) {
    state.threshold = value;
    $('threshold-number').value = value;
    $('threshold-range').value = value;
    $('threshold-number').removeAttribute('aria-invalid');
    $('threshold-error').textContent = '';
    render();
  }
  for (const id of ['threshold-number', 'threshold-range']) $(id).addEventListener('input', event => {
    if (event.target.value === '' && !event.target.validity.badInput) {
      event.target.removeAttribute('aria-invalid');
      $('threshold-error').textContent = '';
      return;
    }
    const value = event.target.valueAsNumber;
    if (!Number.isInteger(value) || value < 0 || value > 200) {
      event.target.setAttribute('aria-invalid', 'true');
      $('threshold-error').textContent = `门槛填0到200之间的整数即可，暂时仍按刚才的${state.threshold}分筛选。`;
      return;
    }
    setThreshold(value);
  });
  $('threshold-number').addEventListener('blur', () => {
    if ($('threshold-number').value === '') {
      $('threshold-number').setAttribute('aria-invalid', 'true');
      $('threshold-error').textContent = `门槛还没填，暂时仍按刚才的${state.threshold}分筛选。`;
    }
  });
  document.querySelectorAll('[data-scenario]').forEach(button => button.addEventListener('click', () => { state.scenario = button.dataset.scenario;render(); }));
  document.querySelectorAll('[data-threshold]').forEach(button => button.addEventListener('click', () => setThreshold(Number(button.dataset.threshold))));
  $('new-population').addEventListener('click', () => { state.seed++;state.points = M.generate(state.seed);render(); });
  $('show-trend').addEventListener('change', event => { state.trend = event.target.checked;render(); });
  $('examples').addEventListener('click', event => {
    const button = event.target.closest('[data-person-example]');
    if (!button) return;
    state.person = Number(button.dataset.personExample);state.inspectPlot = 'all-plot';render();
    $('all-plot').scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  for (const id of ['all-plot', 'selected-plot']) {
    const svg = $(id);
    let drag = null;
    for (const type of ['touchstart', 'touchmove']) svg.addEventListener(type, event => {
      if (drag && drag.line) event.preventDefault();
    }, { passive: false });
    const toPoint = event => {
      const rect = svg.getBoundingClientRect(), g = geometries.get(id);
      return { x: (event.clientX - rect.left - g.left) / g.width * 100, y: 100 - (event.clientY - rect.top - g.top) / g.height * 100 };
    };
    svg.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      const draggingLine = event.target.dataset.drag === 'true';
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, line: draggingLine, moved: false };
      if (draggingLine) { svg.setPointerCapture(event.pointerId);svg.classList.add('dragging');event.preventDefault(); }
    });
    svg.addEventListener('pointermove', event => {
      if (!drag || !drag.line || drag.id !== event.pointerId) return;
      event.preventDefault();
      if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 3) drag.moved = true;
      if (drag.moved) { const p = toPoint(event);setThreshold(Math.round(Math.max(0, Math.min(200, p.x + p.y)))); }
    });
    svg.addEventListener('pointerup', event => {
      if (!drag || drag.id !== event.pointerId) return;
      const wasMoved = drag.moved;
      if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
      svg.classList.remove('dragging');drag = null;
      if (wasMoved) return;
      const at = toPoint(event), g = geometries.get(id), points = id === 'all-plot' ? state.points : current.selected;
      let closest = null, distance = 13;
      for (const p of points) { const d = Math.hypot((p.x - at.x) / 100 * g.width, (p.y - at.y) / 100 * g.height);if (d < distance) { distance = d;closest = p; } }
      if (closest) { state.person = closest.id;state.inspectPlot = id;render(); }
    });
    svg.addEventListener('pointercancel', () => { drag = null;svg.classList.remove('dragging'); });
    svg.addEventListener('keydown', event => {
      const step = ['ArrowRight', 'ArrowUp'].includes(event.key) ? 1 : ['ArrowLeft', 'ArrowDown'].includes(event.key) ? -1 : 0;
      if (step) { event.preventDefault();setThreshold(Math.max(0, Math.min(200, state.threshold + step))); }
    });
  }
  const observer = new ResizeObserver(() => { if (current) {draw('all-plot', false);draw('selected-plot', true);} });
  document.querySelectorAll('.plot-frame').forEach(frame => observer.observe(frame));
  render();
})();
