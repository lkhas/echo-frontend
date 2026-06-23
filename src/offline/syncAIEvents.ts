// syncAIEvents.ts - Fixed sequential pipeline
import { dbPromise } from "./db";
import { apiFetch } from "@/services/api";
import { v4 as uuid } from "uuid";

export async function processAIEvents(token: string) {
  const db = await dbPromise;
  const events = await db.getAllFromIndex("ai_events", "status", "pending");

  for (const event of events) {
    try {
      // 1. Lock the event immediately to prevent duplicate processing
      event.status = "processing";
      await db.put("ai_events", event);

      // Step A: Transcription
      if (event.type === "TRANSCRIBE_AUDIO") {
        const obs = await db.get("observations", event.observation_id);
        if (!obs || !obs.audio_url) {
          console.warn(`⚠️ No audio for ${event.observation_id}, skipping transcription.`);
          event.status = "done";
          await db.put("ai_events", event);
          continue; // skip to next event
        }

        await apiFetch(`/transcriptions/${event.observation_id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        // Queue the next step — do NOT recurse here
        await db.put("ai_events", {
          event_id: uuid(),
          type: "TRANSLATE_NARRATIVE",
          observation_id: event.observation_id,
          status: "pending",
          retries: 0,
          created_at: Date.now(),
        });
      }

      // Step B: Narrative Translation
      else if (event.type === "TRANSLATE_NARRATIVE") {
        await apiFetch(`/narrative/${event.observation_id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        // Queue the next step
        await db.put("ai_events", {
          event_id: uuid(),
          type: "RUN_VIM",
          observation_id: event.observation_id,
          status: "pending",
          retries: 0,
          created_at: Date.now(),
        });
      }

      // Step C: VIM Extraction
      else if (event.type === "RUN_VIM") {
        await apiFetch(`/vim/${event.observation_id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        // Mark observation as fully AI-processed
        const obs = await db.get("observations", event.observation_id);
        if (obs) {
          obs.aiProcessed = true;
          await db.put("observations", obs);
          console.log("✅ Observation fully processed and marked complete.");
        }
      }

      // Mark event as done
      event.status = "done";
      await db.put("ai_events", event);

      console.log(`✅ AI event done: ${event.type} for ${event.observation_id}`);

    } catch (err) {
      console.warn(`❌ AI event failed [${event.type}] for ${event.observation_id}:`, err);

      // Reset to pending so it can be retried on next sync
      event.status = "pending";
      event.retries = (event.retries || 0) + 1;
      event.lastAttempt = Date.now();
      await db.put("ai_events", event);
    }
  }

  // After processing all current pending events, check if new ones were queued
  // (e.g. TRANSLATE_NARRATIVE queued by TRANSCRIBE_AUDIO above)
  const remaining = await db.getAllFromIndex("ai_events", "status", "pending");
  if (remaining.length > 0) {
    console.log(`🔁 ${remaining.length} new AI events queued, processing next batch...`);
    await processAIEvents(token); // Safe: only recurses if truly new events exist
  }
}