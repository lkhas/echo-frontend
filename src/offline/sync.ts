import { dbPromise } from "./db";
import { apiFetch } from "@/services/api";
import { getBackoffDelay } from "./backoff";
import { purgeConfirmedOperations } from "./purge";
import { syncState } from "./syncState";

export async function syncOperations(token: string) {
  console.log("🔁 syncOperations called");

  if (!navigator.onLine) {
    console.log("❌ Offline, skipping sync");
    syncState.setStatus("offline");
    return;

    return;
  }

  syncState.setStatus("syncing");

  const db = await dbPromise;
  const ops = await db.getAll("operations");

  console.log("📦 Operations found:", ops.length);


  const now = Date.now();
  
  // ✅ THESE MUST EXIST (THIS IS YOUR ERROR)
  let hadError = false;
  let didSync = false;

  for (const op of ops) {
    if (op.status === "confirmed") continue;

    const retries = op.retries || 0;
    const delay = getBackoffDelay(retries);

    // ⏳ BACKOFF CHECK
    if (op.lastAttempt && now - op.lastAttempt < delay) {
      continue;
    }
      console.log("📦 Payload being sent:", op.payload);
      console.log("TYPE OF PAYLOAD:", typeof op.payload);


    try {
      console.log(`📤 Sending ${op.op_id} (retry ${retries})`);

      await apiFetch("/observations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Operation-Id": op.op_id,
        },
        body: JSON.stringify(op.payload),
      });

      // ✅ success
      op.status = "confirmed";
      await db.put("operations", op);

      console.log(`✅ Operation ${op.op_id} confirmed`);
    } catch (err) {
      // ❌ failure → schedule retry
      op.retries = retries + 1;
      op.lastAttempt = now;

      await db.put("operations", op);
      didSync = true;

      console.log(
        `⚠️ Failed ${op.op_id}, retry #${op.retries} in ${getBackoffDelay(op.retries)}ms`,
        err
      );
    }
  }
  

  // 🧹 cleanup old confirmed ops
  await purgeConfirmedOperations();


  if (hadError) {
    syncState.setStatus("error");
  } else if (didSync) {
    syncState.setStatus("up_to_date");
  } else {
    syncState.setStatus("idle");
  }

}
