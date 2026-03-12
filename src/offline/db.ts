import { openDB } from "idb";

export const dbPromise = openDB("echo-db", 3, {
  upgrade(db) {

    // Observations
    const obs = db.createObjectStore("observations", { keyPath: "id" });
    obs.createIndex("updated_at", "updated_at");
    obs.createIndex("aiProcessed", "aiProcessed");

    // Operations (server sync)
    const ops = db.createObjectStore("operations", { keyPath: "op_id" });
    ops.createIndex("status", "status");

    // Media queue
    const media = db.createObjectStore("media_queue", { keyPath: "media_id" });
    media.createIndex("observation_id", "observation_id");
    media.createIndex("status", "status");

    // AI Event queue
    const ai = db.createObjectStore("ai_events", { keyPath: "event_id" });
    ai.createIndex("status", "status");
    ai.createIndex("observation_id", "observation_id");

    // // sync metadata
    // db.createObjectStore("sync_meta", { keyPath: "key" });
  }
});