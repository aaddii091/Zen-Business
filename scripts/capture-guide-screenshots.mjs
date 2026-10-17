/* Capture manual screenshots from the REAL Control Panel UI.
 *
 * Same approach as video/capture-dashboards.mjs: forge the localStorage session
 * the router guard reads and stub the API at the network layer, so the genuine
 * Vue components render with demo-school data. The screenshots are therefore the
 * real product — real layout, spacing and type — and never contain a real
 * student's data, which matters for a page published on the marketing site.
 *
 *   cd "Control Panel" && npx vite --port 5180 --strictPort
 *   cd UserSide      && npx vite --port 5181 --strictPort
 *   cd Homepage      && node scripts/capture-guide-screenshots.mjs
 *
 * Writes to Homepage/src/assets/guide/.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const CP = process.env.CP_URL || 'http://localhost:5180';
const US = process.env.US_URL || 'http://localhost:5181';
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

const TRANSFERS = [
  {
    id: 'tr1',
    status: 'pending',
    requestedAt: iso(1),
    reason: 'Moving to the science stream from this term.',
    student: { id: 'u5', name: 'Rohan Gupta' },
    studentName: 'Rohan Gupta',
    fromClassroom: { id: 'c1', name: 'Grade 9', label: 'Grade 9 - A', grade: '9', section: 'A' },
    toClassroom: { id: 'c2', name: 'Grade 9', label: 'Grade 9 - B', grade: '9', section: 'B' },
  },
];

// The counsellor's inbox. One self-flagged case (the student's own screening
// raised it, no teacher involved) and two filed by teachers.
const INBOX = [
  { id: 'i1', status: 'pending', urgency: 'high', urgencyRank: 3, source: 'self_assessment',
    createdAt: iso(0), student: { id: 'u2', name: 'Ananya Iyer' }, studentName: 'Ananya Iyer',
    classroomSnapshot: { name: 'Grade 9 - A', grade: '9', section: 'A' }, classroomLabel: '9-A',
    concernTags: ['anxiety_stress', 'mood_low'], teacher: null, assignedTherapist: null,
    selfAssessment: { instrument: 'mini_16pf', distressScore: 15, threshold: 12, takenAt: iso(0) },
    reason: 'Raised automatically: this student completed the Support Recommendation Test and scored 15 on the distress marker (threshold 12).' },
  { id: 'i2', status: 'pending', urgency: 'medium', urgencyRank: 2, source: 'teacher_manual',
    createdAt: iso(2), student: { id: 'u1', name: 'Aarav Sharma' }, studentName: 'Aarav Sharma',
    classroomSnapshot: { name: 'Grade 9 - A', grade: '9', section: 'A' }, classroomLabel: '9-A',
    concernTags: ['academic_decline', 'withdrawn_isolated'],
    teacher: { id: 't1', name: 'Rhea Kapoor' }, assignedTherapist: null,
    reason: 'Aarav has been very quiet in class for about three weeks and has stopped sitting with his usual group at lunch. His last two assignments were handed in incomplete, which is unlike him.' },
  { id: 'i3', status: 'in_progress', urgency: 'low', urgencyRank: 1, source: 'teacher_manual',
    createdAt: iso(9), student: { id: 'u3', name: 'Kabir Menon' }, studentName: 'Kabir Menon',
    classroomSnapshot: { name: 'Grade 9 - A', grade: '9', section: 'A' }, classroomLabel: '9-A',
    concernTags: ['withdrawn_isolated'], teacher: { id: 't1', name: 'Rhea Kapoor' },
    assignedTherapist: { id: 'th1', name: 'Dr. Meera Krishnan' },
    reason: 'Has stopped joining group work and hands in homework late.' },
];

const ASSIGNED_COUNSELLOR = {
  therapistUserId: 'th1',
  displayName: 'Dr. Meera Krishnan',
  title: 'Consultant Clinical Psychologist',
  profileType: 'professional_therapist',
  yearsOfExperience: 12,
  languages: ['English', 'Hindi', 'Malayalam'],
  specializations: ['Adolescent anxiety', 'Exam stress'],
  sessionModes: ['video', 'in_person'],
  availabilityStatus: 'available',
  bio: 'I work with secondary-school students on anxiety, exam pressure and the knot of things that sit underneath both.',
  calendlyUrl: 'https://calendly.com/zengarden/session',
  calendlyConnected: true,
};

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
  'classroom-transfers': {
    status: 'success', results: TRANSFERS.length,
    pagination: { page: 1, limit: 20, total: TRANSFERS.length, totalPages: 1 },
    data: TRANSFERS,
  },
  'referrals/inbox/counts': {
    status: 'success',
    data: { pending: 2, acknowledged: 0, in_progress: 1, closed: 4, open: 3, urgentOpen: 1, unclaimed: 2 },
  },
  'referrals/inbox': {
    status: 'success', results: INBOX.length,
    pagination: { page: 1, limit: 20, total: INBOX.length, totalPages: 1 },
    data: INBOX,
  },
  'users/assigned-therapist': { status: 'success', data: ASSIGNED_COUNSELLOR },
  'organizations/my-therapist-roster': {
    status: 'success',
    data: {
      organization: { id: 'o1', name: 'Greenwood Public School' },
      hasSelectedOrgTherapist: true,
      assignmentMode: 'school_assigned',
      selectedTherapistId: 'th1',
      roster: [ASSIGNED_COUNSELLOR],
    },
  },
  'classrooms/my-classroom': {
    status: 'success',
    data: { id: 'c1', name: 'Grade 9', grade: '9', section: 'A', label: 'Grade 9 - A', academicYear: '2026-27' },
  },
  'user-info': { status: 'success', data: { primaryConcern: 'stress', languagePref: 'English' } },
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

// 6 — the Transfer Requests tab a home teacher decides from
await page.getByText('Transfer Requests', { exact: false }).first().click();
await page.waitForTimeout(1800);
await shoot(page, '06-transfer-requests', { clipHeight: 820 });

await ctx.close();

/* ------------------------------------------- Control Panel, as a counsellor */

const cctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
await cctx.addInitScript(() => {
  localStorage.setItem('therapist_token', 'guide-capture');
  localStorage.setItem('therapist_role', 'therapist');
  localStorage.setItem('therapist_roles', JSON.stringify(['therapist']));
  localStorage.setItem('therapist_calendly_connected', 'true');
  localStorage.setItem('therapist_profile_complete', 'true');
  localStorage.setItem(
    'therapist_profile',
    JSON.stringify({
      displayName: 'Meera Krishnan',
      name: 'Meera Krishnan',
      title: 'Consultant Clinical Psychologist',
    }),
  );
});
await stub(cctx);
const cpage = await cctx.newPage();

await cpage.goto(`${CP}/referrals`);
await cpage.waitForTimeout(3000);
await shoot(cpage, '07-inbox', { clipHeight: 700 });

// Open the first case so the detail view is on screen.
await cpage.getByText('Aarav Sharma', { exact: false }).first().click().catch(() => {});
await cpage.waitForTimeout(1800);
await shoot(cpage, '08-inbox-detail', { clipHeight: 900 });

await cctx.close();

/* --------------------------------------------------- UserSide, as a student */

try {
  const sctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
  await sctx.addInitScript(() => {
    localStorage.setItem('token', 'guide-capture');
    localStorage.setItem('hasOnboarded', 'true');
    localStorage.setItem('userId', 'u1');
    localStorage.setItem('name', 'Aarav Sharma');
    localStorage.setItem('fullName', 'Aarav Sharma');
    localStorage.setItem('userName', 'Aarav Sharma');
    localStorage.setItem('email', 'aarav.sharma@demoschool.zengarden.in');
    localStorage.setItem('role', 'user');
  });
  await stub(sctx);
  const spage = await sctx.newPage();

  for (const [route, name, clipHeight] of [
    ['/welcome', '09-student-welcome', null],
    ['/home', '10-student-home', null],
    ['/my-therapist', '11-student-counsellor', 1000],
  ]) {
    await spage.goto(US + route).catch(() => {});
    await spage.waitForTimeout(3000);
    await shoot(spage, name, clipHeight ? { clipHeight } : {});
  }

  await sctx.close();
} catch (error) {
  console.log(`  ! UserSide skipped: ${error.message.split('\n')[0]}`);
}

await browser.close();
console.log(`\nwrote ${shots.length} screenshot(s) to src/assets/guide/\n`);
