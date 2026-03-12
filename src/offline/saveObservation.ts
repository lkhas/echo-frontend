import { dbPromise } from "./db";
import { v4 as uuid } from "uuid";

export async function saveObservationOffline(
  observation: any,
  images?: File[],
  audio?: Blob | null
) {
  const db = await dbPromise;


  const observationId = observation.id || uuid();

  const obs = {
    ...observation,
    id: observationId,
    audio_url: null,
    image_urls: [],
    aiProcessed: false,
    updated_at: Date.now()
  };
 await db.put("observations", obs);

  // 1️⃣ Save observation operation


  await db.put("operations", {
    op_id: uuid(),
    type: "CREATE_OBSERVATION",
    payload: obs,
    status: "pending"
  });

  // 🔥 Add narrative translation event
  if (obs.narrative && obs.narrative.trim().length > 0) {

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


  

  // 2️⃣ Save images into media_queue
  if (images && images.length > 0) {
    for (const image of images) {
      await db.put("media_queue", {
        media_id: uuid(),
        observation_id: observationId,
        field: "image_urls",   // must match backend
        file: image,
        status: "pending",
        retries: 0,
        created_at: Date.now(),
      });
      console.log("✅ Image saved locally:", image.name);

    }
  }

  // 3️⃣ Save audio into media_queue
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


// import { dbPromise } from "./db";
// import { v4 as uuid } from "uuid";

// export async function saveObservationOffline(observation: any) {
//   const db = await dbPromise;

//   const operation = {
//     op_id: uuid(),
//     type: "CREATE_OBSERVATION",
//     payload: observation,

//     status: "pending",
//     retries: 0,                // ✅ add
//     lastAttempt: undefined,    // ✅ add
//     created_at: Date.now()
//   };

//   await db.put("operations", operation);
// }
