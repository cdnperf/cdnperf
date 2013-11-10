var CronJob = require('cron').CronJob;


module.exports = job;

function job(pattern, fn) {
    if(pattern) new CronJob(pattern, fn, null, true);
}
