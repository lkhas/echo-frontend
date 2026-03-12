import { useSyncExternalStore } from "react";
export type SyncStatus =
  | "idle"
  | "offline"
  | "syncing"
  | "error"
  | "up_to_date";

let status: SyncStatus = "idle";
const listeners = new Set<() => void>();

function setStatus(next: SyncStatus) {
  status = next;
  listeners.forEach(l => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return status;
}

export function useSyncStatus() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export const syncState = {
  setStatus,
};
