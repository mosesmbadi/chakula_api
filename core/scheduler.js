/**
 * Lightweight cron scheduler — no external dependencies.
 * Runs a callback at a fixed time every day (default: midnight local).
 */

function scheduleDailyAt(hour, minute, callback) {
  function msUntilNext() {
    const now = new Date();
    const next = new Date(now);
    next.setHours(hour, minute, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next - now;
  }

  function tick() {
    callback();
    // Schedule next run (recalculate to avoid drift)
    setTimeout(tick, msUntilNext());
  }

  const delay = msUntilNext();
  console.log(`[Scheduler] Next run in ${Math.round(delay / 60000)} minutes`);
  setTimeout(tick, delay);
}

module.exports = { scheduleDailyAt };
