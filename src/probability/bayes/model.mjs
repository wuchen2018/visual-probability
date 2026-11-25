export function bayesCounts(prior, sensitivity, falsePositive, population = 100000) {
  for (const value of [prior, sensitivity, falsePositive]) {
    if (!Number.isFinite(value) || value < 0 || value > 100) throw new RangeError('比例须在 0% 到 100% 之间');
  }
  if (!Number.isFinite(population) || population <= 0) throw new RangeError('人数须为正数');
  const sick = population * prior / 100;
  const healthy = population - sick;
  const truePositive = sick * sensitivity / 100;
  const falseNegative = sick - truePositive;
  const falsePositiveCount = healthy * falsePositive / 100;
  const trueNegative = healthy - falsePositiveCount;
  const positive = truePositive + falsePositiveCount;
  return { population, sick, healthy, truePositive, falseNegative,
    falsePositive: falsePositiveCount, trueNegative, positive,
    posterior: positive > 0 ? truePositive / positive : null };
}
