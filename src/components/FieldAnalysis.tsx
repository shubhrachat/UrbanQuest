"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Issue } from "@/types";
import { SEVERITY_COLORS } from "@/types";

interface FieldAnalysisProps {
  issue: Issue;
  compact?: boolean;
}

export default function FieldAnalysis({ issue, compact }: FieldAnalysisProps) {
  const [copied, setCopied] = useState(false);
  const severity = issue.severity;
  const color = SEVERITY_COLORS[issue.severityLevel];
  const urgency = issue.aiUrgencyLabel || (severity >= 7 ? "CRITICAL" : severity >= 5 ? "HIGH" : "ROUTINE");
  const confidence = issue.aiConfidence ?? 78;

  const copyLetter = () => {
    if (issue.aiLetter) {
      navigator.clipboard.writeText(issue.aiLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`intel-brief relative overflow-hidden ${compact ? "" : "mb-5"}`}>
      {/* Scan line animation */}
      <motion.div
        className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-b from-amber-glow/10 via-transparent to-transparent"
        animate={{ y: ["-100%", "200%"] }}
        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
        style={{ height: "40%" }}
      />

      <div className="relative z-10 p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-ops text-sm text-brass tracking-[0.25em]">FIELD INTELLIGENCE</p>
            <p className="font-stencil text-2xl text-amber-glow tracking-wider">THREAT ASSESSMENT</p>
          </div>
          <motion.div
            className="urgency-stamp px-3 py-1 border-2 font-stencil text-lg tracking-widest"
            style={{ borderColor: color, color }}
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            {urgency}
          </motion.div>
        </div>

        {/* Severity gauge */}
        <div className="flex items-center gap-5 mb-5">
          <div className="relative w-28 h-28 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#1a1d20" strokeWidth="8" />
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={color}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(severity / 10) * 264} 264`}
                initial={{ strokeDasharray: "0 264" }}
                animate={{ strokeDasharray: `${(severity / 10) * 264} 264` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-stencil text-3xl" style={{ color }}>
                {severity.toFixed(1)}
              </span>
              <span className="font-mono text-xs text-brass">/ 10</span>
            </div>
          </div>

          <div className="flex-1">
            <p className="font-stencil text-xl text-parchment leading-tight mb-2">
              {issue.aiCategory}
            </p>
            {issue.aiSummary && (
              <p className="font-mono text-base text-parchment/80 leading-relaxed">
                {issue.aiSummary}
              </p>
            )}
            <div className="mt-3 flex items-center gap-3">
              <span className="font-mono text-sm text-brass">CONFIDENCE</span>
              <div className="flex-1 h-2 bg-gunmetal-dark rounded overflow-hidden">
                <motion.div
                  className="h-full bg-olive-light"
                  initial={{ width: 0 }}
                  animate={{ width: `${confidence}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
              <span className="font-mono text-sm text-amber-glow">{confidence}%</span>
            </div>
          </div>
        </div>

        {/* Recommended action — highlighted */}
        {issue.aiRecommendedAction && (
          <div className="bg-amber-war/10 border-l-4 border-amber-war px-4 py-3 mb-4">
            <p className="font-stencil text-sm text-amber-glow tracking-widest mb-1">
              RECOMMENDED ACTION
            </p>
            <p className="font-mono text-base text-parchment">{issue.aiRecommendedAction}</p>
            {issue.aiEstimatedFixDays && (
              <p className="font-mono text-sm text-brass mt-2">
                Est. resolution window: {issue.aiEstimatedFixDays} days
              </p>
            )}
          </div>
        )}

        {/* Causes */}
        <div className="mb-4">
          <p className="font-stencil text-sm text-brass tracking-widest mb-2">ROOT CAUSE ANALYSIS</p>
          <div className="space-y-2">
            {issue.aiCauses.map((c, i) => (
              <motion.div
                key={c}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-start gap-2 font-mono text-base text-parchment/85"
              >
                <span className="text-amber-war font-stencil">{String(i + 1).padStart(2, "0")}</span>
                <span>{c}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Municipal letter */}
        {issue.aiLetter && (
          <div className="border border-brass/30 bg-gunmetal-dark/60 p-4">
            <div className="flex justify-between items-center mb-2">
              <p className="font-stencil text-sm text-brass tracking-widest">
                MUNICIPAL DISPATCH DRAFT
              </p>
              <button
                onClick={copyLetter}
                className="font-mono text-sm text-amber-glow hover:text-parchment border border-brass/40 px-3 py-1"
              >
                {copied ? "COPIED" : "COPY LETTER"}
              </button>
            </div>
            <p className="font-mono text-sm text-parchment/70 leading-relaxed whitespace-pre-line">
              {issue.aiLetter}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
