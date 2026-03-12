import { dbPromise } from "./db";
import { apiFetch } from "@/services/api";

export async function syncAI(token: string) {
  if (!navigator.onLine) return;

  const db = await dbPromise;
  const observations = await db.getAll("observations");
  for (const obs of observations) 
  {
    
    
    if (obs.aiProcessed) continue;
    console.log(`VIM  triggered for ${obs.id}`);

    const hasNarrative = obs.narrative?.trim()?.length > 0;
    const hasAudio = !!obs.audio_url; 



    // Nothing to process
    if (!hasNarrative && !hasAudio) continue;
        console.log(obs)

    try {

       await apiFetch(`/vim/${obs.id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    obs.aiProcessed = true;

    await db.put("observations", obs);

      console.log(`🧠 VIM (after transcription) triggered for ${obs.id}`);

    } 
    catch (err) {
      console.warn(`⚠️ AI sync failed for ${obs.id}`, err);
    }
  }
}