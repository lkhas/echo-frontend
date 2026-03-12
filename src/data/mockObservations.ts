export interface Observation {
  id: string;
  observationType: 'environmental' | 'social' | 'health' | 'infrastructure' | 'education';
  villageName: string;
  description: string;
  hasAudio: boolean;
  audioUrl?: string;
  imageCount: number;
  imageUrls: string[];
  latitude: number;
  longitude: number;
  accuracy: number;
  createdAt: string;
  status: 'pending' | 'in_review' | 'resolved';
}
