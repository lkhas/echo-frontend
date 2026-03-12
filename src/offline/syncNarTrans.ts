import { dbPromise } from "./db";
import { apiFetch } from "@/services/api";

export async function syncNarTrans(token: string) {
  if (!navigator.onLine) return;

  const db = await dbPromise;

  const operations = await db.getAll("operations");

  for (const op of operations) {
    if (op.type !== "CREATE_OBSERVATION") continue;
    console.log(op.type)


    const obs = op.payload;
    console.log(obs.narrative)

    if (!obs.narrative || obs.narrative.trim().length === 0) continue;

    try {
      await apiFetch(`/narrative/${obs.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(`🌍 Narrative translation triggered for ${obs.id}`);

    } catch (err) {
      console.warn(`⚠️ Narrative translation failed for ${obs.id}`, err);
    }
  }
}