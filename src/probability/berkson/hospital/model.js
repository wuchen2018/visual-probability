(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BerksonModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const TOTAL = 100000;
  const INITIAL = Object.freeze({ fracture: 5, pneumonia: 3, other: 0 });
  const fraction = (part, total) => total > 0 ? part / total : null;
  function scenario(fracture, pneumonia, other) {
    for (const value of [fracture, pneumonia, other]) {
      if (!Number.isInteger(value) || value < 0 || value > 100) {
        throw new RangeError('比例须为0到100之间的整数');
      }
    }
    const population = {
      both: 10 * fracture * pneumonia,
      fractureOnly: 10 * fracture * (100 - pneumonia),
      pneumoniaOnly: 10 * (100 - fracture) * pneumonia,
      neither: 10 * (100 - fracture) * (100 - pneumonia)
    };
    const hospital = { ...population, neither: population.neither * other / 100 };
    for (const group of [population, hospital]) {
      group.fractureTotal = group.both + group.fractureOnly;
      group.noFractureTotal = group.pneumoniaOnly + group.neither;
      group.total = group.fractureTotal + group.noFractureTotal;
      group.withFracture = fraction(group.both, group.fractureTotal);
      group.withoutFracture = fraction(group.pneumoniaOnly, group.noFractureTotal);
    }
    const comparable = hospital.withFracture !== null && hospital.withoutFracture !== null;
    const difference = comparable ? hospital.withoutFracture - hospital.withFracture : null;
    return {
      fracture, pneumonia, other, population, hospital,
      excluded: population.neither - hospital.neither,
      comparable, difference,
      status: !comparable ? 'unavailable' : Math.abs(difference) < 1e-12 ? 'equal' : 'negative'
    };
  }
  return { TOTAL, INITIAL, scenario };
});
