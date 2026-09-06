export interface Operation {
  op_id: string;
  type: "CREATE_OBSERVATION" | string;
  payload: any;
  status: "pending" | "confirmed";
  retries?: number;
  lastAttempt?: number;
  created_at: number;
}

export interface AIEvent {
  event_id: string;
  type: "TRANSCRIBE_AUDIO" | "TRANSLATE_NARRATIVE" | "RUN_VIM";
  observation_id: string;
  status: "pending" | "processing" | "done";
  retries: number;
  lastAttempt?: number;
  created_at: number;
}

export interface MediaQueueItem {
  media_id: string;
  observation_id: string;
  field: "image_urls" | "audio_url";
  file: File | Blob;
  status: "pending" | "uploaded" | "failed";
  retries: number;
  created_at: number;
}