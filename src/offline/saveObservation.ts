import { dbPromise } from "./db";
import { v4 as uuid } from "uuid";

export async function saveObservationOffline(
  observation: any,
  images?: File[],
  audio?: Blob | null
) {
  const db = await dbPromise;

  const observationId = observation.id || uuid();

  // 1. Save local observation copy
  const obs = {
    ...observation,
    id: observationId,
    audio_url: null, // Initial state before sync
    image_urls: [],  // Initial state before sync
    aiProcessed: false,
    updated_at: Date.now()
  };
  await db.put("observations", obs);

  // 2. Save observation operation for synchronization
  await db.put("operations", {
    op_id: uuid(),
    type: "CREATE_OBSERVATION",
    payload: obs,
    status: "pending",
    created_at: Date.now()
  });

  // 3. Initialize AI Event Pipeline
  // If audio is present, the pipeline starts with TRANSCRIBE_AUDIO 
  // (triggered by syncMedia.ts later). 
  // If NO audio, we start the pipeline here with TRANSLATE_NARRATIVE.
  if (!audio && obs.narrative && obs.narrative.trim().length > 0) {
        console.log("❌ No AUdio");

    await db.put("ai_events", {
      event_id: uuid(),
      type: "TRANSLATE_NARRATIVE",
      observation_id: observationId,
      status: "pending",
      retries: 0,
      lastAttempt: undefined,
      created_at: Date.now(),
    });
  }

  // 4. Save images to media_queue
  if (images && images.length > 0) {
    for (const image of images) {
      await db.put("media_queue", {
        media_id: uuid(),
        observation_id: observationId,
        field: "image_urls",
        file: image,
        status: "pending",
        retries: 0,
        created_at: Date.now(),
      });
    }
  }

  // 5. Save audio to media_queue
  if (audio) {
    await db.put("media_queue", {
      media_id: uuid(),
      observation_id: observationId,
      field: "audio_url",
      file: audio,
      status: "pending",
      retries: 0,
      created_at: Date.now(),
    });
  }
}