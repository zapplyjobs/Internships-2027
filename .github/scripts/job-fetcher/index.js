#!/usr/bin/env node

/**
 * Main entry point for the job fetcher system - Internships-2026
 *
 * Fetches internship jobs from centralized aggregator and generates README.
 * Replaced JSearch direct fetch with aggregator consumer (2026-02-18).
 *
 * Pipeline:
 * 1. Fetch internship jobs from aggregator (jobs-data-2026/all_jobs.json)
 * 2. Process and filter jobs
 * 3. Generate updated README
 * 4. Save new_jobs.json for write-current-jobs.js
 */

const fs = require('fs');
const path = require('path');
const { createAggregatorConsumer } = require('../consumer/lib/aggregator-consumer');
const { updateReadme } = require('./readme-generator');
const config = require('./config');

const dataDir = path.join(process.cwd(), '.github', 'data');

async function main() {
  try {
    console.log('🚀 Starting Internships job fetching system...');
    console.log('═'.repeat(50));

    // Fetch internship jobs from aggregator
    const consumer = createAggregatorConsumer({
      filters: config.filters,
      verbose: true
    });

    const { jobs, diagnostics } = await consumer.fetchJobsWithDiagnostics();

    if (jobs.length === 0) {
      console.log('⚠️  No internship jobs fetched from aggregator');
      console.log('   Check that all_jobs.json exists in jobs-data-2026');
    }

    console.log(`\n✅ Fetched ${jobs.length} internship jobs from aggregator`);

    // Normalize field name: aggregator uses job_posted_at_datetime_utc,
    // readme-generator expects job_posted_at
    const currentJobs = jobs.map(job => ({
      ...job,
      job_posted_at: job.job_posted_at_datetime_utc || job.job_posted_at || null
    }));

    // Build stats for README
    const stats = {
      totalByCompany: {}
    };
    currentJobs.forEach(job => {
      stats.totalByCompany[job.employer_name] =
        (stats.totalByCompany[job.employer_name] || 0) + 1;
    });

    // Save new_jobs.json (consumed by write-current-jobs.js)
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(
      path.join(dataDir, 'new_jobs.json'),
      JSON.stringify(currentJobs, null, 2),
      'utf8'
    );
    console.log(`💾 Saved ${currentJobs.length} jobs to new_jobs.json`);

    // Write run metrics (OB-3)
    const runMetrics = {
      timestamp: new Date().toISOString(),
      all_jobs_version: process.env.ALL_JOBS_SHA || null,
      ...diagnostics
    };
    fs.writeFileSync(
      path.join(dataDir, 'run_metrics.json'),
      JSON.stringify(runMetrics, null, 2),
      'utf8'
    );
    console.log(`📈 Metrics: total_fetched=${diagnostics.total_fetched} → 14day=${diagnostics.after_14day_filter} → tags=${diagnostics.after_tag_filter} → final=${diagnostics.final_count}`);

    // Update README
    await updateReadme(currentJobs, [], null, stats);

    // Print summary
    console.log('\n🎉 Job fetching completed successfully!');
    console.log('═'.repeat(50));
    console.log(`📊 Final Stats:`);
    console.log(`   • Current jobs: ${currentJobs.length}`);
    console.log(`   • Companies: ${Object.keys(stats.totalByCompany).length}`);

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
