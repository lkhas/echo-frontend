// syncAIEvents.ts - locked, loop-based sequential pipeline
import { dbPromise } from "./db";
import { apiFetch } from "@/services/api";
import { v4 as uuid } from "uuid";

let inFlight: Promise<void> | null = null;

export function processAIEvents(token: string): Promise<void> {
  if (inFlight) {
    // Someone else is already draining the queue — piggyback on that run
    // instead of starting a second one that will race on the same events.
    return inFlight;
  }
  inFlight = runLoop(token).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function runLoop(token: string) {
  const db = await dbPromise;

  // Loop instead of recursing: keeps a single call stack, single lock,
  // and drains newly-queued follow-up events (e.g. TRANSLATE_NARRATIVE
  // queued by TRANSCRIBE_AUDIO) without re-entering processAIEvents.
  while (true) {
    const events = await db.getAllFromIndex("ai_events", "status", "pending");
    if (events.length === 0) break;

    for (const event of events) {
      // Re-read immediately before claiming it. Cheap insurance in case
      // the store is ever touched from another tab/worker.
      const fresh = await db.get("ai_events", event.event_id);
      if (!fresh || fresh.status !== "pending") continue;

      await processOne(db, token, fresh);
    }
  }
}

async function processOne(db: any, token: string, event: any) {
  try {
    // 1. Lock immediately
    event.status = "processing";
    await db.put("ai_events", event);

    if (event.type === "TRANSCRIBE_AUDIO") {
      const obs = await db.get("observations", event.observation_id);
      if (!obs || !obs.audio_url) {
        console.warn(`⚠️ No audio for ${event.observation_id}, skipping transcription.`);
        event.status = "done";
        await db.put("ai_events", event);
        return;
      }

      await apiFetch(`/transcriptions/${event.observation_id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      await queueEvent(db, "TRANSLATE_NARRATIVE", event.observation_id);
    } else if (event.type === "TRANSLATE_NARRATIVE") {
      await apiFetch(`/narrative/${event.observation_id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      await queueEvent(db, "RUN_VIM", event.observation_id);
    } else if (event.type === "RUN_VIM") {
      await apiFetch(`/vim/${event.observation_id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const obs = await db.get("observations", event.observation_id);
      if (obs) {
        obs.aiProcessed = true;
        await db.put("observations", obs);
        console.log("✅ Observation fully processed and marked complete.");
      }
    }

    event.status = "done";
    await db.put("ai_events", event);
    console.log(`✅ AI event done: ${event.type} for ${event.observation_id}`);
  } catch (err) {
    console.warn(`❌ AI event failed [${event.type}] for ${event.observation_id}:`, err);
    event.status = "pending";
    event.retries = (event.retries || 0) + 1;
    event.lastAttempt = Date.now();
    await db.put("ai_events", event);
  }
}

// Idempotent queueing: don't create a duplicate step if one is already
// pending/processing for this observation. Prevents the same class of
// double-processing bug at the *creation* side, not just the run side.
async function queueEvent(db: any, type: string, observationId: string) {
  const all = await db.getAllFromIndex("ai_events", "observation_id", observationId);
  const duplicate = all.some(
    (e: any) => e.type === type && (e.status === "pending" || e.status === "processing")
  );
  if (duplicate) {
    console.log(`⏭️ ${type} already queued for ${observationId}, skipping duplicate`);
    return;
  }

  await db.put("ai_events", {
    event_id: uuid(),
    type,
    observation_id: observationId,
    status: "pending",
    retries: 0,
    created_at: Date.now(),
  });
}