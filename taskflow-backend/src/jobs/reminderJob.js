const cron = require('node-cron');
const sendDueReminders = require('../utils/sendDueReminders');

const startReminderJob = () => {
  // Runs every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily due date reminder job...');
    await sendDueReminders();
  });

  console.log('Reminder cron job scheduled (every day at 9:00 AM)');
};

module.exports = startReminderJob;