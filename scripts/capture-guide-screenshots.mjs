/* Capture manual screenshots from the REAL Control Panel UI.
 *
 * Same approach as video/capture-dashboards.mjs: forge the localStorage session
 * the router guard reads and stub the API at the network layer, so the genuine
 * Vue components render with demo-school data. The screenshots are therefore the
 * real product — real layout, spacing and type — and never contain a real
 * student's data, which matters for a page published on the marketing site.
 *
 *   cd "Control Panel" && npx vite --port 5180 --strictPort
 *   cd Homepage && node scripts/capture-guide-screenshots.mjs
 *
 * Writes to Homepage/src/assets/guide/.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const CP = process.env.CP_URL || 'http://localhost:5180';
// src/assets, not public/: going through astro:assets means the <Image> component
// derives width/height from the file itself, so a re-capture at a different clip
// height can never leave stale dimensions hardcoded in the page.
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'assets', 'guide');
mkdirSync(OUT, { recursive: true });

const iso = (daysAgo = 0) => {
  const d = new Date('2026-10-14T09:15:00.000Z');
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

/* ---------------- demo-school fixtures (no real student data) ------------- */

const CLASSROOMS = [
  { id: 'c1', name: 'Grade 9', grade: '9', section: 'A', academicYear: '2026-27',
    label: 'Grade 9 - A', studentCount: 32, openReferralCount: 1,
    pendingTransferRequests: 0, isHomeTeacher: true, canApproveTransfers: true },
  { id: 'c2', name: 'Grade 9', grade: '9', section: 'B', academicYear: '2026-27',
    label: 'Grade 9 - B', studentCount: 30, openReferralCount: 0,
    pendingTransferRequests: 1, isHomeTeacher: false, canApproveTransfers: false },
  { id: 'c3', name: 'Grade 10', grade: '10', section: 'A', academicYear: '2026-27',
    label: 'Grade 10 - A', studentCount: 28, openReferralCount: 0,
    pendingTransferRequests: 0, isHomeTeacher: false, canApproveTransfers: false },
];

const STUDENTS = [
  { id: 'u1', name: 'Aarav Sharma',  classroomLabel: 'Grade 9 - A', openReferral: null },
  { id: 'u2', name: 'Ananya Iyer',   classroomLabel: 'Grade 9 - A', openReferral: null },
  { id: 'u3', name: 'Kabir Menon',   classroomLabel: 'Grade 9 - A',
    openReferral: { id: 'r2', status: 'in_progress', isMine: true } },
  { id: 'u4', name: 'Meera Joshi',   classroomLabel: 'Grade 9 - A', openReferral: null },
  { id: 'u5', name: 'Rohan Gupta',   classroomLabel: 'Grade 9 - A', openReferral: null },
  { id: 'u6', name: 'Saanvi Reddy',  classroomLabel: 'Grade 9 - A', openReferral: null },
];

const MY_REFERRALS = [
  { id: 'r2', status: 'in_progress', urgency: 'medium', createdAt: iso(6),
    student: { id: 'u3', name: 'Kabir Menon' }, studentName: 'Kabir Menon',
    classroomSnapshot: { name: 'Grade 9 - A', grade: '9', section: 'A' },
    classroomLabel: '9-A', className: '9-A',
    concernTags: ['withdrawn_isolated', 'academic_decline'],
    reason: 'Has stopped joining group work and hands in homework late. Started around the second week of term.',
    closureSummaryForTeacher: '', additionalNotes: [] },
  { id: 'r5', status: 'closed', urgency: 'low', createdAt: iso(26), closedAt: iso(12),
    student: { id: 'u6', name: 'Saanvi Reddy' }, studentName: 'Saanvi Reddy',
    classroomSnapshot: { name: 'Grade 9 - A', grade: '9', section: 'A' },
    classroomLabel: '9-A', className: '9-A',
    concernTags: ['attendance'], closureOutcome: 'support_started',
    reason: 'Repeated lateness in first period over three weeks.',
    closureSummaryForTeacher: 'Thanks for flagging this. We have met the family and support is now in place.',
    additionalNotes: [] },
];

