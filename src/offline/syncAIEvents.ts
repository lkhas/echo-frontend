import { dbPromise } from "./db";
import { apiFetch } from "@/services/api";
import { v4 as uuid } from "uuid";

export async function processAIEvents(token: string) {

  const db = await dbPromise;

  const events = await db.getAllFromIndex("ai_events", "status", "pending");

  for (const event of events) {

    try {

      if (event.type === "TRANSCRIBE_AUDIO") {

        await apiFetch(`/transcriptions/${event.observation_id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });

        // next step event
        await db.put("ai_events", {
          event_id: uuid(),
          type: "RUN_VIM",
          observation_id: event.observation_id,
          status: "pending",
          created_at: Date.now()
        });

      }

      if (event.type === "RUN_VIM") {

        await apiFetch(`/vim/${event.observation_id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });

      }

      event.status = "done";
      await db.put("ai_events", event);

    } catch (err) {

      event.status = "error";
      await db.put("ai_events", event);

      console.warn("AI event failed", err);

    }

  }

}