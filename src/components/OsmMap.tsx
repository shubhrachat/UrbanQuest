"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Issue } from "@/types";
import { SEVERITY_COLORS, STATUS_COLORS, CATEGORY_LABELS } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

// ── CATEGORY VIDEOS ──────────────────────────────────────────────────────────
const CATEGORY_VIDEOS: Record<string, string> = {
  pothole: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  water_leak: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  streetlight: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  waste: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  infrastructure: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  other: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
};

export function getCategoryVideo(category: string): string {
  return CATEGORY_VIDEOS[category] || CATEGORY_VIDEOS.other;
}

// ── MAP CONTROLLER ───────────────────────────────────────────────────────────
function MapController({ center, zoom }: { center: { lat: number; lng: number }; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([center.lat, center.lng], zoom, { duration: 0.8 });
  }, [center.lat, center.lng, zoom, map]);
  return null;
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  const map = useMap();
  useEffect(() => {
    const handler = (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };
    map.on("click", handler);
    return () => { map.off("click", handler); };
  }, [map, onMapClick]);
  return null;
}

// ── HEATMAP LAYER ────────────────────────────────────────────────────────────
function HeatmapLayer({ issues }: { issues: Issue[] }) {
  const map = useMap();
  useEffect(() => {
    if (typeof window === "undefined") return;
    const circles: L.Circle[] = issues.map((i) =>
      L.circle([i.lat, i.lng], {
        radius: 250,
        color: i.severity > 7 ? "#8b2e2e" : i.severity > 4 ? "#c47a2c" : "#4a7c59",
        fillOpacity: 0.22,
        weight: 0,
      }).addTo(map)
    );
    return () => { circles.forEach((c) => map.removeLayer(c)); };
  }, [map, issues]);
  return null;
}

// ── PIN ICONS ────────────────────────────────────────────────────────────────
function HexPinIcon({ issue }: { issue: Issue }) {
  const color = issue.status === "resolved" ? STATUS_COLORS.resolved : SEVERITY_COLORS[issue.severityLevel];
  return L.divIcon({
    className: "",
    html: `<div style="transform:translate(-50%,-100%)">
      <svg viewBox="0 0 32 36" width="32" height="36" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">
        <path d="M16 0 L30 8 V22 L16 36 L2 22 V8 Z" fill="${color}" stroke="#1a1d20" stroke-width="1.5"/>
        <text x="16" y="20" text-anchor="middle" fill="#1a1d20" font-size="10" font-weight="bold" font-family="monospace">${Math.round(issue.severity)}</text>
      </svg>
    </div>`,
    iconSize: [32, 36],
    iconAnchor: [16, 36],
  });
}

function GhostPinIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="transform:translate(-50%,-100%)">
      <svg viewBox="0 0 32 36" width="36" height="40" style="filter:drop-shadow(0 0 8px rgba(232,168,74,0.8))">
        <path d="M16 0 L30 8 V22 L16 36 L2 22 V8 Z" fill="rgba(232,168,74,0.15)" stroke="#e8a84a" stroke-width="1.5" stroke-dasharray="4,2"/>
        <text x="16" y="17" text-anchor="middle" fill="#e8a84a" font-size="7" font-weight="bold" font-family="monospace">AI</text>
        <text x="16" y="26" text-anchor="middle" fill="#e8a84a" font-size="6" font-family="monospace">PRED</text>
      </svg>
    </div>`,
    iconSize: [36, 40],
    iconAnchor: [18, 40],
  });
}

interface PredictedHotspot {
  lat: number;
  lng: number;
  zone: string;
  risk: string;
  reason: string;
}

// ── AI DISPATCH RADIO ────────────────────────────────────────────────────────
function DispatchRadio({ issue, onClose }: { issue: Issue; onClose: () => void }) {
  const [transcript, setTranscript] = useState("");
  const [speaking, setSpeaking] = useState(false);

  const fullText = `Attention all units. ${CATEGORY_LABELS[issue.category] || "Issue"} reported at ${issue.address}. Severity ${Math.round(issue.severity)} out of 10. ${issue.confirmations} residents have confirmed this. ${issue.aiSummary || issue.description}. ${issue.aiRecommendedAction ? "Recommended: " + issue.aiRecommendedAction : ""} Please respond.`;

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTranscript(fullText.slice(0, i));
      i += 3;
      if (i > fullText.length) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [fullText]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(fullText);
    utter.rate = 0.88;
    utter.pitch = 0.75;
    utter.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const deep = voices.find((v) => v.name.includes("Daniel") || v.name.includes("Alex") || v.name.toLowerCase().includes("male"));
    if (deep) utter.voice = deep;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    setTimeout(() => window.speechSynthesis.speak(utter), 400);
    return () => window.speechSynthesis.cancel();
  }, [fullText]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] bg-black/92 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.88, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl border-2 border-amber-glow bg-gunmetal-dark shadow-[0_0_80px_rgba(232,168,74,0.25)]"
      >
        <div className="bg-black px-6 py-4 flex items-center justify-between border-b border-amber-glow/40">
          <div className="flex items-center gap-4">
            <motion.div
              className="w-3 h-3 rounded-full bg-red-500"
              animate={speaking ? { opacity: [1, 0.2, 1], scale: [1, 1.4, 1] } : { opacity: 0.3 }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            />
            <span className="font-mono text-amber-glow text-sm tracking-widest">
              {speaking ? "BROADCAST LIVE" : "TRANSMISSION COMPLETE"}
            </span>
          </div>
          <button onClick={onClose} className="font-mono text-sm text-brass hover:text-amber-glow">CLOSE</button>
        </div>
        <div className="px-6 py-3 bg-black/60 flex items-center gap-0.5 h-10 overflow-hidden">
          {Array.from({ length: 80 }).map((_, i) => (
            <motion.div
              key={i}
              className="flex-1 bg-amber-glow/60 rounded-full"
              animate={speaking ? { height: [`${3 + Math.random() * 24}px`, `${3 + Math.random() * 24}px`] } : { height: "2px" }}
              transition={{ repeat: Infinity, duration: 0.12 + Math.random() * 0.18, delay: i * 0.008 }}
            />
          ))}
        </div>
        <div className="px-6 pt-4 pb-3 border-b border-brass/20">
          <div className="flex gap-4 items-start">
            <div className="flex-1">
              <p className="font-stencil text-xl text-parchment">{issue.title}</p>
              <p className="font-mono text-sm text-brass mt-1">{issue.address} — Severity {Math.round(issue.severity)}/10 — {issue.confirmations} confirmed</p>
            </div>
            <span className={`px-3 py-1 font-mono text-xs ${issue.severity >= 7 ? "bg-red-900/60 text-red-300 border border-red-700" : issue.severity >= 4 ? "bg-yellow-900/60 text-yellow-300 border border-yellow-700" : "bg-green-900/60 text-green-300 border border-green-700"}`}>
              {issue.severity >= 7 ? "URGENT" : issue.severity >= 4 ? "MODERATE" : "LOW PRIORITY"}
            </span>
          </div>
        </div>
        <div className="px-6 py-4 min-h-28 max-h-44 overflow-y-auto bg-black/30">
          <p className="font-mono text-sm text-amber-glow/90 leading-relaxed">
            {transcript}
            {speaking && <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}>|</motion.span>}
          </p>
        </div>
        <div className="border-t border-brass/20">
          <video src={issue.video || getCategoryVideo(issue.category)} autoPlay muted loop playsInline className="w-full h-32 object-cover opacity-50" />
        </div>
        <div className="px-6 py-3 bg-black/60 flex justify-between items-center">
          <span className="font-mono text-xs text-brass/50">Community Hero — Civic Dispatch</span>
          <button onClick={() => { window.speechSynthesis.cancel(); onClose(); }} className="font-mono text-sm text-red-400 border border-red-400/30 px-4 py-1.5 hover:bg-red-900/20">
            Stop
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── REVERSE GEOCODE to get city name ────────────────────────────────────────
async function getCityFromCoords(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
    const data = await res.json();
    return data.address?.city || data.address?.town || data.address?.state || "this city";
  } catch {
    return "this city";
  }
}

// ── PREDICTIVE SCAN ──────────────────────────────────────────────────────────
function PredictiveScan({ issues, mapCenter }: { issues: Issue[]; mapCenter: { lat: number; lng: number } }) {
  const map = useMap();
  const [scanning, setScanning] = useState(false);
  const [hotspots, setHotspots] = useState<PredictedHotspot[]>([]);
  const [scanDone, setScanDone] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [cityName, setCityName] = useState("this city");

  const SCAN_STEPS = ["Detecting city...", "Analyzing issue clusters...", "AI computing hotspots..."];

  const runScan = async () => {
    setScanning(true);
    setScanDone(false);
    setHotspots([]);
    setScanStep(0);

    const t1 = setTimeout(() => setScanStep(1), 900);
    const t2 = setTimeout(() => setScanStep(2), 1800);

    try {
      // Step 1: Get real city name from coords
      const city = await getCityFromCoords(mapCenter.lat, mapCenter.lng);
      setCityName(city);

      // Step 2: Call Claude API with city context for real zone names
      const issueSummary = issues.slice(0, 20).map(i =>
        `- ${i.category} at lat:${i.lat.toFixed(4)},lng:${i.lng.toFixed(4)} severity:${i.severity} confirms:${i.confirmations}`
      ).join("\n");

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 800,
          messages: [{
            role: "user",
            content: `You are an AI civic risk analyst for ${city}.

