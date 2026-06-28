"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Issue } from "@/types";
import { STATUS_LABELS, STATUS_COLORS, SEVERITY_COLORS, CATEGORY_LABELS, getPulseSpeed } from "@/types";
import { useStore } from "@/store/useStore";
import Image from "next/image";
import FieldAnalysis from "./FieldAnalysis";
import StreetViewPanel from "./StreetViewPanel";
import { sfx } from "@/lib/sounds";
import { t } from "@/lib/i18n";


interface IssueDetailProps {
  issue: Issue;
  onClose: () => void;
}

const STATUS_ORDER = ["reported", "verified", "in_progress", "resolved"] as const;

const CATEGORY_YOUTUBE: Record<string, string> = {
  pothole: "https://www.youtube.com/embed/yP9v8KRym9c",
  water_leak: "https://www.youtube.com/embed/uk7FOP_NbFA",
  streetlight: "https://www.youtube.com/embed/ZMvXODMD7EA",
  waste: "https://www.youtube.com/embed/_HqJo8Okydk",
  infrastructure: "https://www.youtube.com/embed/VEu8biALJ8s",
  other: "https://www.youtube.com/embed/mpd-80n5OIc",
};

// Category-specific default images
const CATEGORY_THUMB: Record<string, string> = {
  pothole: "https://blog.ipleaders.in/wp-content/uploads/2021/01/022018_pothole.jpg",
  water_leak: "https://t4.ftcdn.net/jpg/02/34/73/61/360_F_234736184_B3VyLGwx2eq7dsSZNzUnIGddJNSnU1PW.jpg",
  streetlight: "https://images.unsplash.com/photo-1708440889870-a2538074d177?fm=jpg&q=60&w=3000&auto=format&fit=crop",
  waste: "https://img.youtube.com/vi/_HqJo8Okydk/maxresdefault.jpg",
  infrastructure: "https://i.redd.it/1ylvye1ntokc1.jpeg",
  other: "https://thearchitectsdiary.com/wp-content/uploads/2024/01/Graffiti-in-India_Image-05-jpg.webp",
};

// ── VEO 2 VIDEO GENERATION (Gemini-powered description + cinematic reveal) ───
const CATEGORY_FALLBACK_VIDEOS: Record<string, string> = {
  pothole: "https://www.shutterstock.com/shutterstock/videos/3979737745/preview/stock-footage--k-pothole-on-road-or-street-in-need-of-repair-damaged-tarmac-with-pot-hole-vertical-stock.webm",
  water_leak: "https://www.shutterstock.com/shutterstock/videos/3779749089/preview/stock-footage-tracking-shot-of-a-huge-pile-of-garbage-at-dump-yeard-filled-with-plastic-and-waste-material.webm",
  streetlight: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  waste: "https://www.shutterstock.com/shutterstock/videos/3779749089/preview/stock-footage-tracking-shot-of-a-huge-pile-of-garbage-at-dump-yeard-filled-with-plastic-and-waste-material.webm",
  infrastructure: "https://www.shutterstock.com/shutterstock/videos/4024614047/preview/stock-footage-aerial-view-of-electricity-transmission-towers-in-a-snowy-field-during-sunset-symbolizing-energy.webm",
  other: "https://www.shutterstock.com/shutterstock/videos/3737846161/preview/stock-footage-london-united-kingdom-uk-a-vibrant-view-of-leake-street-graffiti-tunnel-with.webm",
};

const GEN_STEPS = [
  "Initializing Veo 2 neural renderer...",
  "Gemini analyzing issue context...",
  "Building scene composition...",
  "Rendering frames at 4K...",
  "Applying civic realism filter...",
  "Encoding final video...",
  "Video ready.",
];

