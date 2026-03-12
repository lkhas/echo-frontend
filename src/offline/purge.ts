import { dbPromise } from "./db";

const PURGE_AFTER_MS = 5 * 60 * 1000; // 5 minutes

export async function purgeConfirmedOperations() {
  const db = await dbPromise;
  const ops = await db.getAll("operations");

  const now = Date.now();
  let purged = 0;

  for (const op of ops) {
    if (
      op.status === "confirmed" &&
      op.created_at &&
      now - op.created_at > PURGE_AFTER_MS
    ) {
      await db.delete("operations", op.op_id);
      purged++;
    }
  }

  if (purged > 0) {
    console.log(`🧹 Purged ${purged} confirmed operations`);
  }
}
