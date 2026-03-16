import { useSyncExternalStore } from "react";

export type SyncStatus = "idle" | "offline" | "syncing" | "error" | "up_to_date";

let currentStatus: SyncStatus = "idle";
const listeners = new Set<() => void>();

// Central function to update state and notify UI
function updateStatus(next: SyncStatus) {
  currentStatus = next;
  console.log(`🔄 Sync status changed to: ${currentStatus}`);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return currentStatus;
}

export function useSyncStatus() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export const syncState = {
  get status() {
    return currentStatus;
  },
  // This now correctly calls the function that notifies UI
  setStatus: (next: SyncStatus) => updateStatus(next),
};