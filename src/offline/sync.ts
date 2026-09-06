import { dbPromise } from "./db";
import { apiFetch } from "@/services/api";
import { getBackoffDelay } from "./backoff";
import { purgeConfirmedOperations } from "./purge";
import { syncState } from "./syncState";
import type { Operation } from "./types";

const DEBUG = process.env.NODE_ENV !== "production";
function log(...args: unknown[]) {
  if (DEBUG) console.log(...args);
}

export interface SyncResult {
  attempted: number;
  confirmed: number;
  failed: number;
}

let inFlight: Promise<SyncResult> | null = null;

/**
 * Pushes all pending local `operations` to the backend.
 *
 * Safe to call from multiple places at once (e.g. an app-mount effect and a
 * post-submit handler) — overlapping calls join the same in-flight run
 * instead of racing each other over IndexedDB.
 */
export function syncOperations(token: string): Promise<SyncResult> {
  if (inFlight) {
    log("⏳ syncOperations already running, joining in-flight run");
    return inFlight;
  }
  inFlight = run(token).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function run(token: string): Promise<SyncResult> {
  const result: SyncResult = { attempted: 0, confirmed: 0, failed: 0 };

  if (!navigator.onLine) {
    log("❌ Offline, skipping sync");
    syncState.setStatus("offline");
    return result;
  }

  syncState.setStatus("syncing");

  const db = await dbPromise;
  const ops: Operation[] = await db.getAll("operations");
  const now = Date.now();

  log(`📦 Operations found: ${ops.length}`);

  for (const op of ops) {
    if (op.status === "confirmed") continue;

    const retries = op.retries ?? 0;
    const delay = getBackoffDelay(retries);
    if (op.lastAttempt && now - op.lastAttempt < delay) continue;

    result.attempted++;

    try {
      log(`📤 Sending ${op.op_id} (retry ${retries})`);

      await apiFetch("/observations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Operation-Id": op.op_id,
        },
        body: JSON.stringify(op.payload),
      });

      op.status = "confirmed";
      await db.put("operations", op);
      result.confirmed++;

      log(`✅ Operation ${op.op_id} confirmed`);
    } catch (err) {
      op.retries = retries + 1;
      op.lastAttempt = now;
      await db.put("operations", op);
      result.failed++;

      log(
        `⚠️ Failed ${op.op_id}, retry #${op.retries} in ${getBackoffDelay(op.retries)}ms`,
        err
      );
    }
  }

  await purgeConfirmedOperations();

  // Correctly reflect outcome — previously `hadError` was declared but
  // never set, so the UI could never show a real error state.
  if (result.attempted > 0 && result.confirmed === 0 && result.failed > 0) {
    syncState.setStatus("error");
  } else if (result.confirmed > 0) {
    syncState.setStatus("up_to_date");
  } else {
    syncState.setStatus("idle");
  }

  return result;
}