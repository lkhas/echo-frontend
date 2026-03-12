import { Observation } from '@/data/mockObservations';

export const exportToCSV = (observations: Observation[], filename = 'observations') => {
  const headers = ['ID', 'Type', 'Village', 'Description', 'Photos', 'Audio', 'Latitude', 'Longitude', 'Date'];
  const rows = observations.map(o => [
    o.id,
    o.observationType,
    o.villageName,
    `"${o.description.replace(/"/g, '""')}"`,
    o.imageCount,
    o.hasAudio ? 'Yes' : 'No',
    o.latitude,
    o.longitude,
    new Date(o.createdAt).toLocaleDateString(),
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportToPDF = (observations: Observation[], filename = 'observations') => {
  const html = `
    <html><head><title>Observations Report</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; color: #1a1a1a; }
      h1 { font-size: 20px; margin-bottom: 4px; }
      p.sub { font-size: 12px; color: #666; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { background: #f1f5f9; text-align: left; padding: 8px; border: 1px solid #e2e8f0; }
      td { padding: 8px; border: 1px solid #e2e8f0; }
      .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; text-transform: capitalize; }
      .environmental { background: #d1fae5; color: #065f46; }
      .social { background: #ede9fe; color: #5b21b6; }
      .health { background: #ffe4e6; color: #9f1239; }
      .infrastructure { background: #fef3c7; color: #92400e; }
      .education { background: #e0f2fe; color: #075985; }
    </style></head><body>
    <h1>Observations Report</h1>
    <p class="sub">Generated on ${new Date().toLocaleDateString()} · ${observations.length} record(s)</p>
    <table>
      <tr><th>Type</th><th>Village</th><th>Description</th><th>Photos</th><th>Audio</th><th>Date</th></tr>
      ${observations.map(o => `
        <tr>
          <td><span class="badge ${o.observationType}">${o.observationType}</span></td>
          <td>${o.villageName}</td>
          <td>${o.description}</td>
          <td>${o.imageCount}</td>
          <td>${o.hasAudio ? 'Yes' : 'No'}</td>
          <td>${new Date(o.createdAt).toLocaleDateString()}</td>
        </tr>
      `).join('')}
    </table></body></html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    win.setTimeout(() => { win.print(); }, 400);
  }
};
