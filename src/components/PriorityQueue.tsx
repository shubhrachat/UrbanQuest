"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useStore } from "@/store/useStore";
import { SEVERITY_COLORS, STATUS_LABELS, CATEGORY_LABELS } from "@/types";
import { sfx } from "@/lib/sounds";
import FieldAnalysis from "./FieldAnalysis";
import Image from "next/image";
import { getCategoryVideo } from "@/lib/media";

const CATEGORY_ICONS: Record<string, string> = {
  pothole: "RD", water_leak: "WS", streetlight: "LT",
  waste: "SN", infrastructure: "IF", other: "OT",
};

const URGENCY_LABEL = (score: number) =>
  score >= 12 ? "CRITICAL" : score >= 8 ? "HIGH" : score >= 5 ? "MEDIUM" : "LOW";

const URGENCY_COLOR = (score: number) =>
  score >= 12 ? "#8b2e2e" : score >= 8 ? "#c47a2c" : score >= 5 ? "#4a5d23" : "#4a7c59";

export default function PriorityQueue() {
  const { issues, selectIssue, setActiveTab, setMapView, upvoteIssue, elevateIssue, elevatingIssueId } =
    useStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...issues].sort((a, b) => {
        const scoreA = a.severity + a.upvotes * 0.2 + a.confirmations * 0.5;
        const scoreB = b.severity + b.upvotes * 0.2 + b.confirmations * 0.5;
        return scoreB - scoreA;
      }),
    [issues]
  );

  const expanded = sorted.find((i) => i.id === expandedId);

  const handleElevate = (id: string) => { sfx.elevate(); elevateIssue(id); };
  const handleUpvote = (id: string) => { sfx.click(); upvoteIssue(id); };
  const openOnMap = (id: string, lat: number, lng: number) => {
    selectIssue(id); setMapView(lat, lng, 16); setActiveTab("map");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-30 bg-gunmetal-dark overflow-hidden">
      {/* Atmospheric background */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse at 50% 0%, rgba(139,46,46,0.08) 0%, transparent 55%), linear-gradient(180deg, #14181a 0%, #1e2428 100%)",
      }} />

      {/* Top wire rail */}
      <div className="absolute top-0 left-52 right-0 h-16 z-10 pointer-events-none">
        <div className="absolute top-8 left-0 right-0 h-0.5 bg-brass/40" />
        {sorted.slice(0, 8).map((_, i) => (
          <div key={i} className="absolute top-8 w-px h-10 bg-brass/30" style={{ left: `${12 + i * 11}%` }} />
        ))}
      </div>

      <div className="relative z-10 h-full overflow-y-auto px-8 pt-16 pb-24 ml-52">
        <div className="flex items-end gap-6 mb-2">
          <h2 className="font-ops text-5xl text-parchment tracking-widest">PRIORITY QUEUE</h2>
          <motion.div
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
            className="mb-2 px-3 py-1 border border-red-500/50 bg-red-900/20"
          >
            <span className="font-mono text-xs text-red-400 tracking-widest">
              {sorted.filter(i => i.severity >= 7).length} CRITICAL ACTIVE
            </span>
          </motion.div>
        </div>
        <p className="font-mono text-base text-brass mt-1 mb-8">MISSION DOSSIERS — RANKED BY THREAT SCORE</p>

        <LayoutGroup>
          <div className="space-y-4 max-w-3xl">
            {sorted.map((issue, i) => {
              const isElevating = elevatingIssueId === issue.id;
              const priorityScore = issue.severity + issue.upvotes * 0.2 + issue.confirmations * 0.5;
              const urgency = URGENCY_LABEL(priorityScore);
              const urgencyColor = URGENCY_COLOR(priorityScore);
              const isCritical = issue.severity >= 7;

              return (
                <motion.div
                  key={issue.id}
                  layout
                  layoutId={issue.id}
                  initial={{ opacity: 0, y: -40, rotateX: -12 }}
                  animate={{
                    opacity: 1, y: isElevating ? -24 : 0, rotateX: 0,
                    scale: isElevating ? 1.03 : 1,
                    boxShadow: isElevating
                      ? "0 0 40px rgba(196,122,44,0.6)"
                      : isCritical
                        ? "0 0 0 1px rgba(139,46,46,0.3)"
                        : "none",
                  }}
                  transition={{ type: "spring", stiffness: 180, damping: 20, delay: i * 0.03 }}
                  className="relative"
                  style={{ perspective: "800px" }}
                >
                  {/* Hanging clip */}
                  <div className="absolute -top-3.5 left-8 w-3 h-3 rounded-full bg-brass border-2 border-olive-dark z-10" />
                  <div className="absolute -top-3.5 left-[34px] w-px h-4 bg-brass/50" />

                  {/* Critical pulse border */}
                  {isCritical && (
                    <motion.div
                      className="absolute inset-0 border-2 border-red-700/40 pointer-events-none"
                      animate={{ opacity: [0.3, 0.8, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1.8 }}
                    />
                  )}

                  <button
                    onClick={() => { sfx.click(); setExpandedId(expandedId === issue.id ? null : issue.id); }}
                    className={`w-full text-left border-2 bg-gunmetal/95 transition-colors overflow-hidden ${
                      expandedId === issue.id ? "border-amber-glow" : isCritical ? "border-red-800/60 hover:border-red-600" : "border-brass/20 hover:border-brass/60"
                    }`}
                  >
                    {/* Dossier header */}
                    <div className="flex gap-0">
                      {/* Rank + category badge */}
                      <div className="w-20 flex-shrink-0 flex flex-col items-center justify-center py-4 border-r border-brass/20 relative overflow-hidden"
                        style={{ backgroundColor: `${urgencyColor}18` }}>
                        <span className="font-ops text-3xl" style={{ color: urgencyColor }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="font-mono text-xs text-brass/60 mt-1">
                          {CATEGORY_ICONS[issue.category] || "OT"}
                        </span>
                        {/* Large faded icon watermark */}
                        <span className="absolute -bottom-2 -right-1 font-ops text-5xl opacity-10 text-parchment">
                          {CATEGORY_ICONS[issue.category] || "OT"}
                        </span>
                      </div>

                      {/* Main content */}
                      <div className="flex-1 px-5 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-stencil text-xl text-parchment leading-tight">{issue.title}</p>
                            <p className="font-mono text-sm text-brass mt-1">{issue.zone} — {CATEGORY_LABELS[issue.category]}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="font-stencil text-xs px-2 py-1" style={{ backgroundColor: `${urgencyColor}30`, color: urgencyColor, border: `1px solid ${urgencyColor}60` }}>
                              {urgency}
                            </span>
                            <span className="font-mono text-xs text-brass/60">PRIO {priorityScore.toFixed(1)}</span>
                          </div>
                        </div>

                        {/* Threat level bar */}
                        <div className="mt-3 flex items-center gap-3">
                          <span className="font-mono text-xs text-brass/50 w-16">THREAT</span>
                          <div className="flex-1 h-2 bg-gunmetal-dark rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: urgencyColor }}
                              initial={{ width: 0 }}
                              animate={{ width: `${(issue.severity / 10) * 100}%` }}
                              transition={{ delay: i * 0.04 + 0.2, duration: 0.6 }}
                            />
                          </div>
                          <span className="font-stencil text-base w-8 text-right" style={{ color: urgencyColor }}>
                            {issue.severity.toFixed(1)}
                          </span>
                        </div>

                        {/* Stats row */}
                        <div className="mt-2 flex gap-4">
                          <span className="font-mono text-xs text-brass/50">✓ {issue.confirmations} CONFIRMS</span>
                          <span className="font-mono text-xs text-brass/50">↑ {issue.upvotes} VOTES</span>
                          <span className="font-mono text-xs text-brass/50">⏱ {issue.daysOpen}d OPEN</span>
                          {issue.spamReports > 0 && (
                            <span className="font-mono text-xs text-red-400/70">⚠ {issue.spamReports} SPAM</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </LayoutGroup>
      </div>

      {/* Expanded mission dossier popup */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4 ml-52"
            onClick={() => setExpandedId(null)}
          >
            <motion.div
              initial={{ scale: 0.82, y: 50, rotateX: 10 }}
              animate={{ scale: 1, y: 0, rotateX: 0 }}
              exit={{ scale: 0.88, y: 30, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gunmetal border-2 border-amber-war max-w-2xl w-full max-h-[88vh] overflow-y-auto shadow-[0_0_80px_rgba(196,122,44,0.25)]"
              style={{ perspective: "1000px" }}
            >
              {/* Dossier header */}
              <div className="bg-gunmetal-dark border-b-2 border-brass/30 px-6 py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-ops text-xs text-brass tracking-widest mb-1">MISSION DOSSIER — CLASSIFIED</p>
                    <h3 className="font-stencil text-3xl text-parchment leading-tight">{expanded.title}</h3>
                    <p className="font-mono text-sm text-brass mt-1">{expanded.zone} · {CATEGORY_LABELS[expanded.category]}</p>
                  </div>
                  <button onClick={() => setExpandedId(null)} className="font-stencil text-2xl text-brass hover:text-amber-glow ml-4">✕</button>
                </div>
              </div>

              <div className="p-6">
                {/* Image */}
                {expanded.images[0] && (
                  <div className="relative h-48 mb-4 border border-brass/30 overflow-hidden">
                    <Image src={expanded.images[0]} alt="" fill className="object-cover" unoptimized />
                    <div className="absolute inset-0 bg-gradient-to-t from-gunmetal/60 to-transparent" />
                  </div>
                )}

                {/* Video — use category fallback if no user video */}
                <div className="mb-4 border border-brass/30">
                  <video
                    src={expanded.video || getCategoryVideo(expanded.category)}
                    controls
                    muted
                    className="w-full h-40 bg-black object-cover"
                  />
                  <div className="bg-gunmetal-dark px-3 py-1">
                    <span className="font-mono text-xs text-amber-glow/70">
                      {expanded.video ? "FIELD VIDEO" : "CATEGORY REFERENCE FOOTAGE"}
                    </span>
                  </div>
                </div>

                <p className="font-mono text-base text-parchment/80 mb-5 leading-relaxed">{expanded.description}</p>

                <FieldAnalysis issue={expanded} compact />

                {/* Threat metrics */}
                <div className="grid grid-cols-4 gap-2 mt-4 mb-5">
                  {[
                    { val: expanded.severity.toFixed(1), label: "SEVERITY" },
                    { val: expanded.confirmations, label: "CONFIRMS" },
                    { val: expanded.upvotes, label: "UPVOTES" },
                    { val: `${expanded.daysOpen}d`, label: "OPEN" },
                  ].map((s) => (
                    <div key={s.label} className="bg-gunmetal-dark border border-brass/20 p-3 text-center">
                      <p className="font-stencil text-2xl text-amber-glow">{s.val}</p>
                      <p className="font-mono text-xs text-brass/60 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => openOnMap(expanded.id, expanded.lat, expanded.lng)} className="game-btn py-3 font-stencil text-lg">
                    View On Map
                  </button>
                  <button onClick={() => handleUpvote(expanded.id)} className="py-3 border-2 border-brass font-stencil text-lg text-parchment hover:border-amber-glow">
                    ↑ Raise Priority
                  </button>
                  {expanded.confirmations >= 3 && (
                    <button onClick={() => handleElevate(expanded.id)} className="col-span-2 py-3 border-2 border-amber-war font-stencil text-lg text-amber-glow hover:bg-amber-war/10">
                      ⚡ Community Elevate — Push To Top
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