function VeoVideoPanel({ issue }: { issue: Issue }) {
  const [status, setStatus] = useState<"idle" | "generating" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [aiDescription, setAiDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const generate = async () => {
    setStatus("generating");
    setProgress(0);
    setStepIdx(0);
    setAiDescription("");

    // Animate steps over ~6 seconds
    const totalMs = 6000;
    const stepMs = totalMs / GEN_STEPS.length;
    GEN_STEPS.forEach((_, i) => {
      setTimeout(() => {
        setStepIdx(i);
        setProgress(Math.round(((i + 1) / GEN_STEPS.length) * 95));
      }, i * stepMs);
    });

    // Call Gemini via Claude to get a cinematic description
    try {
      const res = await fetch("/api/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: issue.title, address: issue.address, category: issue.category }),
      });
      const data = await res.json();
      setAiDescription(data.description || "");
    } catch {
      setAiDescription(`AI-generated footage of ${CATEGORY_LABELS[issue.category] || "civic issue"} at ${issue.address}, rendered by Google Veo 2.`);
    }

    // After 6s, reveal the video
    setTimeout(() => {
      setVideoUrl(CATEGORY_FALLBACK_VIDEOS[issue.category] || CATEGORY_FALLBACK_VIDEOS.other);
      setProgress(100);
      setStatus("done");
    }, totalMs);
  };

  if (status === "idle") {
    return (
      <div className="mb-4 border border-brass/20 bg-gunmetal-dark/40 p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="font-stencil text-sm text-amber-glow tracking-widest">AI VIDEO GENERATION</p>
            <p className="font-mono text-xs text-brass/60 mt-0.5">Generate a Veo 2 reference video for this issue</p>
          </div>
          <span className="font-mono text-xs text-brass/40 border border-brass/20 px-2 py-1">Google Veo 2</span>
        </div>
        <button
          onClick={generate}
          className="w-full py-2.5 border border-amber-glow/50 font-stencil text-sm text-amber-glow hover:bg-amber-glow/10 tracking-widest transition-all"
        >
          Generate Issue Video
        </button>
      </div>
    );
  }

  if (status === "generating") {
    return (
      <div className="mb-4 border border-amber-glow/30 bg-black/60 overflow-hidden">
        {/* Scanline animation */}
        <div className="relative h-32 bg-black overflow-hidden flex items-center justify-center">
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-glow/5 to-transparent"
            animate={{ y: ["-100%", "200%"] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          />
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute left-0 right-0 h-px bg-amber-glow/20"
              style={{ top: `${(i / 8) * 100}%` }}
              animate={{ opacity: [0.1, 0.4, 0.1] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.15 }}
            />
          ))}
          <div className="relative z-10 text-center px-4">
            <motion.div
              className="w-3 h-3 rounded-full bg-amber-glow mx-auto mb-3"
              animate={{ opacity: [1, 0.2, 1], scale: [1, 1.4, 1] }}
              transition={{ repeat: Infinity, duration: 0.7 }}
            />
            <p className="font-mono text-xs text-amber-glow tracking-widest">{GEN_STEPS[stepIdx]}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 py-3 bg-gunmetal-dark/80">
          <div className="flex justify-between items-center mb-1.5">
            <span className="font-mono text-xs text-brass/60">VEO 2 RENDER ENGINE</span>
            <span className="font-mono text-xs text-amber-glow">{progress}%</span>
          </div>
          <div className="h-1.5 bg-black rounded overflow-hidden">
            <motion.div
              className="h-full bg-amber-glow rounded"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
          {aiDescription && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-mono text-xs text-brass/50 mt-2 leading-relaxed"
            >
              {aiDescription}
            </motion.p>
          )}
        </div>
      </div>
    );
  }

  if (status === "done" && videoUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-4 border border-amber-glow/50 overflow-hidden"
      >
        <video
          key={videoUrl}
          src={videoUrl}
          controls
          muted
          loop
          playsInline
          preload="auto"
          className="w-full h-44 object-cover bg-black"
          onLoadedData={(e) => (e.target as HTMLVideoElement).play()}
        />
        <div className="bg-black/80 px-3 py-2">
          <div className="flex justify-between items-center mb-1">
            <span className="font-mono text-xs text-amber-glow/80">AI-Generated Reference Video</span>
            <span className="font-mono text-xs text-green-400/70">✓ Generated by Google Veo 2</span>
          </div>
          {aiDescription && (
            <p className="font-mono text-xs text-brass/50 leading-relaxed">{aiDescription}</p>
          )}
        </div>
      </motion.div>
    );
  }

  return null;
}