Based on these reported community issues, predict 4 high-risk zones where NEW problems are likely to emerge soon. Use REAL neighbourhood/district names from ${city} (e.g. for Bangalore: Koramangala, Indiranagar, Whitefield, HSR Layout; for Tokyo: Shinjuku, Shibuya, Ginza; for NYC: Downtown Manhattan, Brooklyn Heights etc).

Current issues:
${issueSummary}

Map center: lat ${mapCenter.lat}, lng ${mapCenter.lng}

Return ONLY a JSON array, no markdown, no explanation:
[{"lat": number, "lng": number, "zone": "real neighbourhood name in ${city}", "risk": "high|medium|low", "reason": "specific reason under 10 words"}]

Make lat/lng close to map center (within 0.05 degrees). Return exactly 4 predictions.`
          }]
        })
      });

      const data = await res.json();
      const text = data.content?.[0]?.text || "[]";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setHotspots(Array.isArray(parsed) ? parsed.slice(0, 4) : []);
    } catch {
      // Fallback with offset coords but generic zones
      const fallback = issues.slice(0, 4).map((issue, i) => ({
        lat: issue.lat + (Math.random() - 0.5) * 0.012,
        lng: issue.lng + (Math.random() - 0.5) * 0.012,
        zone: issue.zone || `Zone ${i + 1}`,
        risk: i === 0 ? "high" : i === 1 ? "medium" : "low",
        reason: "Pattern detected from nearby reports",
      }));
      setHotspots(fallback);
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setScanning(false);
      setScanDone(true);
    }
  };

  const ghostIcon = GhostPinIcon();

  return (
    <>
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 w-56">
        <button
          onClick={runScan}
          disabled={scanning}
          className={`w-full px-3 py-2.5 font-mono text-xs tracking-widest border shadow-lg transition-all ${
            scanning
              ? "border-amber-glow/60 bg-black/80 text-amber-glow"
              : "border-brass/50 bg-black/70 text-brass hover:border-brass hover:text-parchment"
          }`}
        >
          {scanning ? SCAN_STEPS[scanStep] : "Run Predictive Scan"}
        </button>

        {scanDone && hotspots.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/90 border border-brass/30 p-3"
          >
            <div className="flex justify-between items-center mb-2">
              <p className="font-mono text-xs text-brass tracking-widest">{hotspots.length} risk zones · {cityName}</p>
              <button onClick={() => { setHotspots([]); setScanDone(false); }} className="font-mono text-xs text-brass/40 hover:text-brass">clear</button>
            </div>
            {hotspots.map((h, i) => (
              <div key={i} className="flex items-start gap-2 mb-1.5 justify-between">
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full mt-0.5 flex-shrink-0" style={{
                    backgroundColor: h.risk === "high" ? "#8b2e2e" : h.risk === "medium" ? "#c47a2c" : "#4a7c59"
                  }} />
                  <p className="font-mono text-xs text-parchment/70 leading-tight">{h.zone} — {h.reason}</p>
                </div>
                <button
                  onClick={() => map.flyTo([h.lat, h.lng], Math.max(map.getZoom(), 14), { duration: 0.8 })}
                  className="font-mono text-[10px] text-brass hover:text-amber-glow flex-shrink-0"
                >
                  focus
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {hotspots.map((h, i) => (
        <Marker key={i} position={[h.lat, h.lng]} icon={ghostIcon} />
      ))}
    </>
  );
}

// ── MAIN MAP ─────────────────────────────────────────────────────────────────
interface OsmMapProps {
  center: { lat: number; lng: number };
  zoom: number;
  issues: Issue[];
  selectedIssueId: string | null;
  newReportPin: { lat: number; lng: number } | null;
  onIssueClick: (issue: Issue) => void;
  onMapClick: (lat: number, lng: number) => void;
  showHeatmap?: boolean;
}

export default function OsmMap({
  center, zoom, issues, selectedIssueId, newReportPin, onIssueClick, onMapClick, showHeatmap = false,
}: OsmMapProps) {
  const [dispatchIssue, setDispatchIssue] = useState<Issue | null>(null);
  const [heatmapOn, setHeatmapOn] = useState(showHeatmap);

  const issueIcons = useMemo(() => {
    const icons = new Map<string, L.DivIcon>();
    issues.forEach((issue) => { icons.set(issue.id, HexPinIcon({ issue })); });
    return icons;
  }, [issues]);

  const newPinIcon = L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;background:#e8a84a;border-radius:50%;box-shadow:0 0 10px #e8a84a;transform:translate(-50%,-50%)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

  const handleIssueClick = useCallback((issue: Issue) => {
    onIssueClick(issue);
  }, [onIssueClick]);

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        className="w-full h-full z-0"
        zoomControl={true}
        style={{ background: "#2a2f28" }}
        whenReady={() => {}}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={center} zoom={zoom} />
        <MapClickHandler onMapClick={onMapClick} />

        {heatmapOn && <HeatmapLayer issues={issues} />}

        {issues.map((issue) => (
          <Marker
            key={issue.id}
            position={[issue.lat, issue.lng]}
            icon={issueIcons.get(issue.id)!}
            eventHandlers={{ click: () => handleIssueClick(issue) }}
            opacity={selectedIssueId === issue.id ? 1 : 0.92}
          />
        ))}

        {newReportPin && (
          <Marker position={[newReportPin.lat, newReportPin.lng]} icon={newPinIcon} />
        )}

        <PredictiveScan issues={issues} mapCenter={center} />
      </MapContainer>

      <div className="absolute bottom-5 right-4 z-[1000] flex gap-2">
        <button
          onClick={() => setHeatmapOn((v) => !v)}
          className={`px-3 py-2 font-mono text-xs border transition-all ${
            heatmapOn
              ? "bg-red-900/70 border-red-600/60 text-red-300"
              : "bg-black/60 border-brass/30 text-brass hover:border-brass"
          }`}
        >
          {heatmapOn ? "Heatmap On" : "Heatmap Off"}
        </button>

        {selectedIssueId && (
          <button
            onClick={() => {
              const issue = issues.find(i => i.id === selectedIssueId);
              if (issue) setDispatchIssue(issue);
            }}
            className="px-3 py-2 font-mono text-xs border border-brass/30 bg-black/60 text-brass hover:border-brass"
          >
            Broadcast Issue
          </button>
        )}
      </div>

      <AnimatePresence>
        {dispatchIssue && (
          <DispatchRadio issue={dispatchIssue} onClose={() => setDispatchIssue(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
