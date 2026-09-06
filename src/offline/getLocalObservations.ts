import { dbPromise } from "./db";

export interface LocalObservationView {
  id: string;
  title: string;
  villageName: string;
  observationType: string | null;
  description: string;
  activityType?: string;
  assetType?: string | null;
  imageUrls: string[];
  imageCount: number;
  hasAudio: boolean;
  audioUrl?: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: number;
  status: string;
  syncStatus: "pending" | "confirmed";
}

/**
 * Reads everything currently stored in IndexedDB and returns it in the
 * same shape the Dashboard table already renders. Local media that hasn't
 * been uploaded yet (still a File/Blob in media_queue) is shown via a
 * temporary blob: object URL so images/audio still preview offline.
 */
export async function getLocalObservations(): Promise<LocalObservationView[]> {
  const db = await dbPromise;

  const [observations, operations, mediaItems] = await Promise.all([
    db.getAll("observations"),
    db.getAll("operations"),
    db.getAll("media_queue"),
  ]);

  // Map observation id -> sync status, from its CREATE_OBSERVATION operation
  const syncStatusByObsId = new Map<string, "pending" | "confirmed">();
  for (const op of operations) {
    if (op.type === "CREATE_OBSERVATION" && op.payload?.id) {
      syncStatusByObsId.set(
        op.payload.id,
        op.status === "confirmed" ? "confirmed" : "pending"
      );
    }
  }

  // Group not-yet-uploaded media by observation, create local preview URLs
  const imagesByObs = new Map<string, string[]>();
  const audioByObs = new Map<string, string>();

  for (const item of mediaItems) {
    if (item.status === "uploaded") continue; // already reflected on the observation itself
    const url = URL.createObjectURL(item.file);
    if (item.field === "image_urls") {
      const list = imagesByObs.get(item.observation_id) || [];
      list.push(url);
      imagesByObs.set(item.observation_id, list);
    } else if (item.field === "audio_url") {
      audioByObs.set(item.observation_id, url);
    }
  }

  return observations.map((obs: any) => {
    const localImages = imagesByObs.get(obs.id) || [];
    const uploadedImages: string[] = obs.image_urls || [];
    const allImages = [...uploadedImages, ...localImages];

    return {
      id: obs.id,
      title: obs.title,
      villageName: obs.village_name,
      observationType: obs.observation_type,
      description: obs.narrative,
      activityType: obs.activity_type,
      assetType: obs.asset_type,
      imageUrls: allImages,
      imageCount: allImages.length,
      hasAudio: !!obs.audio_url || audioByObs.has(obs.id),
      audioUrl: obs.audio_url || audioByObs.get(obs.id),
      latitude: obs.latitude ?? null,
      longitude: obs.longitude ?? null,
      createdAt: obs.updated_at,
      status: obs.observation_status || "recorded",
      syncStatus: syncStatusByObsId.get(obs.id) || "pending",
    };
  });
}