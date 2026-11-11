import cron from 'node-cron';
import { runDailyNotificationScan } from '../modules/notifications/notification.service';

export function startScheduledJobs() {
  // Runs once a day at 07:00 server time. Adjust the cron expression if the
  // deployment's server timezone doesn't match the university's local time.
  cron.schedule('0 7 * * *', async () => {
    try {
      const result = await runDailyNotificationScan();
      console.log(
        `[cron] Daily notification scan complete — checked ${result.checkedSchedules} schedules, ${result.checkedWarranties} warranties.`,
      );
    } catch (err) {
      console.error('[cron] Daily notification scan failed:', err);
    }
  });

  console.log('[cron] Scheduled jobs registered (daily notification scan at 07:00).');
}
