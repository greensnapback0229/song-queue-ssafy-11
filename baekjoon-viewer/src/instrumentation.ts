export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startSyncCron } = await import("./lib/cron");
    startSyncCron();
  }
}
