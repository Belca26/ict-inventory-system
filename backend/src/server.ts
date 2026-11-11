import { app } from './app';
import { env } from './config/env';
import { startScheduledJobs } from './jobs/scheduledJobs';

app.listen(env.PORT, () => {
  console.log(`ICT Inventory API listening on port ${env.PORT} [${env.NODE_ENV}]`);
  startScheduledJobs();
});