const API = {
  'classrooms/mine': {
    status: 'success', results: CLASSROOMS.length, data: CLASSROOMS,
    needsClassroomAssignment: false, canApproveTransfersAnywhere: true, isHomeTeacherAnywhere: true,
  },
  'classrooms/c1/students': {
    status: 'success', results: STUDENTS.length,
    classroom: { id: 'c1', name: 'Grade 9', label: 'Grade 9 - A', isHomeTeacher: true },
    pagination: { page: 1, limit: 50, total: STUDENTS.length, totalPages: 1 },
    data: STUDENTS,
  },
  'referrals/mine': {
    status: 'success', results: MY_REFERRALS.length,
    pagination: { page: 1, limit: 20, total: MY_REFERRALS.length, totalPages: 1 },
    data: MY_REFERRALS,
  },
  'classroom-transfers': { status: 'success', results: 0, data: [] },
  'users/me': {
    status: 'success',
    data: { id: 't1', name: 'Rhea Kapoor', email: 'rhea.kapoor@demoschool.zengarden.in',
      role: 'teacher', roles: ['teacher'] },
  },
};

async function stub(ctx) {
  await ctx.route('**/api/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname
      .replace(/^\/api\/v1\/?/, '')
      .replace(/\/$/, '');

    // Longest-prefix wins, so 'classrooms/c1/students' is not swallowed by
    // 'classrooms/mine'.
    const hit = Object.keys(API)
      .sort((a, b) => b.length - a.length)
      .find((key) => path === key || path.startsWith(key));

    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(hit ? API[hit] : { status: 'success', data: [] }),
    });
  });
}

/* ------------------------------------------------------------------ capture */

const shots = [];

// Several of these screens are short, and a full-viewport grab leaves a third of
// the image as empty background — which reads as a rendering bug in a manual.
// `clipHeight` trims to the content instead.
const shoot = async (page, name, { clipHeight } = {}) => {
  const path = `${OUT}/${name}.png`;
  await page.screenshot({
    path,
    ...(clipHeight
      ? { clip: { x: 0, y: 0, width: VIEWPORT.width, height: clipHeight } }
      : {}),
  });
  shots.push(name);
  console.log(`  ✓ ${name}`);
};

const VIEWPORT = { width: 1600, height: 1000 };

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: VIEWPORT,
  deviceScaleFactor: 2, // retina, so the manual stays sharp when scaled down
});

await ctx.addInitScript(() => {
  localStorage.setItem('therapist_token', 'guide-capture');
  localStorage.setItem('therapist_role', 'teacher');
  localStorage.setItem('therapist_roles', JSON.stringify(['teacher']));
  localStorage.setItem('therapist_profile_complete', 'true');
  localStorage.setItem(
    'therapist_profile',
    JSON.stringify({ displayName: 'Rhea Kapoor', name: 'Rhea Kapoor', title: 'Class Teacher' }),
  );
});
await stub(ctx);

const page = await ctx.newPage();

console.log(`\ncapturing from ${CP}\n`);

// 1 — the classroom grid a teacher lands on
await page.goto(`${CP}/classrooms`);
await page.waitForTimeout(2500);
await shoot(page, '01-classrooms', { clipHeight: 620 });

// 2 — the roster for one classroom
await page.getByText('Grade 9 - A', { exact: false }).first().click();
await page.waitForTimeout(1800);
await shoot(page, '02-roster', { clipHeight: 900 });

// 3 — the referral form, empty
await page.getByRole('button', { name: 'Refer', exact: true }).first().click();
await page.waitForTimeout(1200);
await shoot(page, '03-refer-modal-empty');

// 4 — the referral form, filled in
const textarea = page.locator('textarea').first();
await textarea.fill(
  'Aarav has been very quiet in class for about three weeks and has stopped sitting with his usual group at lunch. His last two assignments were handed in incomplete, which is unlike him.',
);
for (const tag of ['Withdrawn', 'Academic']) {
  const chip = page.getByText(tag, { exact: false }).last();
  if (await chip.isVisible().catch(() => false)) await chip.click().catch(() => {});
}
await page.waitForTimeout(600);
await shoot(page, '04-refer-modal-filled');

// 5 — My Referrals, where the teacher tracks what happened next.
// The modal has no Escape handler; Cancel is the documented way out.
await page.getByRole('button', { name: 'Cancel', exact: true }).first().click();
await page.waitForTimeout(800);
await page.getByText('My Referrals', { exact: false }).first().click();
await page.waitForTimeout(1800);
await shoot(page, '05-my-referrals', { clipHeight: 900 });

await browser.close();
console.log(`\nwrote ${shots.length} screenshot(s) to src/assets/guide/\n`);
