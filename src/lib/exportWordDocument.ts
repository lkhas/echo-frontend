import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun, ExternalHyperlink } from 'docx';
import { saveAs } from 'file-saver';

/**
 * Helper to fetch a private image using a signed URL and convert to a buffer.
 */
// exportWordDocument.ts
const fetchImageAsBuffer = async (url: string): Promise<ArrayBuffer | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
        console.error(`GCS Fetch Error: ${response.status} ${response.statusText}`);
        return null;
    }
    return await response.arrayBuffer();
  } catch (err) {
    console.error("Network error during Word image fetch:", err);
    return null;
  }
};

export const exportObservationToWord = async (obs: any) => {
  const children: Paragraph[] = [];

  // 1. Report Title
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: `Observation Report — ${obs.villageName || 'Unknown Village'}`, bold: true, size: 32 })],
      spacing: { after: 200 },
    })
  );

  // 2. Metadata Table/Section
  const meta = [
    ['Observation Type', obs.observationType || 'N/A'],
    ['Village Name', obs.villageName || 'N/A'],
    ['Date Created', obs.createdAt ? new Date(obs.createdAt).toLocaleDateString() : 'N/A'],
    ['Coordinates', `${obs.latitude?.toFixed(4)}, ${obs.longitude?.toFixed(4)}`],
    ['Status', obs.status || 'Pending'],
    ['Photo Count', String(obs.imageUrls?.length || 0)],
  ];

  for (const [label, value] of meta) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${label}: `, bold: true, size: 22 }),
          new TextRun({ text: value, size: 22 }),
        ],
        spacing: { after: 80 },
      })
    );
  }

  // 3. Narrative/Description Section
  children.push(
    new Paragraph({ 
      spacing: { before: 200 }, 
      children: [new TextRun({ text: 'Observation Narrative', bold: true, size: 24 })] 
    })
  );
  children.push(
    new Paragraph({ 
      children: [new TextRun({ text: obs.description || 'No description provided.', size: 22 })], 
      spacing: { after: 200 } 
    })
  );

  // 4. Images Section (Fetches from Signed GCS URLs)
  if (obs.imageUrls && obs.imageUrls.length > 0) {
    children.push(
      new Paragraph({ 
        children: [new TextRun({ text: 'Attached Photos', bold: true, size: 24 })], 
        spacing: { before: 200, after: 100 } 
      })
    );

    for (let i = 0; i < obs.imageUrls.length; i++) {
      const buf = await fetchImageAsBuffer(obs.imageUrls[i]);
      if (buf) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: buf,
                transformation: { width: 450, height: 338 }, // Maintains 4:3 aspect ratio
                type: 'jpg',
              }),
            ],
            spacing: { before: 100, after: 50 },
          })
        );
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `Figure ${i + 1}: Observation Image`, italics: true, size: 18, color: '666666' })],
            spacing: { after: 200 },
          })
        );
      }
    }
  }

  // 5. Audio Recording Section
  if (obs.audioUrl) {
    children.push(
      new Paragraph({ 
        children: [new TextRun({ text: 'Audio Recording', bold: true, size: 24 })], 
        spacing: { before: 200 } 
      })
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Access recording at: ', size: 22 }),
          new ExternalHyperlink({
            children: [
              new TextRun({
                text: "Click here to listen",
                style: "Hyperlink",
                color: "0563C1",
                underline: {},
              }),
            ],
            link: obs.audioUrl,
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  // 6. Generate and Save Document
  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Observation_${obs.villageName || 'Report'}_${obs.id}.docx`);
};