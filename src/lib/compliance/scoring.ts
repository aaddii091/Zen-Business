import { COMPLIANCE_QUESTIONS, SECTION_LABELS, getVisibleQuestions } from './questions';
import type {
  ComplianceAnswer,
  ComplianceBand,
  ComplianceResult,
  ComplianceSectionId,
  GapItem,
  SectionScore,
} from './types';

export const ANSWER_POINTS: Record<ComplianceAnswer, number> = {
  yes: 2,
  partially: 1,
  no: 0,
};

function getBand(score: number): ComplianceBand {
  if (score >= 85) return 'green';
  if (score >= 60) return 'amber';
  return 'red';
}

function getSectionStatus(score: number): ComplianceBand {
  if (score >= 75) return 'green';
  if (score >= 50) return 'amber';
  return 'red';
}

function getRegulatoryRank(ref: string): number {
  const upper = ref.toUpperCase();
  if (upper.includes('SC')) return 0;
  if (upper.includes('CBSE')) return 1;
  return 2;
}

export function computeComplianceResult(
  isCBSE: boolean,
  answers: Record<string, ComplianceAnswer>,
): ComplianceResult {
  const visibleQuestions = getVisibleQuestions(isCBSE);

  const sectionTotals = new Map<ComplianceSectionId, { points: number; maxPoints: number }>();

  const allGaps: GapItem[] = [];
  let totalPoints = 0;

  for (const q of visibleQuestions) {
    const answer = answers[q.id] ?? 'no';
    const points = ANSWER_POINTS[answer];

    totalPoints += points;

    const prev = sectionTotals.get(q.section) ?? { points: 0, maxPoints: 0 };
    sectionTotals.set(q.section, {
      points: prev.points + points,
      maxPoints: prev.maxPoints + 2,
    });

    if (answer !== 'yes') {
      allGaps.push({
        questionId: q.id,
        answer,
        points,
        section: q.section,
        shortTitle: q.shortTitle,
        question: q.question,
        regulatoryRef: q.regulatoryRef,
        legalRisk: q.legalRisk,
        zengardenCovers: q.zengardenCovers,
        severityRank: answer === 'no' ? 0 : 1,
      });
    }
  }

  const totalMaxPoints = visibleQuestions.length * 2;
  const overallScore = Math.round((totalPoints / totalMaxPoints) * 100);
  const band = getBand(overallScore);

  const sectionOrder: ComplianceSectionId[] = ['people', 'systems', 'students', 'records', 'training'];
  const sectionScores: SectionScore[] = sectionOrder.map((id) => {
    const totals = sectionTotals.get(id) ?? { points: 0, maxPoints: 0 };
    const score = totals.maxPoints > 0 ? Math.round((totals.points / totals.maxPoints) * 100) : 0;
    return {
      id,
      label: SECTION_LABELS[id],
      score,
      status: getSectionStatus(score),
      points: totals.points,
      maxPoints: totals.maxPoints,
    };
  });

  const questionOrderMap = new Map(COMPLIANCE_QUESTIONS.map((q) => [q.id, q.order]));

  allGaps.sort((a, b) => {
    if (a.severityRank !== b.severityRank) return a.severityRank - b.severityRank;
    const regCmp = getRegulatoryRank(a.regulatoryRef) - getRegulatoryRank(b.regulatoryRef);
    if (regCmp !== 0) return regCmp;
    return (questionOrderMap.get(a.questionId) ?? 999) - (questionOrderMap.get(b.questionId) ?? 999);
  });

  const visibleGaps = allGaps.slice(0, 5);
  const hiddenGapCount = Math.max(0, allGaps.length - visibleGaps.length);
  const topGaps = allGaps.slice(0, 3);

  return {
    isCBSE,
    totalPoints,
    totalMaxPoints,
    overallScore,
    band,
    sectionScores,
    visibleGaps,
    hiddenGapCount,
    topGaps,
    allGaps,
  };
}
