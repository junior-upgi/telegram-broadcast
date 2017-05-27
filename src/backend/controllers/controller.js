// import cron from 'node-cron';

// import eVars from '../config/environment.js';
// import processUpdates from './processUpdates/processUpdates.js';
// import broadcast from './broadcast.js';

// const PER_MINUTE = '0 * * * * *';
// const THIRTY_SECONDS = '*/30 * * * * *';
// const TEN_SECONDS = '*/10 * * * * *';
// const FIVE_SECONDS = '*/5 * * * * *';
// const PER_SECOND = '* * * * * *';

// const schedule = {
//     // how often to check for conversation updates
//     updateFreq: eVars.ENV === 'production' ? THIRTY_SECONDS : PER_SECOND,
//     // how often to broadcast messages
//     broadcastFreq: eVars.ENV === 'production' ? FIVE_SECONDS : PER_SECOND
// };

// scheduled jobs
// const processUpdatesJob = cron.schedule(schedule.updateFreq, processUpdates.perform, false);
// const broadcastJob = cron.schedule(schedule.broadcastFreq, broadcast, false);

module.exports = {
    // scheduledJobs: {
    //     processUpdates: processUpdatesJob,
    //     broadcast: broadcastJob
    // },
    // processUpdates: processUpdates
};
