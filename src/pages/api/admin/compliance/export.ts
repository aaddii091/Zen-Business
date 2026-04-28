import type { APIRoute } from 'astro';
import { getAllSubmissions, rowToCsv } from '../../../../lib/compliance/server';

export const GET: APIRoute = async ({ request }) => {
  const adminKey = import.meta.env.COMPLIANCE_ADMIN_EXPORT_KEY;
  if (!adminKey) {
    return new Response('Export key not configured.', { status: 503 });
  }

  const url = new URL(request.url);
  const provided = request.headers.get('x-admin-key') || url.searchParams.get('key');

  if (!provided || provided !== adminKey) {
    return new Response('Unauthorized.', { status: 401 });
  }

  const rows = await getAllSubmissions();
  const csv = rowToCsv(rows);

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="compliance-submissions-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
};
