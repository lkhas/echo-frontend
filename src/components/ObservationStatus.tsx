export function ObservationStatus({ status }: { status: string }) {
  const map: any = {
    pending: "🟡 Saved offline",
    uploading: "🔵 Uploading",
    synced: "🟢 Synced",
    error: "🔴 Will retry"
  };

  return <span>{map[status]}</span>;
}
