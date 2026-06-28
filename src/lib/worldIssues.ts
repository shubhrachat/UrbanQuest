import { generateSeedIssues } from "./seed";
import type { Issue } from "@/types";

const WORLD_HUBS = [
  { lat: 12.9716, lng: 77.5946, zone: "Bengaluru" },
  { lat: 19.076, lng: 72.8777, zone: "Mumbai" },
  { lat: 28.6139, lng: 77.209, zone: "Delhi" },
  { lat: 40.7128, lng: -74.006, zone: "New York" },
  { lat: 51.5074, lng: -0.1278, zone: "London" },
  { lat: 35.6762, lng: 139.6503, zone: "Tokyo" },
  { lat: -23.5505, lng: -46.6333, zone: "São Paulo" },
  { lat: 48.8566, lng: 2.3522, zone: "Paris" },
  { lat: -33.8688, lng: 151.2093, zone: "Sydney" },
  { lat: 25.2048, lng: 55.2708, zone: "Dubai" },
  { lat: 1.3521, lng: 103.8198, zone: "Singapore" },
  { lat: 6.5244, lng: 3.3792, zone: "Lagos" },
];

// Seeded random so world issues are varied but stable per hub
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateWorldIssues(): Issue[] {
  return WORLD_HUBS.flatMap((hub, hubIdx) => {
    const rng = seededRandom(hubIdx * 999 + 42);
    const batch = generateSeedIssues(hub.lat, hub.lng);
    // Shuffle deterministically per hub so each city has different issue order
    const shuffled = [...batch].sort(() => rng() - 0.5).slice(0, 4);
    return shuffled.map((issue, i) => ({
      ...issue,
      id: `world-${hubIdx}-${i}`,
      zone: hub.zone,
      address: `${issue.address.split(",")[0]}, ${hub.zone}`,
    }));
  });
}

// Cached so calling mergeLocalWithWorld multiple times never duplicates
let _worldCache: Issue[] | null = null;

export function mergeLocalWithWorld(localLat: number, localLng: number): Issue[] {
  if (!_worldCache) {
    _worldCache = generateWorldIssues();
  }

  // Generate local issues with stable IDs based on coords (not Date.now())
  const latKey = Math.round(localLat * 1000);
  const lngKey = Math.round(localLng * 1000);
  const local = generateSeedIssues(localLat, localLng).map((issue, i) => ({
    ...issue,
    id: `local-${latKey}-${lngKey}-${i}`,
  }));

  // Deduplicate: world issues that overlap with local coords get dropped
  const localIds = new Set(local.map((i) => i.id));
  const deduped = _worldCache.filter((i) => !localIds.has(i.id));

  return [...local, ...deduped];
}

// Call this when sector changes so local issues refresh for new location
export function resetWorldCache() {
  _worldCache = null;
}
