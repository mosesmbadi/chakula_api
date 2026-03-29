/**
 * Cluster entrypoint — forks one worker per CPU core.
 * Use in production: node cluster.js
 * Use in dev: node app.js (single process, easier debugging)
 */
const cluster = require('node:cluster');
const os = require('node:os');

const WORKER_COUNT = parseInt(process.env.CLUSTER_WORKERS, 10) || os.cpus().length;

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} — spawning ${WORKER_COUNT} workers`);

  for (let i = 0; i < WORKER_COUNT; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code) => {
    console.error(`Worker ${worker.process.pid} exited (code ${code}) — restarting`);
    cluster.fork();
  });

  // Run the daily recommendation scheduler only on the primary process
  const { scheduleDailyAt } = require('./core/scheduler');
  const { generateForAllUsers } = require('./modules/recommendations/recommendation.service');
  scheduleDailyAt(0, 0, () => {
    generateForAllUsers().catch(err => {
      console.error('[Scheduler] Daily recommendation generation failed:', err.message);
    });
  });
} else {
  require('./app.js');
}
