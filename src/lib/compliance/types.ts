export type ComplianceAnswer = 'yes' | 'partially' | 'no';

export type ComplianceBand = 'green' | 'amber' | 'red';

export type ComplianceSectionId = 'people' | 'systems' | 'students' | 'records' | 'training';

export interface ComplianceQuestion {
  id: string;
  order: number;
  section: ComplianceSectionId;
  cbseOnly?: boolean;
  question: string;
  shortTitle: string;
  regulatoryRef: string;
  legalRisk: string;
  zengardenCovers: string;
}

export interface SectionScore {
  id: ComplianceSectionId;
  label: string;
  score: number;
  status: ComplianceBand;
  points: number;
  maxPoints: number;
}

export interface GapItem {
  questionId: string;
  answer: ComplianceAnswer;
  points: number;
  section: ComplianceSectionId;
  shortTitle: string;
  question: string;
  regulatoryRef: string;
  legalRisk: string;
  zengardenCovers: string;
  severityRank: number;
}

export interface ComplianceResult {
  isCBSE: boolean;
  totalPoints: number;
  totalMaxPoints: number;
  overallScore: number;
  band: ComplianceBand;
  sectionScores: SectionScore[];
  visibleGaps: GapItem[];
  hiddenGapCount: number;
  topGaps: GapItem[];
  allGaps: GapItem[];
}

export interface ComplianceSubmissionInput {
  contactName: string;
  schoolName: string;
  email: string;
  phone?: string;
  isCBSE: boolean;
  answers: Record<string, ComplianceAnswer>;
}
