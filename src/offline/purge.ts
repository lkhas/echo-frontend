import { dbPromise } from "./db";

import { apiFetch } from "@/services/api";

// const STUCK_PROCESSING_AFTER_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

const STUCK_PROCESSING_AFTER_MS = 10 * 60 * 1000; // 10 minutes

/**
 * ai_events can get stuck in "processing" if the app was closed/killed
 * between the network call completing and the final "done" write landing
 * in IndexedDB. In that case the backend work is ALREADY FINISHED — so
 * before blindly retrying (which could duplicate server-side work like
 * VIM edges), we check the observation's actual state first.
 */
export async function resetStuckProcessingEvents(token?: string) {
  const db = await dbPromise;
  const events = await db.getAll("ai_events");

  const now = Date.now();
  let reset = 0;
  let reconciledDone = 0;

  for (const event of events) {
    if (event.status !== "processing") continue;

    const reference = event.lastAttempt || event.created_at;
    if (!reference || now - reference <= STUCK_PROCESSING_AFTER_MS) continue;

    // Try to reconcile with the server first, if we're online and have a token
    let alreadyCompleted = false;

    if (token && navigator.onLine) {
      try {
        const obs = await apiFetch<any>(`/observations/${event.observation_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        alreadyCompleted = isStepAlreadyDone(event.type, obs);
      } catch (err) {
        console.warn(`Could not reconcile event ${event.event_id}, will retry instead:`, err);
      }
    }

    if (alreadyCompleted) {
      event.status = "done";
      await db.put("ai_events", event);
      reconciledDone++;
      console.log(`✅ Reconciled ${event.event_id} (${event.type}) — server already completed it`);
    } else {
      event.status = "pending";
      event.retries = (event.retries || 0) + 1;
      event.lastAttempt = now;
      await db.put("ai_events", event);
      reset++;
      console.log(`♻️ Reset stuck event ${event.event_id} (${event.type}) back to pending`);
    }
  }

  if (reset > 0) console.log(`♻️ Reset ${reset} stuck "processing" event(s) for retry`);
  if (reconciledDone > 0) console.log(`✅ Reconciled ${reconciledDone} stuck event(s) as already done`);

  return { reset, reconciledDone };
}

// Maps an ai_event type to the observation field that proves the backend
// already completed that step, so we don't needlessly re-trigger it.
function isStepAlreadyDone(eventType: string, obs: any): boolean {
  switch (eventType) {
    case "RUN_VIM":
      // ai_pipeline_complete is only set true once VIM extraction finishes
      return !!obs?.ai_pipeline_complete;
    case "TRANSLATE_NARRATIVE":
      return !!obs?.narrative_english || obs?.ai_processing_stage === "extract_vim" || obs?.ai_processing_stage === "DONE";
    case "TRANSCRIBE_AUDIO":
      return obs?.ai_processing_stage === "extract_vim" || obs?.ai_processing_stage === "DONE";
    default:
      return false;
  }
}

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
