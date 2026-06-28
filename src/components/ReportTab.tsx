"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import type { IssueCategory } from "@/types";
import { CATEGORY_LABELS } from "@/types";
import { getDefaultImage, fileToBase64 } from "@/lib/images";
import { sfx } from "@/lib/sounds";

const CARD_TYPES = [
  { category: "pothole" as IssueCategory, label: "Road Damage", hint: "Potholes, cracks, sinkholes", icon: "RD" },
  { category: "water_leak" as IssueCategory, label: "Water Systems", hint: "Leaks, flooding, hydrants", icon: "WS" },
  { category: "streetlight" as IssueCategory, label: "Lighting", hint: "Dark streets, broken lamps", icon: "LT" },
  { category: "waste" as IssueCategory, label: "Sanitation", hint: "Dumping, overflow, pests", icon: "SN" },
  { category: "infrastructure" as IssueCategory, label: "Infrastructure", hint: "Rails, signals, shelters", icon: "IF" },
  { category: "other" as IssueCategory, label: "Other Threat", hint: "Vandalism, hazards, misc", icon: "OT" },
];

type Step = "pick" | "area" | "details" | "media" | "analyzing" | "done";

export default function ReportTab() {
  const { addIssue, setNewReportPin, mapCenter } = useStore();
  const [step, setStep] = useState<Step>("pick");
  const [pickedCard, setPickedCard] = useState<number | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [area, setArea] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<IssueCategory>("other");
  const [lat, setLat] = useState(mapCenter.lat);
  const [lng, setLng] = useState(mapCenter.lng);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [analyzeStep, setAnalyzeStep] = useState("");

  // FEATURE: Voice reporting state
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<unknown>(null);

  useEffect(() => {
    const hasSpeech = "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
    setVoiceSupported(hasSpeech);
  }, []);

  const toggleVoice = () => {
    if (!voiceSupported) return;

    if (isListening) {
      (recognitionRef.current as { stop?: () => void } | null)?.stop?.();
      setIsListening(false);
      return;
    }

    const SpeechRecognitionClass = ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) as any;

    if (!SpeechRecognitionClass) return;

    const recognition: any = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setDescription(transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    sfx.click();
  };

  const handlePickCard = (index: number) => {
    if (pickedCard !== null) return;
    sfx.cardPick();
    setPickedCard(index);
    setCategory(CARD_TYPES[index].category);
    setTimeout(() => setStep("area"), 600);
  };

  const handleAreaSubmit = async () => {
    const geocoded = await geocodeArea(area);
    const offset = () => (Math.random() - 0.5) * 0.002;
    const baseLat = geocoded?.lat ?? mapCenter.lat;
    const baseLng = geocoded?.lng ?? mapCenter.lng;
    const newLat = baseLat + offset();
    const newLng = baseLng + offset();
    setLat(newLat);
    setLng(newLng);
    setNewReportPin({ lat: newLat, lng: newLng });
    sfx.click();
    setStep("details");
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        setImageFiles((prev) => [...prev, file]);
        setPreviewImages((prev) => [...prev, URL.createObjectURL(file)]);
      } else if (file.type.startsWith("video/")) {
        setVideoFile(file);
        setPreviewVideo(URL.createObjectURL(file));
      }
    });
  };

  const removeImage = (index: number) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    setPreviewVideo(null);
    setVideoFile(null);
  };

  const handleAnalyze = async () => {
    setStep("analyzing");
    setAnalyzeStep("Transmitting field data...");

    let imageBase64: string | undefined;
    let mimeType: string | undefined;
    if (imageFiles[0]) {
      setAnalyzeStep("Running visual reconnaissance...");
      imageBase64 = await fileToBase64(imageFiles[0]);
      mimeType = imageFiles[0].type;
    }

    setAnalyzeStep("Gemini threat assessment in progress...");

    let aiResult: Record<string, unknown> = {};
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category, area, imageBase64, mimeType }),
      });
      if (res.ok) aiResult = await res.json();
    } catch { /* fallback */ }

    const severity = (aiResult.severity as number) || estimateSeverity(description);
    const images = previewImages.length > 0 ? previewImages : [getDefaultImage(category)];

    addIssue({
      title: title || `${CATEGORY_LABELS[category]} in ${area}`,
      description,
      category,
      lat,
      lng,
      address: area,
      zone: area.split(",")[0] || "Field Sector",
      images,
      video: previewVideo || undefined,
      severity,
      aiCategory: (aiResult.category as string) || CATEGORY_LABELS[category],
      aiCauses: (aiResult.causes as string[]) || ["Field assessment pending"],
      aiLetter: aiResult.letter as string,
      aiSummary: aiResult.summary as string,
      aiConfidence: aiResult.confidence as number,
      aiRecommendedAction: aiResult.recommendedAction as string,
      aiEstimatedFixDays: aiResult.estimatedFixDays as number,
      aiUrgencyLabel: aiResult.urgencyLabel as string,
      hasUserMedia: previewImages.length > 0 || !!previewVideo,
    });

    setStep("done");
    setTimeout(resetForm, 2800);
  };

  const resetForm = () => {
    setStep("pick");
    setPickedCard(null);
    setHoveredCard(null);
    setArea("");
    setTitle("");
    setDescription("");
    setPreviewImages([]);
    setImageFiles([]);
    setPreviewVideo(null);
    setVideoFile(null);
    setIsListening(false);
    (recognitionRef.current as { stop?: () => void } | null)?.stop?.();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-30 bg-gunmetal-dark overflow-hidden">
      <div className="war-table absolute inset-0" />

      <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 pb-20">
        <h2 className="font-ops text-4xl text-parchment tracking-widest mb-2">FIELD REPORT STATION</h2>
        <p className="font-mono text-base text-brass mb-10">Select one mission card — others stay in the deck</p>

        <AnimatePresence mode="wait">
          {step === "pick" && (
            <div className="relative w-full max-w-5xl h-72 flex items-end justify-center" style={{ perspective: "1400px" }}>
              {CARD_TYPES.map((card, i) => {
                const center = (CARD_TYPES.length - 1) / 2;
                const spread = 110;
                const offset = (i - center) * spread;
                const rotation = (i - center) * 4;
                const isPicked = pickedCard === i;
                const isHovered = hoveredCard === i && pickedCard === null;
                const isDimmed = pickedCard !== null && pickedCard !== i;
                const isOtherHovered = hoveredCard !== null && hoveredCard !== i && pickedCard === null;

                return (
                  <motion.button
                    key={card.category}
                    className="mission-card absolute w-40 h-52 rounded-sm flex flex-col"
                    style={{ zIndex: isPicked ? 60 : isHovered ? 50 : 30 - Math.abs(i - 3) }}
                    initial={false}
                    animate={
                      isPicked
                        ? { rotate: 0, x: 0, y: -140, scale: 1.25, opacity: 1 }
                        : isDimmed
                          ? { rotate: rotation * 2, x: offset * 1.8, y: 40, scale: 0.75, opacity: 0.25 }
                          : isHovered
                            ? { rotate: 0, x: offset, y: -110, scale: 1.18, opacity: 1 }
                            : isOtherHovered
                              ? { rotate: rotation, x: offset, y: 12, scale: 0.92, opacity: 0.7 }
                              : { rotate: rotation, x: offset, y: 16, scale: 1, opacity: 1 }
                    }
                    transition={{ type: "spring", stiffness: 300, damping: 26 }}
                    onMouseEnter={() => pickedCard === null && setHoveredCard(i)}
                    onMouseLeave={() => setHoveredCard(null)}
                    onClick={() => handlePickCard(i)}
                  >
                    <div className="px-3 pt-3 pb-2 border-b border-olive-dark/25 bg-parchment/30">
                      <p className="mission-card-label text-left text-base leading-tight">{card.label}</p>
                      <p className="mission-card-hint text-left text-xs mt-1">{card.hint}</p>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <span className="font-ops text-4xl text-olive-dark/70">{card.icon}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}

          {step === "area" && (
            <motion.div key="area" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="mission-card w-full max-w-lg p-8">
              <p className="font-stencil text-xl text-olive-dark tracking-widest mb-4">STEP 1 — MARK SECTOR</p>
              <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Street, landmark, or neighborhood..."
                className="w-full bg-parchment/60 border-2 border-olive-dark/30 px-4 py-4 font-mono text-lg text-gunmetal mb-4" />
              <button onClick={handleAreaSubmit} disabled={!area.trim()} className="game-btn w-full py-4 font-stencil text-xl disabled:opacity-40">Drop Pin On Map</button>
            </motion.div>
          )}

          {step === "details" && (
            <motion.div key="details" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="mission-card w-full max-w-lg p-8">
              <p className="font-stencil text-xl text-olive-dark tracking-widest mb-4">STEP 2 — MISSION BRIEF</p>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Issue title..."
                className="w-full bg-parchment/60 border-2 border-olive-dark/30 px-4 py-4 font-mono text-lg mb-3" />

              {/* FEATURE: Voice input for description */}
              <div className="relative mb-4">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={isListening ? "Listening... speak your report" : "What did you observe?"}
                  rows={4}
                  className={`w-full bg-parchment/60 border-2 px-4 py-4 font-mono text-lg resize-none transition-colors ${
                    isListening ? "border-red-600/60 bg-red-50/10" : "border-olive-dark/30"
                  }`}
                />
                {voiceSupported && (
                  <button
                    onClick={toggleVoice}
                    type="button"
                    className={`absolute bottom-3 right-3 px-3 py-1.5 font-stencil text-xs tracking-widest border transition-all ${
                      isListening
                        ? "border-red-600 text-red-500 bg-red-900/20 animate-pulse"
                        : "border-olive-dark/40 text-olive-dark hover:border-olive-dark"
                    }`}
                  >
                    {isListening ? "STOP REC" : "VOICE"}
                  </button>
                )}
                {isListening && (
                  <div className="absolute top-3 left-3 flex gap-0.5 items-end h-4">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-0.5 bg-red-500 rounded-full"
                        animate={{ height: ["4px", "14px", "4px"] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.08 }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <button onClick={() => setStep("media")} disabled={!description.trim()} className="game-btn w-full py-4 font-stencil text-xl disabled:opacity-40">Continue</button>
            </motion.div>
          )}

          {step === "media" && (
            <motion.div key="media" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="mission-card w-full max-w-lg p-8">
              <p className="font-stencil text-xl text-olive-dark tracking-widest mb-2">STEP 3 — FIELD EVIDENCE</p>
              <p className="font-mono text-sm text-olive-dark/70 mb-4">Photos & video optional — standard recon image used if skipped</p>

              <label className="block border-2 border-dashed border-olive-dark/40 p-6 text-center cursor-pointer hover:border-olive mb-2">
                <span className="font-mono text-base text-olive-dark block">Upload Photos</span>
                <span className="font-mono text-xs text-olive-dark/50 mt-1 block">JPG, PNG, WEBP</span>
                <input type="file" accept="image/*" multiple capture="environment" onChange={handleMediaUpload} className="hidden" />
              </label>

              <label className="block border-2 border-dashed border-olive-dark/40 p-6 text-center cursor-pointer hover:border-olive mb-4">
                <span className="font-mono text-base text-olive-dark block">Upload Video</span>
                <span className="font-mono text-xs text-olive-dark/50 mt-1 block">MP4, MOV, WEBM</span>
                <input type="file" accept="video/*" capture="environment" onChange={handleMediaUpload} className="hidden" />
              </label>

              {previewImages.length > 0 && (
                <div className="flex gap-3 mb-4 flex-wrap">
                  {previewImages.map((src, i) => (
                    <div key={i} className="relative">
                      <img src={src} alt="" className="w-20 h-20 object-cover border-2 border-olive" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-700 text-white text-xs rounded-full flex items-center justify-center"
                      >X</button>
                    </div>
                  ))}
                </div>
              )}

              {previewVideo && (
                <div className="mb-4 relative">
                  <video
                    src={previewVideo}
                    className="w-full max-h-48 object-cover border-2 border-olive"
                    controls
                    playsInline
                  />
                  <button
                    onClick={removeVideo}
                    className="absolute top-2 right-2 bg-red-700 text-white text-xs px-2 py-1 font-mono"
                  >Remove</button>
                </div>
              )}

              <button onClick={handleAnalyze} className="game-btn w-full py-4 font-stencil text-xl">Transmit — Run Assessment</button>
            </motion.div>
          )}

          {step === "analyzing" && (
            <motion.div key="analyzing" className="crt-screen p-14 text-center min-w-md powering-on">
              <p className="font-stencil text-3xl text-amber-glow tracking-widest mb-4">FIELD ANALYSIS</p>
              <p className="font-mono text-lg text-parchment">{analyzeStep}</p>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div key="done" initial={{ scale: 0.7 }} animate={{ scale: 1 }} className="text-center">
              <motion.svg viewBox="0 0 32 36" className="w-20 h-24 mx-auto mb-6" animate={{ y: [0, -16, 0] }} transition={{ repeat: 2, duration: 0.6 }}>
                <path d="M16 0 L30 8 V22 L16 36 L2 22 V8 Z" fill="#8b2e2e" stroke="#1a1d20" strokeWidth="1.5" />
              </motion.svg>
              <p className="font-stencil text-4xl text-amber-glow">PIN DEPLOYED</p>
              <p className="font-mono text-base text-parchment/60 mt-3">Opening terrain with your evidence...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function estimateSeverity(desc: string): number {
  const lower = desc.toLowerCase();
  if (["dangerous", "flooding", "collapse", "critical"].some((w) => lower.includes(w))) return 8;
  if (["broken", "damaged", "leak"].some((w) => lower.includes(w))) return 5;
  return 3;
}

async function geocodeArea(query: string): Promise<{ lat: number; lng: number } | null> {
  if (!query.trim()) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "en" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data[0]) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}
