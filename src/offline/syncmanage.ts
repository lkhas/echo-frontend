import { syncOperations } from "./sync";
import { syncMediaUploads } from "./syncMedia";
import { processAIEvents } from "./syncAIEvents";
import { purgeAllConfirmed, resetStuckProcessingEvents } from "@/offline/purge";

// Module-level singleton lock. Any caller during an in-flight run just
// awaits the SAME promise instead of starting a second parallel pipeline.
let inFlight: Promise<void> | null = null;

export function runFullSync(token: string): Promise<void> {
  if (inFlight) {
    console.log("⏳ Sync already running, joining in-flight run");
    return inFlight;
  }

  inFlight = (async () => {
    try {
          
      await resetStuckProcessingEvents(token); // token already available in this function's scope

      await syncOperations(token);
      await syncMediaUploads(token);
      await processAIEvents(token);
      await purgeAllConfirmed();
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}