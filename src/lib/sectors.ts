export interface SectorPreset {
  name: string;
  lat: number;
  lng: number;
  zoom: number;
}

export const SECTOR_PRESETS: SectorPreset[] = [
  { name: "Bengaluru, India", lat: 12.9716, lng: 77.5946, zoom: 13 },
  { name: "Mumbai, India", lat: 19.076, lng: 72.8777, zoom: 13 },
  { name: "Delhi, India", lat: 28.6139, lng: 77.209, zoom: 13 },
  { name: "London, UK", lat: 51.5074, lng: -0.1278, zoom: 13 },
  { name: "New York, USA", lat: 40.7128, lng: -74.006, zoom: 13 },
  { name: "Tokyo, Japan", lat: 35.6762, lng: 139.6503, zoom: 13 },
  { name: "São Paulo, Brazil", lat: -23.5505, lng: -46.6333, zoom: 13 },
  { name: "Lagos, Nigeria", lat: 6.5244, lng: 3.3792, zoom: 13 },
];
