(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ScatterBerkson = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const INITIAL_SEED = 20261121;
  const INITIAL_THRESHOLD = 120;
  const PROBES = Object.freeze([
    { id: 701, x: 40, y: 80 }, { id: 702, x: 80, y: 40 },
    { id: 703, x: 40, y: 40 }, { id: 704, x: 80, y: 80 }
  ]);
  function randomGenerator(seed) {
    let a = seed >>> 0;
    return function () {
      a += 0x6D2B79F5;
      let t = a;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function generate(seed = INITIAL_SEED) {
    const random = randomGenerator(seed);
    function score() {
      for (;;) {
        const u = Math.max(random(), Number.EPSILON), v = random();
        const value = 50 + 19 * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        if (value >= 0 && value <= 100) return Math.round(value * 10) / 10;
      }
    }
    return Array.from({ length: 700 }, (_, i) => ({ id: i + 1, x: score(), y: score() })).concat(PROBES.map(p => ({ ...p })));
  }
  function statistics(points) {
    const n = points.length;
    if (n < 3) return { n, r: null, slope: null, intercept: null };
    const mx = points.reduce((sum, p) => sum + p.x, 0) / n;
    const my = points.reduce((sum, p) => sum + p.y, 0) / n;
    let xx = 0, yy = 0, xy = 0;
    for (const p of points) { const dx = p.x - mx, dy = p.y - my; xx += dx * dx; yy += dy * dy; xy += dx * dy; }
    if (xx < 1e-10 || yy < 1e-10) return { n, r: null, slope: null, intercept: null };
    const r = Math.max(-1, Math.min(1, xy / Math.sqrt(xx * yy)));
    const slope = xy / xx;
    return { n, r, slope, intercept: my - slope * mx };
  }
  function validateThreshold(value) {
    if (!Number.isInteger(value) || value < 0 || value > 200) throw new RangeError('门槛须为0到200之间的整数');
  }
  const totalScore = p => Math.round((p.x + p.y) * 10) / 10;
  function analyze(points, threshold) {
    validateThreshold(threshold);
    const selected = points.filter(p => totalScore(p) >= threshold);
    return { threshold, points, selected, selectedIds: new Set(selected.map(p => p.id)), all: statistics(points), visible: statistics(selected), excluded: points.length - selected.length };
  }
  function boundary(threshold) {
    validateThreshold(threshold);
    return threshold <= 100 ? [{ x: 0, y: threshold }, { x: threshold, y: 0 }] : [{ x: threshold - 100, y: 100 }, { x: 100, y: threshold - 100 }];
  }
  function area(threshold) {
    validateThreshold(threshold);
    return threshold <= 100
      ? [{ x: 0, y: threshold }, { x: 0, y: 100 }, { x: 100, y: 100 }, { x: 100, y: 0 }, { x: threshold, y: 0 }]
      : [{ x: threshold - 100, y: 100 }, { x: 100, y: 100 }, { x: 100, y: threshold - 100 }];
  }
  return { INITIAL_SEED, INITIAL_THRESHOLD, PROBES, generate, statistics, analyze, boundary, area, totalScore };
});
