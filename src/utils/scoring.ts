import type {
  CorrespondenceItem,
  ScoringSettings,
  UnitReport,
  Unit,
  RankThreshold,
} from '@/types';
import { daysBetween } from './jalali';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Time score per شیوه‌نامه:
 * - پاسخ قبل از موعد → امتیاز کامل
 * - پاسخ در روز موعد → منهای X (penaltyConfig.onTimePenalty)
 * - تأخیر ۱-۳ روز → منهای Y (penaltyConfig.late1to3Penalty)
 * - تأخیر بیش از ۳ روز → منهای Z (penaltyConfig.lateOver3Penalty)
 */
export function getTimeScore(item: CorrespondenceItem, settings: ScoringSettings): number {
  if (item.status === 'overdue') return 0;
  if (item.status !== 'completed' || !item.responseDate) return 0;
  const diff = daysBetween(item.deadline, item.responseDate);
  if (diff < 0) return 100;
  if (diff === 0) return clamp(100 - settings.penaltyConfig.onTimePenalty, 0, 100);
  if (diff <= 3) return clamp(100 - settings.penaltyConfig.late1to3Penalty, 0, 100);
  return clamp(100 - settings.penaltyConfig.lateOver3Penalty, 0, 100);
}

/** Weighted average of the three content-quality indicators (each 1-3 → 0-100) */
export function getQualityScore(item: CorrespondenceItem, settings: ScoringSettings): number {
  if (
    item.qualityCompleteness === null ||
    item.qualityAccuracy === null ||
    item.qualityDocumentation === null
  ) {
    return 0;
  }
  const raw =
    item.qualityCompleteness * settings.qualityIndicatorWeights.completeness +
    item.qualityAccuracy * settings.qualityIndicatorWeights.accuracy +
    item.qualityDocumentation * settings.qualityIndicatorWeights.documentation;
  const totalWeight =
    settings.qualityIndicatorWeights.completeness +
    settings.qualityIndicatorWeights.accuracy +
    settings.qualityIndicatorWeights.documentation;
  if (totalWeight <= 0) return 0;
  const avg = raw / totalWeight; // 1..3
  return clamp(((avg - 1) / 2) * 100, 0, 100);
}

/** امتیاز_کل = (میانگین_کیفیت × وزن_کیفیت%) + (امتیاز_زمان × وزن_زمان%) */
export function calculateItemScore(
  item: CorrespondenceItem,
  settings: ScoringSettings,
): { qualityScore: number; timeScore: number; finalScore: number } {
  const qualityScore = getQualityScore(item, settings);
  const timeScore = getTimeScore(item, settings);
  const totalWeight = settings.qualityWeightPercent + settings.timeWeightPercent;
  const qw = totalWeight > 0 ? (settings.qualityWeightPercent / totalWeight) * 100 : 50;
  const tw = totalWeight > 0 ? (settings.timeWeightPercent / totalWeight) * 100 : 50;
  const finalScore = (qualityScore * qw) / 100 + (timeScore * tw) / 100;
  return {
    qualityScore: Math.round(qualityScore),
    timeScore: Math.round(timeScore),
    finalScore: Math.round(finalScore),
  };
}

export function getRankForScore(
  score: number,
  rankThresholds: RankThreshold[],
): RankThreshold {
  const sorted = [...rankThresholds].sort((a, b) => b.minScore - a.minScore);
  return sorted.find((r) => score >= r.minScore) || sorted[sorted.length - 1];
}

/** Compute the seasonal report (کارنامه) of one unit inside a period. */
export function calculateUnitReport(
  unitId: string,
  unitName: string,
  periodId: string,
  items: CorrespondenceItem[],
  settings: ScoringSettings,
): UnitReport {
  const unitItems = items.filter(
    (i) => i.targetUnitId === unitId && i.periodId === periodId,
  );

  const completed = unitItems.filter((i) => i.status === 'completed');
  const overdue = unitItems.filter((i) => i.status === 'overdue');
  const pendingItems = unitItems.filter(
    (i) => i.status === 'pending' || i.status === 'in_progress' || i.status === 'near_deadline',
  );

  let completedOnTime = 0;
  let completedLate = 0;
  let totalQuality = 0;
  let totalTime = 0;
  let scoredCount = 0;

  for (const item of completed) {
    const score = calculateItemScore(item, settings);
    if (item.responseDate) {
      const diff = daysBetween(item.deadline, item.responseDate);
      if (diff <= 0) completedOnTime++;
      else completedLate++;
    }
    if (
      item.qualityCompleteness !== null &&
      item.qualityAccuracy !== null &&
      item.qualityDocumentation !== null
    ) {
      totalQuality += score.qualityScore;
      totalTime += score.timeScore;
      scoredCount++;
    }
  }

  const avgQualityScore = scoredCount > 0 ? totalQuality / scoredCount : 0;
  const avgTimeScore = scoredCount > 0 ? totalTime / scoredCount : 0;
  const totalWeight = settings.qualityWeightPercent + settings.timeWeightPercent;
  const qw = totalWeight > 0 ? (settings.qualityWeightPercent / totalWeight) * 100 : 50;
  const tw = totalWeight > 0 ? (settings.timeWeightPercent / totalWeight) * 100 : 50;
  const finalScore = (avgQualityScore * qw) / 100 + (avgTimeScore * tw) / 100;

  const rankThreshold = getRankForScore(finalScore, settings.rankThresholds);

  return {
    unitId,
    unitName,
    periodId,
    totalItems: unitItems.length,
    completedOnTime,
    completedLate,
    overdue: overdue.length,
    pendingItems: pendingItems.length,
    avgQualityScore: Math.round(avgQualityScore),
    avgTimeScore: Math.round(avgTimeScore),
    finalScore: Math.round(finalScore),
    rank: 0, // assigned after sorting
    rankLabel: rankThreshold.label,
    items: unitItems,
  };
}

export function calculateAllUnitReports(
  units: Unit[],
  periodId: string,
  items: CorrespondenceItem[],
  settings: ScoringSettings,
): UnitReport[] {
  const reports = units.map((unit) =>
    calculateUnitReport(unit.id, unit.name, periodId, items, settings),
  );
  reports.sort((a, b) => b.finalScore - a.finalScore);
  reports.forEach((r, idx) => {
    r.rank = idx + 1;
  });
  return reports;
}
