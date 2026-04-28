import type { APIRoute } from 'astro';
import { computeComplianceResult } from '../../../lib/compliance/scoring';
import { COMPLIANCE_QUESTIONS, getVisibleQuestions } from '../../../lib/compliance/questions';
import { saveSubmission, sendSubmissionEmail } from '../../../lib/compliance/server';
import type { ComplianceAnswer } from '../../../lib/compliance/types';

const VALID_ANSWERS = new Set<ComplianceAnswer>(['yes', 'partially', 'no']);

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const contactName = String(body.contactName ?? '').trim();
    const schoolName = String(body.schoolName ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const phone = String(body.phone ?? '').trim();
    const isCBSE = Boolean(body.isCBSE);
    const answers = (body.answers ?? {}) as Record<string, ComplianceAnswer>;

    if (!contactName || !schoolName || !email) {
      return new Response(JSON.stringify({ error: 'Missing required fields.' }), { status: 400 });
    }

    if (!validateEmail(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address.' }), { status: 400 });
    }

    const visibleQuestionIds = new Set(getVisibleQuestions(isCBSE).map((q) => q.id));
    for (const q of COMPLIANCE_QUESTIONS) {
      if (!visibleQuestionIds.has(q.id)) continue;
      const answer = answers[q.id];
      if (!answer || !VALID_ANSWERS.has(answer)) {
        return new Response(JSON.stringify({ error: `Missing or invalid answer for ${q.id}.` }), { status: 400 });
      }
    }

    const sanitizedAnswers: Record<string, ComplianceAnswer> = {};
    for (const key of visibleQuestionIds) {
      sanitizedAnswers[key] = answers[key];
    }

    const result = computeComplianceResult(isCBSE, sanitizedAnswers);

    const stored = await saveSubmission(
      {
        contactName,
        schoolName,
        email,
        phone: phone || undefined,
        isCBSE,
        answers: sanitizedAnswers,
      },
      result,
    );

    void sendSubmissionEmail(
      {
        contactName,
        schoolName,
        email,
        phone: phone || undefined,
        isCBSE,
        answers: sanitizedAnswers,
      },
      result,
    ).catch(() => {
      // Intentionally fire-and-forget; result should not block UI.
    });

    return new Response(JSON.stringify({
      submissionId: stored.id,
      overallScore: result.overallScore,
      band: result.band,
      sectionScores: result.sectionScores,
      visibleGaps: result.visibleGaps,
      hiddenGapCount: result.hiddenGapCount,
      topGaps: result.topGaps,
      allGaps: result.allGaps,
      schoolName,
      isCBSE,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Unable to process submission.',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
