export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function contentUnlockDate(accessStart: Date, releaseAfterDays: number) {
  return addDays(accessStart, releaseAfterDays);
}

export function isContentUnlocked(
  accessStart: Date,
  releaseAfterDays: number,
  now: Date = new Date()
) {
  return contentUnlockDate(accessStart, releaseAfterDays).getTime() <= now.getTime();
}

/** Dias inteiros restantes até a liberação (0 quando já liberado). */
export function daysUntilUnlock(
  accessStart: Date,
  releaseAfterDays: number,
  now: Date = new Date()
) {
  const unlockAt = contentUnlockDate(accessStart, releaseAfterDays);
  const diffMs = unlockAt.getTime() - now.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
