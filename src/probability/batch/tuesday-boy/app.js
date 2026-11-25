(() => {
  'use strict';
  const L = window.Lab, M = window.ProbModels, $ = L.$, term = L.term;
  const dayNames = ['一', '二', '三', '四', '五', '六', '日'];
  let method = 'family', selected = 1, selectedChild = 0;
  const daysNow = () => [...document.querySelectorAll('[data-day]:checked')].map(n => Number(n.dataset.day));
  const child = i => `${i < 7 ? '男孩' : '女孩'}，星期${dayNames[i % 7]}出生`;
  const short = i => `${i < 7 ? '男' : '女'}${dayNames[i % 7]}`;
  const qualifies = (i, days) => i < 7 && days.includes(i);
  function probability(n, d) {
    const scaled = n * 10000, units = Math.floor((2 * scaled + d) / (2 * d));
    return { text: `${L.f(units / 100, 2)}%`, sign: scaled % d === 0 ? '＝' : '≈' };
  }
  function chooseEligible() {
    const days = daysNow(), a = M.tuesday(days, method), current = a.families[selected];
    if (!days.length) return;
    if (method === 'family' && current.eligible) return;
    if (method === 'random' && qualifies(selectedChild === 0 ? current.a : current.b, days)) return;
    if (method === 'random' && current.eligible) { selectedChild = qualifies(current.a, days) ? 0 : 1; return; }
    selected = a.families.findIndex(f => f.eligible);
    selectedChild = qualifies(a.families[selected].a, days) ? 0 : 1;
  }
  function board(a, days, part) {
    const title = method === 'family' ? '每户只算一次：196种家庭情况' : `眼前是${part === 0 ? '大孩' : '小孩'}：196种观察情况`;
    const current = a.families[selected], active = method === 'family' || selectedChild === part;
    const detail = active
      ? `当前家庭：大孩${child(current.a)}；小孩${child(current.b)}。${method === 'family' ? current.eligible ? '至少一个孩子符合，保留这户，只算一次。' : '两个孩子都不符合，这户没有入选。' : `这幅图记录的是：眼前的孩子是${part === 0 ? '大孩' : '小孩'}，${qualifies(part === 0 ? current.a : current.b, days) ? '这次符合条件。' : '这次不符合条件。'}同一家庭共有${current.weight}种遇到孩子的情况符合条件。`}`
      : `这幅图固定记录眼前的孩子是${part === 0 ? '大孩' : '小孩'}。点任意格子，可以在这里看眼前这个孩子是否符合条件。`;
    return `<section class="family-board" data-board="${part}"><h3>${title}</h3><p class="board-note">行对应大孩，列对应小孩；每个格子都是一种同样可能的情况。</p><table class="family-table" aria-label="${title}"><colgroup><col class="axis-column"><col span="14"></colgroup><thead><tr><th class="axis-corner"><span>大孩↓</span><span>小孩→</span></th>${Array.from({ length: 14 }, (_, b) => `<th scope="col" class="${b === 6 ? 'sex-col-end' : ''}"><span class="column-label">${short(b)}</span></th>`).join('')}</tr></thead><tbody>${Array.from({ length: 14 }, (_, ai) => `<tr class="${ai === 6 ? 'sex-row-end' : ''}"><th scope="row" class="row-label">${short(ai)}</th>${Array.from({ length: 14 }, (_, bi) => {
      const index = ai * 14 + bi, f = a.families[index];
      const yes = method === 'family' ? f.eligible : qualifies(part === 0 ? f.a : f.b, days);
      const focused = selected === index && active;
      return `<td class="${bi === 6 ? 'sex-col-end' : ''}"><button type="button" class="family-cell ${yes ? f.boys ? 'both' : 'other' : ''}${focused ? ' active' : ''}" data-family="${index}" data-child="${part}" tabindex="${selected === index ? 0 : -1}" aria-label="${method === 'random' ? `眼前是${part === 0 ? '大孩' : '小孩'}；` : ''}大孩${child(ai)}；小孩${child(bi)}；${yes ? '入选' : '没有入选'}"></button></td>`;
    }).join('')}</tr>`).join('')}</tbody></table><p class="board-detail" id="${active ? 'family-detail' : `family-detail-other-${part}`}" ${active ? 'role="status" aria-atomic="true"' : ''}>${detail}</p></section>`;
  }
  function render() {
    const days = daysNow(), a = M.tuesday(days, method), m = days.length;
    const p = a.denominator ? probability(a.numerator, a.denominator) : null;
    $('method-note').textContent = method === 'family'
      ? '情况一：先把所有家庭情况同等看待，再只保留“至少有一个男孩出生在上面勾出的星期里”的家庭。一户无论有几个孩子符合条件，都只算一次。'
      : '情况二：先随机看一家，再随机碰到大孩或小孩。只保留眼前这个孩子是男孩、且出生在上面勾出的星期里的情况。另一个孩子的性别与他互不影响。';
    $('family-space-title').textContent = method === 'family' ? '196种家庭情况，哪些入选？' : '两幅图各196格，共392种观察情况';
    $('grid-guide').textContent = method === 'family' ? '找到勾选星期对应的男孩行、男孩列，入选的格子就在这些横条和竖条里。左上男、男区域共有7×7＝49格。' : '每一幅图都按大孩、小孩的14种情况排列。两幅图的家庭坐标相同，分别记录眼前是大孩、眼前是小孩；同一家庭可以在两幅图各入选一次。';
    $('families').innerHTML = method === 'family' ? board(a, days, 0) : board(a, days, 0) + board(a, days, 1);
    const unit = method === 'family' ? '家庭情况' : '观察情况';
    $('quick-result').innerHTML = p ? `当前勾选${m}天：${a.numerator}÷${a.denominator}${p.sign}<strong>${p.text}</strong>。${m === 7 ? method === 'family' ? '七天全选，相当于“至少有一个男孩”，概率回到1/3。' : '七天全选，另一个孩子是男孩的概率仍为1/2。' : ''}` : '一天都没勾，请至少选一天，再计算这道题。';
    $('result').innerHTML = p ? `<p>两个男孩且入选：<strong id="numerator">${a.numerator}</strong>种${unit}。</p><p>全部入选：<strong id="denominator">${a.denominator}</strong>种${unit}。</p><p id="answer-equation">${a.numerator}÷${a.denominator}${p.sign}<strong>${p.text}</strong>。</p>` : '一天都没勾，请至少选一天，再计算条件概率。';
    if (!m) {
      $('calculation').innerHTML = '<p class="empty-message">目前没有入选情况，不能用0作分母。</p>';
    } else if (method === 'family') {
      $('calculation').innerHTML = `<section class="count-block"><h3>先数全部入选格子：横条＋竖条−交叉</h3><p>大孩符合的${m}行，每行14格，共${m * 14}格；小孩符合的${m}列，每列14格，也有${m * 14}格。交叉的${m}×${m}＝${m * m}格重复算了一次，要减掉：</p><p class="count-equation">${term(`${m * 14}＋${m * 14}−${m * m}＝${a.denominator}种`)}</p></section><section class="count-block"><h3>再数其中两个男孩的格子</h3><p>只看左上角男、男的7×7区域。横条在这里有${m}×7＝${m * 7}格，竖条也有7×${m}＝${m * 7}格，交叉仍是${m * m}格：</p><p class="count-equation">${term(`${m * 7}＋${m * 7}−${m * m}＝${a.numerator}种`)}</p></section><section class="count-block"><h3>换个方向，用减法也能核对</h3><p>每个孩子有${14 - m}种不符合的情况。全部196格减掉两人都不符合的格子：</p><p class="count-equation">${term(`196−${14 - m}×${14 - m}＝${a.denominator}`)}</p><p>两男区域的49格，减掉两个男孩都没在已选星期出生的格子：</p><p class="count-equation">${term(`49−${7 - m}×${7 - m}＝${a.numerator}`)}</p></section>`;
    } else {
      $('calculation').innerHTML = `<section class="count-block"><h3>先把“眼前是哪一个孩子”也记进格子</h3><p>196种家庭情况，每种都可能眼前是大孩或小孩，所以共有196×2＝392种同样可能的观察情况。</p><p>眼前是大孩时，大孩有${m}种符合的情况，小孩可取14种，入选${m * 14}格。眼前是小孩时反过来，也是${m * 14}格。两幅图相加：</p><p class="count-equation">${term(`${m}×14＋14×${m}＝${a.denominator}种`)}</p></section><section class="count-block"><h3>其中两个男孩有多少格？</h3><p>眼前这个孩子已经是男孩。另一个也是男孩时，只剩7种星期情况。眼前是大孩有${m * 7}格，眼前是小孩也有${m * 7}格：</p><p class="count-equation">${term(`${m}×7＋7×${m}＝${a.numerator}种`)}</p><p>所以${term(`${a.numerator}÷${a.denominator}＝50%`)}，只要勾选了至少一天，结果就一样。</p></section>`;
    }
    $('day-explanation').innerHTML = `<p>先不看星期，两孩性别按顺序有男男、男女、女男、女女四种同样可能的情况。筛出“至少一个男孩”，去掉女女后剩三种，男男占一种，所以是1/3。</p><p>只勾一天时，两男家庭有两个孩子可以碰到这一天；一男一女家庭只有那个男孩可以碰到。原来49种两男、98种一男一女，筛选后留下13种两男、14种一男一女，于是得到${term('13÷27≈48.15%')}。</p><p>两男家庭的两次机会，在“两人都出生在这一天”的交叉格里会碰在一起，所以那个家庭只能算一次。只选一天，交叉只有1格；全选七天，交叉变成49格，筛选就回到普通的“至少一个男孩”。</p><div class="progression"><section><h3>① 全选七天：只知道至少一男</h3><p>两男家庭有49格，一男一女有98格。两条入选带在两男区域重叠49格，减掉重复后，是49÷147＝1/3≈33.33%。</p></section><section><h3>② 只选星期二：再加一个具体条件</h3><p>两条入选带的交叉缩成1格。留下13格两男、14格一男一女，所以是13÷27≈48.15%。</p></section><section><h3>③ 再加更罕见的特征</h3><p>比如星期二出生，而且喜欢唱跳rap篮球。在本题两个孩子互不影响、附加特征与性别无关的假设下，一户两个男孩同时都满足这些条件的情况会更少。</p><p>两男家庭有两个孩子去碰到这个罕见条件，一男一女家庭只有那个男孩有机会。两男家庭的入选机会接近后者的两倍；原先两男有一份、男女和女男各一份，加上这个差别后，两男与两类一男一女加起来的总量就接近相同，所以概率接近50%。</p></section></div><p class="count-equation">${m ? `当前勾选${m}天，本题的家庭条件留下${14 * m - m * m}种两男、${14 * m}种一男一女：${14 * m - m * m}÷${28 * m - m * m}${probability(14 * m - m * m, 28 * m - m * m).sign}${probability(14 * m - m * m, 28 * m - m * m).text}。` : '请至少勾选一天，才能计算当前结果。'}</p>`;
    for (const k of ['family', 'random']) $(k).setAttribute('aria-pressed', String(method === k));
    document.documentElement.dataset.method = method;
  }
  L.bind(render);
  for (const k of ['family', 'random']) $(k).onclick = () => { method = k; chooseEligible(); L.refresh(); };
  document.querySelectorAll('[data-day]').forEach(n => n.onchange = () => { chooseEligible(); L.refresh(); });
  for (const [id, all] of [['only-tuesday', false], ['all-days', true]]) $(id).onclick = () => {
    document.querySelectorAll('[data-day]').forEach(n => { n.checked = all || n.dataset.day === '1'; });
    chooseEligible(); L.refresh();
  };
  $('families').onclick = e => { const b = e.target.closest('[data-family]'); if (b) { selected = Number(b.dataset.family); selectedChild = Number(b.dataset.child); L.refresh(); } };
  $('families').onkeydown = e => {
    const b = e.target.closest('[data-family]'), delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -14, ArrowDown: 14 }[e.key];
    if (!b || !delta) return;
    e.preventDefault(); selected = Math.max(0, Math.min(195, Number(b.dataset.family) + delta)); selectedChild = Number(b.dataset.child); L.refresh();
    document.querySelector(`[data-family="${selected}"][data-child="${selectedChild}"]`).focus({ preventScroll: true });
  };
})();
