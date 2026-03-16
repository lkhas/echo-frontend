import { useSyncStatus } from "@/offline/syncState";

export function SyncStatus() {
  const status = useSyncStatus();

  // Remove this line to make it visible when idle
  // if (status === "idle") return null; 

  const map: Record<string, string> = {
    idle: "⚪ Idle", // Add this line
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
        background: "rgb(142 81 243)",
        color: "#fff",
        borderRadius: 6,
        fontSize: 12,
        zIndex: 1000,
      }}
    >
      {map[status] || "Unknown Status"}
    </div>
  );
}
