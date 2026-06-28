"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { SECTOR_PRESETS } from "@/lib/sectors";

interface CityResult {
  name: string;
  lat: number;
  lng: number;
  display: string;
}

export default function LocationPicker() {
  const { showLocationPicker, setShowLocationPicker, changeSector, sectorName } =
    useStore();
  const [customLat, setCustomLat] = useState("");
  const [customLng, setCustomLng] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [citySearch, setCitySearch] = useState("");
  const [cityResults, setCityResults] = useState<CityResult[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [cityError, setCityError] = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!showLocationPicker) return null;

  const handleGPS = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        changeSector(
          pos.coords.latitude,
          pos.coords.longitude,
          `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
          14
        );
        setGpsLoading(false);
        setShowLocationPicker(false);
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError("Location access denied. Please allow location in your browser settings.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGpsError("Location unavailable. Try entering coordinates manually.");
        } else {
          setGpsError("Could not get location. Try again or enter coordinates.");
        }
      },
      { timeout: 10000, maximumAge: 0, enableHighAccuracy: true }
    );
  };

  const handleCitySearch = (value: string) => {
    setCitySearch(value);
    setCityError(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (value.trim().length < 2) {
      setCityResults([]);
      return;
    }
    setCityLoading(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        if (data.length === 0) {
          setCityError("No results found. Try a different name.");
          setCityResults([]);
        } else {
          setCityResults(
            data.map((r: { display_name: string; lat: string; lon: string }) => ({
              name: r.display_name.split(",")[0],
              display: r.display_name.split(",").slice(0, 3).join(", "),
              lat: parseFloat(r.lat),
              lng: parseFloat(r.lon),
            }))
          );
        }
      } catch {
        setCityError("Search failed. Check your connection.");
      } finally {
        setCityLoading(false);
      }
    }, 500);
  };

  const handleCustom = () => {
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      changeSector(lat, lng, `${lat.toFixed(4)}, ${lng.toFixed(4)}`, 13);
      setShowLocationPicker(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1200] bg-black/70 flex items-center justify-center p-4"
        onClick={() => setShowLocationPicker(false)}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gunmetal border-2 border-brass w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          <h3 className="font-ops text-2xl text-parchment tracking-widest mb-1">
            RELOCATE SECTOR
          </h3>
          <p className="font-mono text-base text-brass mb-6">
            Current: {sectorName}
          </p>

          {/* GPS */}
          <button
            onClick={handleGPS}
            disabled={gpsLoading}
            className="game-btn w-full py-4 font-stencil text-xl mb-2 disabled:opacity-60"
          >
            {gpsLoading ? "ACQUIRING SIGNAL..." : "📍 Use My GPS Location"}
          </button>
          {gpsError && (
            <p className="font-mono text-sm text-red-400 mb-4 border border-red-400/30 px-3 py-2">
              ⚠ {gpsError}
            </p>
          )}
          {!gpsError && <div className="mb-4" />}

          {/* City search */}
          <p className="font-stencil text-sm text-brass tracking-widest mb-2">
            OR SEARCH ANY CITY
          </p>
          <div className="relative mb-2">
            <input
              value={citySearch}
              onChange={(e) => handleCitySearch(e.target.value)}
              placeholder="Type any city — Hyderabad, Paris, Lagos..."
              className="w-full bg-gunmetal-dark border border-brass/40 px-3 py-3 font-mono text-base text-parchment"
            />
            {cityLoading && (
              <span className="absolute right-3 top-3 font-mono text-xs text-brass animate-pulse">
                SCANNING...
              </span>
            )}
          </div>
          {cityError && (
            <p className="font-mono text-xs text-red-400 mb-2">{cityError}</p>
          )}
          {cityResults.length > 0 && (
            <div className="border border-brass/30 mb-4 divide-y divide-brass/10">
              {cityResults.map((r, i) => (
                <button
                  key={i}
                  onClick={() => {
                    changeSector(r.lat, r.lng, r.name, 13);
                    setShowLocationPicker(false);
                  }}
                  className="w-full text-left px-3 py-3 hover:bg-olive-dark/30 transition-colors"
                >
                  <span className="font-stencil text-base text-parchment block">{r.name}</span>
                  <span className="font-mono text-xs text-brass">{r.display}</span>
                </button>
              ))}
            </div>
          )}

          {/* Preset cities */}
          <p className="font-stencil text-sm text-brass tracking-widest mb-3">
            OR SELECT CITY
          </p>
          <div className="grid grid-cols-2 gap-2 mb-6 max-h-48 overflow-y-auto">
            {SECTOR_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  changeSector(preset.lat, preset.lng, preset.name, preset.zoom);
                  setShowLocationPicker(false);
                }}
                className="text-left border border-brass/30 px-3 py-3 hover:border-amber-glow hover:bg-olive-dark/30 transition-colors"
              >
                <span className="font-stencil text-base text-parchment block">
                  {preset.name.split(",")[0]}
                </span>
                <span className="font-mono text-xs text-brass">
                  {preset.name.split(",")[1]?.trim()}
                </span>
              </button>
            ))}
          </div>

          {/* Coordinates */}
          <p className="font-stencil text-sm text-brass tracking-widest mb-2">
            OR ENTER COORDINATES
          </p>
          <div className="flex gap-2 mb-4">
            <input
              value={customLat}
              onChange={(e) => setCustomLat(e.target.value)}
              placeholder="Latitude"
              className="flex-1 bg-gunmetal-dark border border-brass/40 px-3 py-3 font-mono text-base text-parchment"
            />
            <input
              value={customLng}
              onChange={(e) => setCustomLng(e.target.value)}
              placeholder="Longitude"
              className="flex-1 bg-gunmetal-dark border border-brass/40 px-3 py-3 font-mono text-base text-parchment"
            />
          </div>
          <button
            onClick={handleCustom}
            className="w-full py-3 border border-brass font-stencil text-lg text-parchment hover:border-amber-glow"
          >
            Jump To Coordinates
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
