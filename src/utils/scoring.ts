import type {
  CorrespondenceItem,
  ScoringSettings,
  UnitReport,
  Unit,
  RankThreshold,
} from '@/types';
import { daysBetween } from './jalali';

export function calculateItemScore(
  item: CorrespondenceItem,
  settings: ScoringSettings,
): { qualityScore: number; timeScore: number; finalScore: number } {
  // Quality score: average of three quality metrics (each 1-3, scaled to 0-100)
  let qualityScore = 0;
  if (
    item.qualityCompleteness !== null &&
    item.qualityAccuracy !== null &&
    item.qualityDocumentation !== null
  ) {
    const avgQuality =
      (item.qualityCompleteness + item.qualityAccuracy + item.qualityDocumentation) / 3;
    qualityScore = (avgQuality / 3) * 100;
  }

  // Time score: based on response date vs deadline
  let timeScore = 100;
  if (item.responseDate && item.status === 'completed') {
    const diffDays = daysBetween(item.deadline, item.responseDate);
    if (diffDays <= 0) {
      // Before or on deadline
      timeScore = diffDays === 0 ? 100 - settings.penaltyConfig.onTimePenalty : 100;
    } else if (diffDays <= 3) {
      timeScore = 100 - settings.penaltyConfig.late1to3Penalty;
    } else {
      timeScore = 100 - settings.penaltyConfig.lateOver3Penalty;
    }
    timeScore = Math.max(0, timeScore);
  } else if (item.status === 'overdue') {
    timeScore = 0;
  }

  const finalScore =
    (qualityScore * settings.qualityWeightPercent) / 100 +
    (timeScore * settings.timeWeightPercent) / 100;

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
  const finalScore =
    (avgQualityScore * settings.qualityWeightPercent) / 100 +
    (avgTimeScore * settings.timeWeightPercent) / 100;

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
