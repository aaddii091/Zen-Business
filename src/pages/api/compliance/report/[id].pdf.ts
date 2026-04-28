import type { APIRoute } from 'astro';
import { buildReportPdf, getSubmissionById, recomputeResultFromStored } from '../../../../lib/compliance/server';

export const GET: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) {
    return new Response('Missing submission id.', { status: 400 });
  }

  const row = await getSubmissionById(id);
  if (!row) {
    return new Response('Report not found.', { status: 404 });
  }

  const result = recomputeResultFromStored(row);

  const pdfBytes = buildReportPdf(
    {
      contactName: row.contact_name,
      schoolName: row.school_name,
      isCBSE: row.is_cbse,
    },
    result,
    new Date(row.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
  );

  return new Response(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${row.school_name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-compliance-report.pdf"`,
    },
  });
};
