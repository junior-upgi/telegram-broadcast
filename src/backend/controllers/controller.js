import cron from 'node-cron';

import processUpdates from './processUpdates/processUpdates.js';
import broadcast from './broadcast.js';

const PER_MINUTE = '0 */1 * * * *';
const FIVE_SECONDS = '*/5 * * * * *';
const TEN_SECONDS = '*/10 * * * * *';
const PER_SECOND = '* * * * * *';

const schedule = {
    updateFreq: process.env.ENV === 'production' ? PER_MINUTE : FIVE_SECONDS, // how often to check for updates
    broadcastFreq: process.env.ENV === 'production' ? TEN_SECONDS : PER_SECOND // how often to broadcast
};

// scheduled jobs
const processUpdatesJob = cron.schedule(schedule.updateFreq, processUpdates.perform, false);
const broadcastJob = cron.schedule(schedule.broadcastFreq, broadcast, false);

module.exports = {
    scheduledJobs: {
        processUpdates: processUpdatesJob,
        broadcast: broadcastJob
    },
    processUpdates: processUpdates
};
