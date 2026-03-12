import { dbPromise } from "./db";
import { apiFetch } from "@/services/api";
import { getBackoffDelay } from "./backoff";
import { syncState } from "./syncState";
import { v4 as uuid } from "uuid";


export async function syncMediaUploads(token: string) {
  console.log("🎞 syncMediaUploads called");

  if (!navigator.onLine) {
    console.log("❌ Offline, skipping media sync");
    return;
  }

  const db = await dbPromise;
  const mediaItems = await db.getAll("media_queue");

  console.log("📦 Media items found:", mediaItems.length);

  const now = Date.now();
  let hadError = false;
  let didSync = false;

  // 🔥 Track observations processed
  const processedObservations = new Set<string>();
  const audioObservations = new Set<string>();

  for (const item of mediaItems) {
    if (item.status === "uploaded") continue;

    const retries = item.retries || 0;
    const delay = getBackoffDelay(retries);

    if (item.lastAttempt && now - item.lastAttempt < delay) {
      continue;
    }

    try {
      const isAudio = item.field === "audio_url";
      processedObservations.add(item.observation_id);

      if (isAudio) {
        audioObservations.add(item.observation_id);
      }

      console.log(`📤 Uploading media ${item.media_id} (retry ${retries})`);

      // 1️⃣ Get signed URL
      const { upload_url, public_url } = await apiFetch<{
        upload_url: string;
        public_url: string;
      }>("/media/upload-url", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          observation_id: item.observation_id,
          media_type: item.field === "image_urls" ? "image" : "audio",
        }),
      });

      // 2️⃣ Upload file to cloud storage
      await fetch(upload_url, {
        method: "PUT",
        headers: {
          "Content-Type":
            item.field === "image_urls" ? "image/jpeg" : "audio/mpeg",
        },
        body: item.file,
      });

   


      // 3️⃣ Update observation with public URL
      await apiFetch(`/observations/${item.observation_id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          [item.field]:
            item.field === "image_urls" ? [public_url] : public_url,
        }),
      });

          
      // 4️⃣ If audio → trigger transcription
      if (isAudio) {
        try {
          await apiFetch(`/transcriptions/${item.observation_id}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          console.log(
            `🎙 Transcription triggered for observation ${item.observation_id}`
          );
        } 
        catch (transcriptionErr) {
          console.warn(
            `⚠️ Transcription trigger failed for ${item.observation_id}`,
            transcriptionErr
          );
        }
      }

     console.log("🔍 Checking observation in IndexedDB:", item.observation_id);

const obs = await db.get("observations", item.observation_id);

console.log("📦 Observation fetched:", obs);

if (!obs) {
  console.warn("⚠️ Observation missing:", item.observation_id);
} else {
  console.log("✅ Observation found:", obs.id);

  if (isAudio) {
    console.log("🎧 Updating audio_url for observation:", obs.id);
    obs.audio_url = public_url;
  }

  await db.put("observations", obs);

  console.log("💾 Observation updated in IndexedDB:", obs.id);
}
    
      // 5️⃣ Mark media uploaded
      item.status = "uploaded";
      item.lastAttempt = now;
      await db.put("media_queue", item);

      console.log(`✅ Media ${item.media_id} uploaded`);
      didSync = true;

    } catch (err) {
      console.log(`⚠️ Media ${item.media_id} failed`, err);

      item.retries = retries + 1;
      item.lastAttempt = now;
      await db.put("media_queue", item);

      hadError = true;
    }
  }



  // Final sync state
  if (hadError) {
    syncState.setStatus("error");
  } else if (didSync) {
    syncState.setStatus("up_to_date");
  }
}