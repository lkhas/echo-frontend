import { dbPromise } from "./db";
import { apiFetch } from "@/services/api";
import { getBackoffDelay } from "./backoff";
import { syncState } from "./syncState";
import { v4 as uuid } from "uuid";

export async function syncMediaUploads(token: string) {
  const db = await dbPromise;
  const mediaItems = await db.getAll("media_queue");
  const now = Date.now();
  let hadError = false;
  let didSync = false;

  for (const item of mediaItems) {
    if (item.status === "uploaded") continue;

    const delay = getBackoffDelay(item.retries || 0);
    if (item.lastAttempt && now - item.lastAttempt < delay) continue;

    try {
      const { upload_url, public_url } = await apiFetch<{ upload_url: string; public_url: string; }>("/media/upload-url", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ observation_id: item.observation_id, media_type: item.field === "image_urls" ? "image" : "audio" }),
      });

      await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": item.field === "image_urls" ? "image/jpeg" : "audio/mpeg" },
        body: item.file,
      });

      await apiFetch(`/observations/${item.observation_id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ [item.field]: item.field === "image_urls" ? [public_url] : public_url }),
      });

      const obs = await db.get("observations", item.observation_id);
      if (obs) {
        if (item.field === "audio_url") obs.audio_url = public_url;
        else obs.image_urls.push(public_url);
        await db.put("observations", obs);
      }

      // If audio, trigger the FIRST event in the relay
      if (item.field === "audio_url") {
                console.log("❌ AUdio triggered TRANSCRIBE_AUDIO");

        await db.put("ai_events", {
          event_id: uuid(),
          type: "TRANSCRIBE_AUDIO",
          observation_id: item.observation_id,
          status: "pending",
          created_at: Date.now()
        });
      }

      item.status = "uploaded";
      await db.put("media_queue", item);
      didSync = true;
    } catch (err) {
      item.retries = (item.retries || 0) + 1;
      item.lastAttempt = now;
      await db.put("media_queue", item);
      hadError = true;
    }
  }
  syncState.setStatus(hadError ? "error" : (didSync ? "up_to_date" : syncState.status));
}