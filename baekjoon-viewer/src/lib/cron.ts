import cron from "node-cron";
import { syncProblems } from "./sync";

let scheduled = false;

export function startSyncCron() {
  if (scheduled) return;
  scheduled = true;

  // 5분마다 동기화 실행
  cron.schedule("*/5 * * * *", () => {
    console.log("[Cron] Running scheduled sync...");
    try {
      syncProblems();
    } catch (err) {
      console.error("[Cron] Sync failed:", err);
    }
  });

  // 서버 시작 시 즉시 1회 동기화
  console.log("[Cron] Running initial sync...");
  try {
    syncProblems();
  } catch (err) {
    console.error("[Cron] Initial sync failed:", err);
  }

  console.log("[Cron] Scheduled sync every 5 minutes");
}
