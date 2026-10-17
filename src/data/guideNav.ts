// The manual's table of contents.
//
// Single source of truth for both the sidebar in GuideLayout and the card index
// on /resources, so a topic can never appear in one and not the other.
//
// An item with no `href` renders as a greyed "Soon" row. That is deliberate: a
// visible roadmap tells a school what is coming, and an empty sidebar on a
// one-topic manual looks broken rather than new.

export interface GuideItem {
  slug: string;
  label: string;
  /** Omit while the topic is still unwritten. */
  href?: string;
  /** Shown on the /resources cards. */
  summary?: string;
}

export interface GuideSection {
  title: string;
  /** Shown on the /resources index above the section's cards. */
  blurb?: string;
  items: GuideItem[];
}

export const GUIDE_NAV: GuideSection[] = [
  {
    title: 'For teachers',
    blurb:
      'Everything a class teacher does in Zengarden — raising a concern, following it up, and moving a student between classes.',
    items: [
      {
        slug: 'refer-a-student',
        label: 'Refer a student to the counselling team',
        href: '/resources/guide/refer-a-student',
        summary:
          'How to raise a concern about a student, what the counselling team sees, and how to follow up once it is with them.',
      },
      { slug: 'track-your-referrals', label: 'Track a referral you have filed' },
      { slug: 'transfer-a-student', label: 'Move a student to another class' },
    ],
  },
  {
    title: 'For counsellors',
    blurb:
      'Working your caseload: the referral inbox, session notes, and escalating a case to the school.',
    items: [
      { slug: 'referral-inbox', label: 'Work the referral inbox' },
      { slug: 'counsellor-notes', label: 'Take and share session notes' },
      { slug: 'working-hours', label: 'Set your working hours' },
      { slug: 'escalate-to-school', label: 'Escalate a case to the school' },
    ],
  },
  {
    title: 'For school admins',
    blurb: 'Setting the school up and handling what counsellors send your way.',
    items: [
      { slug: 'set-up-classrooms', label: 'Set up classrooms and counsellors' },
      { slug: 'invite-staff', label: 'Invite teachers and admins' },
      { slug: 'handle-escalations', label: 'Handle an escalation' },
    ],
  },
  {
    title: 'For students',
    blurb: 'What a student sees, and what stays private to them.',
    items: [
      { slug: 'student-getting-started', label: 'Getting started' },
      { slug: 'student-booking', label: 'Book a session with your counsellor' },
      { slug: 'student-privacy', label: 'What your school can and cannot see' },
    ],
  },
];

export const ALL_GUIDES = GUIDE_NAV.flatMap((section) => section.items);
export const PUBLISHED_GUIDES = ALL_GUIDES.filter((item) => Boolean(item.href));
