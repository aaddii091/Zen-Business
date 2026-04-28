import type { APIRoute } from 'astro';
import { computeComplianceResult } from '../../../lib/compliance/scoring';
import { buildReportPdf } from '../../../lib/compliance/server';
import type { ComplianceAnswer } from '../../../lib/compliance/types';

const VALID_ANSWERS = new Set<ComplianceAnswer>(['yes', 'partially', 'no']);

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const contactName = String(body.contactName ?? 'Dev User').trim() || 'Dev User';
    const schoolName = String(body.schoolName ?? 'Demo School').trim() || 'Demo School';
    const isCBSE = Boolean(body.isCBSE);
    const rawAnswers = (body.answers ?? {}) as Record<string, unknown>;

    const answers: Record<string, ComplianceAnswer> = {};
    for (const [key, value] of Object.entries(rawAnswers)) {
      if (VALID_ANSWERS.has(value as ComplianceAnswer)) {
        answers[key] = value as ComplianceAnswer;
      }
    }

    const result = computeComplianceResult(isCBSE, answers);
    const pdfBytes = buildReportPdf(
      {
        contactName,
        schoolName,
        isCBSE,
      },
      result,
      new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
    );

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename=\"${schoolName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-dev-report.pdf\"`,
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Unable to generate dev PDF report.',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};

