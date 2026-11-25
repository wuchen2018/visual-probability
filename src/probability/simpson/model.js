(function (root) {
  'use strict';
  const TOTAL = 350;
  const BOOK = Object.freeze({
    A: Object.freeze({ smallN: 87, smallSuccess: 81, largeN: 263, largeSuccess: 192 }),
    B: Object.freeze({ smallN: 270, smallSuccess: 234, largeN: 80, largeSuccess: 55 })
  });
  function cohort(scheme, smallN) {
    if (!Object.hasOwn(BOOK, scheme)) throw new RangeError('未知方案');
    if (!Number.isInteger(smallN) || smallN < 0 || smallN > TOTAL) throw new RangeError('小结石人数必须是0到350之间的整数');
    const source = BOOK[scheme];
    const largeN = TOTAL - smallN;
    const smallRate = source.smallSuccess / source.smallN;
    const largeRate = source.largeSuccess / source.largeN;
    const smallSuccess = smallN * smallRate;
    const largeSuccess = largeN * largeRate;
    const success = smallSuccess + largeSuccess;
    return { scheme, total: TOTAL, smallN, largeN, smallRate, largeRate,
      smallSuccess, largeSuccess, success, unsuccessful: TOTAL - success,
      smallWeight: smallN / TOTAL, largeWeight: largeN / TOTAL,
      smallContribution: smallSuccess / TOTAL, largeContribution: largeSuccess / TOTAL,
      rate: success / TOTAL };
  }
  function scenario(smallA, smallB) {
    const A = cohort('A', smallA), B = cohort('B', smallB);
    const difference = A.rate - B.rate;
    return { A, B, difference, winner: Math.abs(difference) < 1e-12 ? 'equal' : difference > 0 ? 'A' : 'B',
      reversed: difference < -1e-12, sameMix: smallA === smallB };
  }
  const api = Object.freeze({ TOTAL, BOOK, cohort, scenario });
  root.SimpsonModel = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
