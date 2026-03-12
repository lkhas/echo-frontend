import { useSyncStatus } from "@/offline/syncState";

export function SyncStatus() {
  const status = useSyncStatus();

  if (status === "idle") return null;

  const map: Record<string, string> = {
    offline: "🔴 Offline",
    syncing: "🔄 Syncing…",
    error: "⚠️ Sync failed (retrying)",
    up_to_date: "✅ All changes synced",
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 12,
        right: 12,
        padding: "8px 12px",
        background: "#111",
        color: "#fff",
        borderRadius: 6,
        fontSize: 12,
        zIndex: 1000,
      }}
    >
      {map[status]}
    </div>
  );
}
