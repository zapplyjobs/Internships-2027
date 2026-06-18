const path = require("path");
const config = require(path.join(process.cwd(), 'config', 'config.js'));
const jobCategories = require(path.join(process.cwd(), 'config', 'job_categories.json'));
const { createReadmeGenerator } = require(path.join(__dirname, '../consumer/lib/readme-generator.js'));
module.exports = createReadmeGenerator(config, jobCategories, process.cwd());