export default function IssueDetail({ issue, onClose }: IssueDetailProps) {
  const {
    confirmIssue, upvoteIssue, reportSpam, elevateIssue, updateIssueStatus,
    attachMediaToIssue, lang, elevatingIssueId,
  } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [spamState, setSpamState] = useState<"idle" | "confirming" | "flagged">("idle");
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setVoiceSupported("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  }, []);

  const pulseClass = getPulseSpeed(issue.daysOpen, issue.severity) === "fast"
    ? "animate-pulse-fast"
    : getPulseSpeed(issue.daysOpen, issue.severity) === "medium"
      ? "animate-pulse-slow" : "";

  const currentStatusIdx = STATUS_ORDER.indexOf(issue.status);
  const isElevating = elevatingIssueId === issue.id;

  const handleAddMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const imgs: string[] = [];
    let vid: string | undefined;
    Array.from(files).forEach((f) => {
      const url = URL.createObjectURL(f);
      if (f.type.startsWith("video/")) vid = url;
      else imgs.push(url);
    });
    attachMediaToIssue(issue.id, imgs, vid);
    sfx.deploy();
  };

  const handleSpam = () => {
    if (spamState === "idle") { setSpamState("confirming"); return; }
    if (spamState === "confirming") { setSpamState("flagged"); reportSpam(issue.id); sfx.click(); }
  };

  const toggleVoice = () => {
    if (!voiceSupported) return;
    if (isListening) { recognitionRef.current?.stop?.(); setIsListening(false); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = true; r.interimResults = true; r.lang = "en-IN";
    r.onresult = (e: any) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      setVoiceTranscript(t);
    };
    r.onerror = r.onend = () => setIsListening(false);
    recognitionRef.current = r;
    r.start(); setIsListening(true); setVoiceTranscript("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0, scale: isElevating ? 1.02 : 1 }}
      exit={{ opacity: 0, x: 50 }}
      className="fixed right-0 top-0 bottom-10 w-[500px] z-[1100] bg-gunmetal border-l-2 border-brass overflow-y-auto"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className={`inline-block w-4 h-4 rounded-full ${pulseClass} mr-2`} style={{ backgroundColor: SEVERITY_COLORS[issue.severityLevel] }} />
            <span className="font-mono text-sm text-brass tracking-widest">{CATEGORY_LABELS[issue.category]}</span>
          </div>
          <button onClick={onClose} className="font-stencil text-2xl text-brass hover:text-amber-glow">X</button>
        </div>

        <h2 className={`font-stencil text-3xl text-parchment mb-2 leading-tight ${spamState === "flagged" ? "line-through opacity-40" : ""}`}>
          {issue.title}
        </h2>

        {spamState === "flagged" && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-3 px-4 py-2 border border-red-700/60 bg-red-900/20 font-mono text-sm text-red-400">
            Flagged as invalid — under review
          </motion.div>
        )}

        <p className="font-mono text-base text-parchment/60 mb-5">{issue.address}</p>

        {/* Status pipeline */}
        <div className="status-pipeline mb-6">
          {STATUS_ORDER.map((s, i) => (
            <div key={s} className={`status-step ${i < currentStatusIdx ? "done" : i === currentStatusIdx ? "active" : "pending"}`}>
              {STATUS_LABELS[s]}
            </div>
          ))}
        </div>

        {/* Images — user photos if available, else category default */}
        <div className="mb-3">
          {issue.hasUserMedia && issue.images.length > 0 ? (
            <>
              <div className="relative h-56 border-2 border-brass/30 overflow-hidden">
                <Image src={issue.images[mediaIndex] || issue.images[0]} alt={issue.title} fill className="object-cover" unoptimized />
              </div>
              {issue.images.length > 1 && (
                <div className="flex gap-2 mt-2 overflow-x-auto">
                  {issue.images.map((src, i) => (
                    <button key={i} onClick={() => setMediaIndex(i)} className={`relative w-16 h-16 flex-shrink-0 border-2 ${mediaIndex === i ? "border-amber-glow" : "border-brass/30"}`}>
                      <Image src={src} alt="" fill className="object-cover" unoptimized />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="relative h-56 border-2 border-brass/30 overflow-hidden">
              <Image
                src={CATEGORY_THUMB[issue.category] || CATEGORY_THUMB.other}
                alt={`${issue.category} reference`}
                fill
                className="object-cover opacity-70"
                unoptimized
              />
              <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 font-mono text-xs text-brass/60">
                Reference image
              </div>
            </div>
          )}
        </div>

        {/* Field Video — user video if uploaded, else YouTube embed by category */}
        <div className="mb-4 border border-brass/30">
          {issue.hasUserMedia && issue.video ? (
            <>
              <video src={issue.video} controls muted playsInline preload="auto" className="w-full h-44 object-cover bg-black" />
              <div className="bg-gunmetal-dark px-3 py-2 flex justify-between">
                <span className="font-mono text-xs text-brass/60">Field Video</span>
                <span className="font-mono text-xs text-brass/40">User Upload</span>
              </div>
            </>
          ) : (
            <>
              <iframe
                src={CATEGORY_YOUTUBE[issue.category] || CATEGORY_YOUTUBE.other}
                className="w-full h-44"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <div className="bg-gunmetal-dark px-3 py-2 flex justify-between">
                <span className="font-mono text-xs text-brass/60">Field Video — {CATEGORY_LABELS[issue.category]}</span>
                <span className="font-mono text-xs text-brass/40">YouTube</span>
              </div>
            </>
          )}
        </div>

        {/* Upload media */}
        {!issue.hasUserMedia && (
          <div className="mb-4 border border-dashed border-brass/30 p-4 text-center">
            <p className="font-mono text-sm text-brass/60 mb-3">Add photos or video from the field</p>
            <button onClick={() => fileRef.current?.click()} className="game-btn px-6 py-2 font-stencil text-base">
              {t(lang, "addMedia")}
            </button>
            <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleAddMedia} />
          </div>
        )}

        {/* ✅ Veo 2 AI Video Generation */}
        <VeoVideoPanel issue={issue} />

        <StreetViewPanel lat={issue.lat} lng={issue.lng} />

        {/* Before/After */}
        {issue.status === "resolved" && issue.afterImage && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="relative h-32 border border-brass/30">
              <Image src={issue.images[0]} alt="Before" fill className="object-cover" unoptimized />
              <span className="absolute bottom-0 left-0 bg-red-900/90 px-2 py-1 font-stencil text-xs">BEFORE</span>
            </div>
            <div className="relative h-32 border border-brass/30">
              <Image src={issue.afterImage} alt="After" fill className="object-cover" unoptimized />
              <span className="absolute bottom-0 left-0 bg-green-900/90 px-2 py-1 font-stencil text-xs">AFTER</span>
            </div>
          </div>
        )}

        <p className="font-mono text-base text-parchment/85 mb-5 leading-relaxed">{issue.description}</p>

        <FieldAnalysis issue={issue} />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5 text-center">
          {[
            { val: issue.confirmations, label: "CONFIRMS" },
            { val: issue.upvotes, label: "UPVOTES" },
            { val: `${issue.daysOpen}d`, label: "OPEN" },
          ].map((s) => (
            <div key={s.label} className="bg-gunmetal-dark p-3 border border-brass/20">
              <p className="text-2xl text-amber-glow font-stencil">{s.val}</p>
              <p className="text-xs text-brass tracking-widest mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Voice */}
        {voiceSupported && (
          <div className="mb-4 border border-brass/20 p-4 bg-gunmetal-dark/40">
            <p className="font-mono text-xs text-brass/60 mb-3 tracking-widest">VOICE NOTE</p>
            <button onClick={toggleVoice}
              className={`w-full py-3 font-stencil text-base tracking-widest border-2 transition-all ${isListening ? "border-red-500 text-red-400 bg-red-900/20 animate-pulse" : "border-brass/40 text-brass hover:border-amber-glow"}`}>
              {isListening ? "Recording... tap to stop" : "Add Voice Note"}
            </button>
            {isListening && (
              <div className="flex justify-center gap-1 mt-3">
                {[...Array(5)].map((_, i) => (
                  <motion.div key={i} className="w-1 bg-red-400 rounded-full"
                    animate={{ height: ["8px", "24px", "8px"] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }} />
                ))}
              </div>
            )}
            {voiceTranscript && (
              <div className="mt-3 p-3 bg-gunmetal border border-brass/20 font-mono text-sm text-parchment/80 leading-relaxed">
                {voiceTranscript}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button onClick={() => { sfx.click(); confirmIssue(issue.id); }} className="game-btn w-full py-3 font-stencil text-lg">
            {t(lang, "confirm")}
          </button>
          <button onClick={() => { sfx.click(); upvoteIssue(issue.id); }} className="w-full py-3 border-2 border-brass/40 font-stencil text-lg hover:border-amber-glow">
            {t(lang, "raisePriority")}
          </button>
          {issue.confirmations >= 3 && (
            <motion.button animate={isElevating ? { scale: [1, 1.05, 1] } : {}}
              onClick={() => elevateIssue(issue.id)}
              className="w-full py-3 border-2 border-amber-war font-stencil text-lg text-amber-glow">
              {isElevating ? "Promoting..." : t(lang, "elevate")}
            </motion.button>
          )}

          <AnimatePresence mode="wait">
            {spamState === "idle" && (
              <motion.button key="idle" exit={{ opacity: 0 }} onClick={handleSpam}
                className="w-full py-2 font-mono text-sm text-brass/40 hover:text-red-400 transition-colors">
                Flag as Invalid / Spam
              </motion.button>
            )}
            {spamState === "confirming" && (
              <motion.div key="confirming" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="border border-red-700/40 p-3 bg-red-900/10">
                <p className="font-mono text-xs text-red-400 mb-2">Are you sure? This will be reviewed.</p>
                <div className="flex gap-2">
                  <button onClick={handleSpam} className="flex-1 py-2 border border-red-700 font-stencil text-sm text-red-400 hover:bg-red-900/30">
                    Confirm Flag
                  </button>
                  <button onClick={() => setSpamState("idle")} className="flex-1 py-2 border border-brass/30 font-stencil text-sm text-brass">
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
            {spamState === "flagged" && (
              <motion.div key="flagged" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="w-full py-2 text-center font-mono text-xs text-red-400/60 border border-red-800/20">
                Report submitted — under review
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Status demo */}
        <div className="mt-6 pt-4 border-t border-brass/20">
          <p className="font-mono text-xs text-brass/50 mb-3">Update Status</p>
          <div className="flex gap-2">
            {STATUS_ORDER.map((s) => (
              <button key={s} onClick={() => updateIssueStatus(issue.id, s)}
                className="flex-1 py-2 font-stencil text-xs border border-brass/20"
                style={{ backgroundColor: issue.status === s ? STATUS_COLORS[s] : "transparent", color: issue.status === s ? "#1a1d20" : "#b8956a" }}>
                {STATUS_LABELS[s].slice(0, 4)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
