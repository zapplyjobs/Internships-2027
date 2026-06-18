module.exports = {
  version: 1,
  repoPrefix: 'int',
  headingImageAlt: 'Internships 2026 - Illustration of people collaborating on internships.',
  title: 'Internships 2026',
  tagline: '',
  descriptionLine1: '🚀 Internships across tech, business, healthcare, and more for students, updated in real time.',
  descriptionLine2: '',
  noteType: 'TIP',
  noteText: '🛠 Help us grow! Add new jobs by submitting an issue! View contributing steps [here](CONTRIBUTING-GUIDE.md).',
  jobsSectionHeader: 'Fresh Internships 2026',
  jobCountBadgeLabel: 'Total Internships',
  features: {
    internships: false,
    moreResources: true
  },
  defaultCategory: 'other_internships',

  // Data filter (single source of truth — imported by index.js and update-readme-only.js)
  filters: { locations: ['us'], employment: 'internship' },
  // Active window for current_jobs.json (days) — read by write-current-jobs.js
  activeWindowDays: 120
};
