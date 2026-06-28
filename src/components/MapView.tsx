"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { GoogleMap, useJsApiLoader, OverlayView } from "@react-google-maps/api";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import IssueDetail from "./IssueDetail";
import type { Issue } from "@/types";
import { SEVERITY_COLORS, getPulseSpeed, STATUS_COLORS } from "@/types";

const OsmMap = dynamic(() => import("./OsmMap"), { ssr: false });

const MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#2a2f28" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1d20" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#b8956a" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#3d4440" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#4a5d23" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#4a3828" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#1a2a3a" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#2d3a14" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

const libraries: ("places")[] = ["places"];

function IssuePin({ issue, onClick, isSelected, isHovered, onHover }: {
  issue: Issue; onClick: () => void; isSelected: boolean; isHovered: boolean; onHover: (id: string | null) => void;
}) {
  const color = issue.status === "resolved" ? STATUS_COLORS.resolved : SEVERITY_COLORS[issue.severityLevel];
  const pulseSpeed = getPulseSpeed(issue.daysOpen, issue.severity);
  const animDuration = pulseSpeed === "fast" ? "0.8s" : pulseSpeed === "medium" ? "1.5s" : "2.5s";

  return (
    <div
      className="relative cursor-pointer"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onMouseEnter={() => onHover(issue.id)}
      onMouseLeave={() => onHover(null)}
      style={{ transform: "translate(-50%, -100%)" }}
    >
      <div className="pin-ring absolute inset-0" style={{ color, animationDuration: animDuration }} />
      {pulseSpeed !== "slow" && (
        <div className="pin-ring absolute inset-0" style={{ color, animationDuration: animDuration, animationDelay: "0.5s" }} />
      )}
      <div className={`relative w-8 h-9 flex items-center justify-center transition-transform ${isSelected ? "scale-125" : isHovered ? "scale-110" : ""}`}>
        <svg viewBox="0 0 32 36" className="w-full h-full drop-shadow-lg">
          <path d="M16 0 L30 8 V22 L16 36 L2 22 V8 Z" fill={color} stroke="#1a1d20" strokeWidth="1.5" />
          <text x="16" y="20" textAnchor="middle" fill="#1a1d20" fontSize="10" fontWeight="bold" fontFamily="monospace">
            {Math.round(issue.severity)}
          </text>
        </svg>
      </div>
      {isHovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap bg-gunmetal-dark border border-brass px-3 py-2 z-50">
          <p className="font-stencil text-sm text-parchment">{issue.title}</p>
          <p className="font-mono text-[10px] text-amber-glow">SEV {issue.severity.toFixed(1)}/10 — {issue.zone}</p>
        </div>
      )}
    </div>
  );
}

function FallbackMap() {
  const { issues, mapCenter, mapZoom, selectedIssueId, selectIssue, setMapView, newReportPin } = useStore();

  const handleIssueClick = (issue: Issue) => {
    selectIssue(issue.id);
    setMapView(issue.lat, issue.lng, 16);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setMapView(lat, lng, mapZoom + 1);
  };

  return (
    <div className="relative w-full h-full">
      <OsmMap
        center={mapCenter}
        zoom={mapZoom}
        issues={issues}
        selectedIssueId={selectedIssueId}
        newReportPin={newReportPin}
        onIssueClick={handleIssueClick}
        onMapClick={handleMapClick}
      />
      <div className="map-warm-overlay pointer-events-none" />
      <div className="map-vignette pointer-events-none" />
      {/* ✅ FIX 6: Removed the "OPENSTREETMAP MODE" banner */}
      {/* ✅ FIX 4: Removed legend from map — it overlapped with predictive scan panel */}
    </div>
  );
}

export default function MapView() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: apiKey, libraries });

  const { issues, mapCenter, mapZoom, selectedIssueId, selectIssue, setMapView, newReportPin, witnessAlert, setWitnessAlert } = useStore();

  const mapRef = useRef<google.maps.Map | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const selectedIssue = issues.find((i) => i.id === selectedIssueId);

  const onLoad = useCallback((map: google.maps.Map) => { mapRef.current = map; }, []);

  const handlePinClick = (issue: Issue) => {
    selectIssue(issue.id);
    setMapView(issue.lat, issue.lng, 16);
    mapRef.current?.panTo({ lat: issue.lat, lng: issue.lng });
    mapRef.current?.setZoom(16);
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMapView(lat, lng, (mapRef.current?.getZoom() || 14) + 1);
    }
  };

  useEffect(() => {
    if (mapRef.current && selectedIssue) {
      mapRef.current.panTo({ lat: selectedIssue.lat, lng: selectedIssue.lng });
    }
  }, [selectedIssue]);

  if (!apiKey || !isLoaded) {
    return (
      <>
        <FallbackMap />
        <AnimatePresence>
          {selectedIssue && <IssueDetail issue={selectedIssue} onClose={() => selectIssue(null)} />}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={mapCenter}
        zoom={mapZoom}
        onLoad={onLoad}
        onClick={handleMapClick}
        options={{ styles: MAP_STYLES, disableDefaultUI: true, zoomControl: true, zoomControlOptions: { position: 3 }, gestureHandling: "greedy" }}
      >
        {issues.map((issue) => (
          <OverlayView key={issue.id} position={{ lat: issue.lat, lng: issue.lng }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
            <IssuePin issue={issue} onClick={() => handlePinClick(issue)} isSelected={selectedIssueId === issue.id} isHovered={hoveredId === issue.id} onHover={setHoveredId} />
          </OverlayView>
        ))}
        {newReportPin && (
          <OverlayView position={newReportPin} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
            <motion.div initial={{ y: -80, opacity: 0, scale: 0.3 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12 }} style={{ transform: "translate(-50%, -100%)" }}>
              <svg viewBox="0 0 32 36" className="w-10 h-11">
                <path d="M16 0 L30 8 V22 L16 36 L2 22 V8 Z" fill="#c47a2c" stroke="#1a1d20" strokeWidth="1.5" />
              </svg>
            </motion.div>
          </OverlayView>
        )}
      </GoogleMap>
      <div className="map-warm-overlay pointer-events-none" />
      <div className="map-vignette pointer-events-none" />
      <AnimatePresence>
        {witnessAlert && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 bg-gunmetal border-2 border-amber-war px-6 py-3 flex items-center gap-4">
            <p className="font-mono text-xs text-amber-glow">{witnessAlert}</p>
            <button onClick={() => setWitnessAlert(null)} className="game-btn px-3 py-1 text-xs font-stencil">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedIssue && <IssueDetail issue={selectedIssue} onClose={() => selectIssue(null)} />}
      </AnimatePresence>
    </div>
  );
}
