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

// Add to purge.ts
export async function purgeAllConfirmed() {
  const db = await dbPromise;
  
  // 1. Purge Operations
  // await purgeConfirmedOperations();
  
  // 2. Purge finished AI events (optional but recommended)
  const events = await db.getAll("ai_events");
  for (const event of events) {
    if (event.status === "done") {
      await db.delete("ai_events", event.event_id);
    }
  }
  
  // 3. Purge uploaded media_queue items
  const mediaItems = await db.getAll("media_queue");
  for (const item of mediaItems) {
    if (item.status === "uploaded") {
      await db.delete("media_queue", item.media_id);
    }
  }
// purge.ts
  const observations = await db.getAll("observations");

for (const item of observations) {
  if (item.aiProcessed === true) { 
    // Always guard your delete calls
    if (item.id) {
       await db.delete("observations", item.id);
    }
  }
}
  
 


}
