#!/usr/bin/env node

/**
 * Write current_jobs.json for Discord poster consumption
 *
 * Reads new_jobs.json written by job-fetcher/index.js and outputs
 * current_jobs.json for jobs-data-2026 discord-poster to consume.
 *
 * Active window: 120 days (internships post 6-12 months ahead, SUP-TTL-1)
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(process.cwd(), '.github', 'data');
const newJobsPath = path.join(dataDir, 'new_jobs.json');
const outputPath = path.join(dataDir, 'current_jobs.json');

const config = require('./job-fetcher/config');
const ACTIVE_WINDOW_DAYS = config.activeWindowDays || 120;
const ACTIVE_WINDOW_MS = ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000;

function isJobActive(job) {
  const postedDate = new Date(
    job.job_posted_at_datetime_utc || job.job_posted_at || job.postedAt || null
  );
  if (isNaN(postedDate.getTime())) return true; // Keep if date unparseable
  return (Date.now() - postedDate.getTime()) < ACTIVE_WINDOW_MS;
}

try {
  if (!fs.existsSync(newJobsPath)) {
    console.log('⚠️  No new_jobs.json found — writing empty current_jobs.json');
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(outputPath, '[]', 'utf8');
    process.exit(0);
  }

  const jobs = JSON.parse(fs.readFileSync(newJobsPath, 'utf8'));
  console.log(`📥 Read ${jobs.length} jobs from new_jobs.json`);

  const activeJobs = jobs.filter(isJobActive);
  console.log(`📅 After 120-day internship filter: ${activeJobs.length} active jobs`);

  fs.writeFileSync(outputPath, JSON.stringify(activeJobs, null, 2), 'utf8');
  console.log(`✅ Wrote ${activeJobs.length} jobs to current_jobs.json`);

  if (activeJobs.length > 0) {
    console.log(`   Sample: ${activeJobs[0].job_title} @ ${activeJobs[0].employer_name}`);
  }

} catch (error) {
  console.error('❌ Error writing current_jobs.json:', error.message);
  console.error('   Stack trace:', error.stack);
  process.exit(1);
}
