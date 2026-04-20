// syncAIEvents.ts - Full logic
import { dbPromise } from "./db";
import { apiFetch } from "@/services/api";
import { v4 as uuid } from "uuid";

export async function processAIEvents(token: string) {
  const db = await dbPromise;
  const events = await db.getAllFromIndex("ai_events", "status", "pending");

  for (const event of events) {
    try {
      // Step A: Transcription
      event.status = "processing";
      await db.put("ai_events", event);
      if (event.type === "TRANSCRIBE_AUDIO") {

        const obs = await db.get("observations", event.observation_id);
        if (!obs || !obs.audio_url) {
          console.warn(`⚠️ No audio for ${event.observation_id}, skipping transcription.`);
        }

       
        
        await apiFetch(`/transcriptions/${event.observation_id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Always queue the next logical step after success
        await db.put("ai_events", {
          event_id: uuid(),
          type: "TRANSLATE_NARRATIVE",
          observation_id: event.observation_id,
          status: "pending",
          created_at: Date.now()
        });
      }
      await processAIEvents(token); // 🔥 continue immediately

      // Step B: Translation (or jump here if no audio)
      if (event.type === "TRANSLATE_NARRATIVE") {
        await apiFetch(`/narrative/${event.observation_id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
        
        await db.put("ai_events", {
          event_id: uuid(),
          type: "RUN_VIM",
          observation_id: event.observation_id,
          status: "pending",
          created_at: Date.now()
        });
      }

      await processAIEvents(token); // 🔥 continue immediately

      // Step C: VIM
      if (event.type === "RUN_VIM") {
        await apiFetch(`/vim/${event.observation_id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      // Finalize event
      event.status = "done";
      await db.put("ai_events", event);

      // Only update if the API call above succeeds
      const obs = await db.get("observations", event.observation_id);
      if (obs) {
        obs.aiProcessed = true; 
          
        await db.put("observations", obs); // This will now actually update your DB
      }


      
    } catch (err) {
      console.warn("AI event failed, will retry", err);
      // event.status = "error";
      // await db.put("ai_events", event);
    }
  }
}