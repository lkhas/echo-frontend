import { openDB } from "idb";

// Version 5: initial observations/operations/media_queue/ai_events schema.
//
// The `ai_events` store is the CURRENT, live driver of the AI pipeline
// (see syncAIEvents.ts). It is not legacy/back-compat — client-side
// TRANSCRIBE_AUDIO -> TRANSLATE_NARRATIVE -> RUN_VIM sequencing depends on it.
//
// Version 6: added a `pipelineStarted` index on `observations`, in
// preparation for a future migration to a backend-owned pipeline (Cloud
// Tasks). The field is not written or read anywhere yet — this just
// reserves the index so that migration doesn't require another version
// bump / upgrade pass later. Do NOT treat `ai_events` as deprecated until
// that migration actually lands and saveObservation.ts / syncAIEvents.ts
// are updated to stop using it.
export const dbPromise = openDB("echo-db", 6, {
  upgrade(db, oldVersion, _newVersion, tx) {

    if (!db.objectStoreNames.contains("observations")) {
      const obs = db.createObjectStore("observations", { keyPath: "id" });
      obs.createIndex("updated_at", "updated_at");
      obs.createIndex("aiProcessed", "aiProcessed");
      obs.createIndex("pipelineStarted", "pipelineStarted");
    } else if (oldVersion < 6) {
      // Existing store from v5: add the new index without touching data.
      const obs = tx.objectStore("observations");
      if (!obs.indexNames.contains("pipelineStarted")) {
        obs.createIndex("pipelineStarted", "pipelineStarted");
      }
    }

    if (!db.objectStoreNames.contains("operations")) {
      const ops = db.createObjectStore("operations", { keyPath: "op_id" });
      ops.createIndex("status", "status");
      ops.createIndex("created_at", "created_at");
    }

    if (!db.objectStoreNames.contains("media_queue")) {
      const media = db.createObjectStore("media_queue", { keyPath: "media_id" });
      media.createIndex("observation_id", "observation_id");
      media.createIndex("status", "status");
    }

    // Currently the live AI pipeline queue — see comment above.
    if (!db.objectStoreNames.contains("ai_events")) {
      const ai = db.createObjectStore("ai_events", { keyPath: "event_id" });
      ai.createIndex("status", "status");
      ai.createIndex("observation_id", "observation_id");
    }
  }
});