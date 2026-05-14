#!/usr/bin/env node

/**
 * Update README from existing job data (without fetching new jobs)
 *
 * Data sources (in order):
 *   1. Local .github/data/current_jobs.json (from a previous run)
 *   2. R2 via createAggregatorConsumer (when local data is missing)
 *
 * Repo filter config: { locations: ['us'], employment: 'entry_level' }
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('../consumer');
const { updateReadme } = require('./readme-generator');
const { companies, ALL_COMPANIES } = require('./utils');
const { createAggregatorConsumer } = require('../consumer/lib/aggregator-consumer');

// Repo-specific filter config (must match index.js)
const REPO_FILTERS = { locations: ['us'], employment: 'entry_level' };

async function main() {
    try {
        logger.start('README regeneration', { mode: 'existing data or R2' });

        const currentJobsPath = path.join(__dirname, '../../data/current_jobs.json');
        let allJobs;

        if (fs.existsSync(currentJobsPath)) {
            logger.info('Reading existing job data from local file');
            allJobs = JSON.parse(fs.readFileSync(currentJobsPath, 'utf8'));
        } else {
            logger.info('No local data found — fetching from R2');
            const consumer = createAggregatorConsumer({
                filters: REPO_FILTERS,
                verbose: true
            });
            const result = await consumer.fetchJobsWithDiagnostics();
            allJobs = result.jobs;
            logger.info('R2 fetch complete', { count: allJobs.length });
        }

        logger.info('Jobs loaded', { count: allJobs.length });

        const stats = {
            totalByCompany: {},
            byLevel: {},
            byLocation: {},
            byCategory: {}
        };

        allJobs.forEach(job => {
            const company = job.employer_name;
            stats.totalByCompany[company] = (stats.totalByCompany[company] || 0) + 1;
        });

        logger.info('Generating README.md');
        await updateReadme(allJobs, [], null, stats);

        logger.complete('README regenerated successfully', {
            jobs_processed: allJobs.length,
            companies: Object.keys(stats.totalByCompany).length
        });

    } catch (error) {
        logger.fatal('Error updating README', {
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
}

main();
