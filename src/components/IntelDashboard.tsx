"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import type { MonthlyStats } from "@/types";
import { sfx } from "@/lib/sounds";

type MonitorView = "overview" | "calendar" | "heatmap" | "predictions" | "leaderboard";

interface Prediction {
  text?: string;
  risk: string;
  zone?: string;
  sector?: string;
  category?: string;
  probability?: number;
  reason?: string;
  estimatedDays?: number;
}

export default function IntelDashboard() {
  const { issues, monthlyStats, sectorName } = useStore();
  const [activeMonitor, setActiveMonitor] = useState<MonitorView>("overview");
  const [selectedMonth, setSelectedMonth] = useState<MonthlyStats | null>(null);
  const [booted, setBooted] = useState(false);
  const [monitorKey, setMonitorKey] = useState(0);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loadingPredict, setLoadingPredict] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (activeMonitor === "predictions") {
      setLoadingPredict(true);
      const zones = [...new Set(issues.map((i) => i.zone))].slice(0, 5);
      fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issues, zones, sectorName }),
      })
        .then((r) => r.json())
        .then((d) => setPredictions(d.predictions || []))
        .catch(() => setPredictions([]))
        .finally(() => setLoadingPredict(false));
    }
  }, [activeMonitor, issues, sectorName]);

  const switchMonitor = (id: MonitorView) => {
    sfx.powerOn();
    setActiveMonitor(id);
    setSelectedMonth(null);
    setMonitorKey((k) => k + 1);
  };

  const totalReported = issues.length;
  const totalResolved = issues.filter((i) => i.status === "resolved").length;
  const totalPending = issues.filter((i) => i.status !== "resolved").length;

  const zoneCounts: Record<string, number> = {};
  issues.forEach((i) => { zoneCounts[i.zone] = (zoneCounts[i.zone] || 0) + 1; });
  const topZones = Object.entries(zoneCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const reporterCounts: Record<string, number> = {};
  issues.forEach((i) => { reporterCounts[i.reporterName] = (reporterCounts[i.reporterName] || 0) + 1; });
  const topReporters = Object.entries(reporterCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const monitors: { id: MonitorView; label: string }[] = [
    { id: "overview", label: "OVERVIEW" },
    { id: "calendar", label: "MISSION LOG" },
    { id: "heatmap", label: "SECTOR HEAT" },
    { id: "predictions", label: "FORECAST" },
    { id: "leaderboard", label: "OPERATIVES" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-30 control-room overflow-hidden"
    >
      {/* Boot sequence */}
      <AnimatePresence>
        {!booted && (
          <motion.div
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black flex items-center justify-center"
          >
            <div className="text-center">
              <motion.p
                className="font-mono text-amber-glow text-xl mb-4"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
              >
                INITIALIZING CONTROL ROOM...
              </motion.p>
              <div className="flex gap-1 justify-center">
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-8 bg-olive"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: [0, 1, 0.3, 1] }}
                    transition={{ delay: i * 0.08, duration: 0.8 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="control-room-wall absolute inset-0" />

      {/* Spaceship bridge — upper monitor bank */}
      <div className="absolute top-16 left-56 right-8 h-24 z-[5] pointer-events-none flex gap-4 justify-center opacity-40">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="w-32 h-20 border border-brass/20 bg-gunmetal-dark/50 rounded-sm">
            <div className="h-full flex items-center justify-center">
              <motion.div className="w-2 h-2 rounded-full bg-olive led-blink" style={{ animationDelay: `${n * 0.3}s` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Ambient LEDs */}
      <div className="absolute left-8 top-1/4 flex flex-col gap-3">
        {["#4a7c59", "#c47a2c", "#8b2e2e", "#4a7c59"].map((c, i) => (
          <div key={i} className="w-2 h-2 rounded-full led-blink" style={{ backgroundColor: c, animationDelay: `${i * 0.5}s` }} />
        ))}
      </div>

      <div className="relative z-10 h-full flex flex-col p-6 pb-24 ml-52">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: booted ? 1 : 0, y: 0 }}>
          <h2 className="font-ops text-4xl text-parchment tracking-widest">INTEL CONTROL ROOM</h2>
          <p className="font-mono text-base text-brass tracking-widest mt-1">
            SECTOR: {sectorName} — SELECT MONITOR
          </p>
        </motion.div>

        {/* Physical monitor buttons on desk rail */}
        <div className="flex gap-3 my-6 flex-wrap">
          {monitors.map((m, i) => (
            <motion.button
              key={m.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: booted ? 0 : 20, opacity: booted ? 1 : 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              onClick={() => switchMonitor(m.id)}
              className={`px-5 py-3 font-stencil text-base tracking-widest border-2 transition-all ${
                activeMonitor === m.id
                  ? "bg-amber-war text-gunmetal-dark border-amber-glow shadow-[0_0_20px_rgba(196,122,44,0.5)]"
                  : "bg-gunmetal border-brass/40 text-brass hover:border-brass"
              }`}
            >
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${activeMonitor === m.id ? "bg-gunmetal-dark led-blink" : "bg-olive"}`} />
              {m.label}
            </motion.button>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-12 gap-5 min-h-0">
          <motion.div
            key={monitorKey}
            className="col-span-8 crt-screen powering-on min-h-0"
            initial={{ opacity: 0, scaleY: 0.95 }}
            animate={{ opacity: 1, scaleY: 1 }}
          >
            <div className="h-full overflow-y-auto p-6 relative z-[5]">
              <MonitorContent
                activeMonitor={activeMonitor}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                totalReported={totalReported}
                totalResolved={totalResolved}
                totalPending={totalPending}
                issues={issues}
                topZones={topZones}
                topReporters={topReporters}
                monthlyStats={monthlyStats}
                predictions={predictions}
                loadingPredict={loadingPredict}
              />
            </div>
          </motion.div>

          {/* Side panel */}
          <div className="col-span-4 flex flex-col gap-4 min-h-0">
            <div className="crt-screen flex-1 p-5 min-h-0 overflow-y-auto">
              <p className="font-stencil text-base text-amber-glow mb-4 tracking-widest">CATEGORY BREAKDOWN</p>
              <TrendChart issues={issues} />
            </div>
            <div className="crt-screen p-5">
              <p className="font-stencil text-sm text-brass mb-3 tracking-widest">RECENT ACTIVITY</p>
              {issues.slice(-4).reverse().map((issue, i) => (
                <div key={i} className="py-2 border-b border-brass/10 last:border-0">
                  <p className="font-mono text-sm text-parchment truncate">{issue.title}</p>
                  <p className="font-mono text-xs text-brass">{issue.zone}</p>
                </div>
              ))}
              {issues.length === 0 && <p className="font-mono text-sm text-brass/50">No activity yet</p>}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MonitorContent({
  activeMonitor,
  selectedMonth,
  setSelectedMonth,
  totalReported,
  totalResolved,
  totalPending,
  issues,
  topZones,
  topReporters,
  monthlyStats,
  predictions,
  loadingPredict,
}: {
  activeMonitor: MonitorView;
  selectedMonth: MonthlyStats | null;
  setSelectedMonth: (m: MonthlyStats | null) => void;
  totalReported: number;
  totalResolved: number;
  totalPending: number;
  // issues: { category: string; zone: string; status: string; severity: number; daysOpen: number }[];
  topZones: [string, number][];
  issues: { category: string; zone: string; status: string; severity: number; daysOpen: number; title: string }[];
  topReporters: [string, number][];
  monthlyStats: MonthlyStats[];
  predictions: Prediction[];
  loadingPredict: boolean;
}) {
  if (activeMonitor === "overview") {
    return (
      <div className="grid grid-cols-3 gap-4">
        <StatBlock label="REPORTED" value={totalReported} />
        <StatBlock label="RESOLVED" value={totalResolved} color="#4a7c59" />
        <StatBlock label="PENDING" value={totalPending} color="#c47a2c" />
        <StatBlock label="AVG SEVERITY" value={issues.length ? (issues.reduce((s, i) => s + i.severity, 0) / issues.length).toFixed(1) : "0"} />
        <StatBlock label="VERIFIED" value={issues.filter((i) => i.status === "verified").length} />
        <StatBlock label="IN PROGRESS" value={issues.filter((i) => i.status === "in_progress").length} color="#4a5d23" />
        <div className="col-span-3 border border-brass/20 p-5 mt-2">
          <p className="font-stencil text-base text-amber-glow mb-3">RESOLUTION RATE</p>
          <div className="h-6 bg-gunmetal-dark rounded overflow-hidden">
            <motion.div className="h-full bg-olive" initial={{ width: 0 }} animate={{ width: `${totalReported ? (totalResolved / totalReported) * 100 : 0}%` }} transition={{ duration: 1.5 }} />
          </div>
          <p className="font-mono text-sm text-brass mt-2">{totalReported ? Math.round((totalResolved / totalReported) * 100) : 0}% resolved</p>
        </div>
        <SituationReport issues={issues} totalReported={totalReported} totalResolved={totalResolved} totalPending={totalPending} />
      </div>
    );
  }

  if (activeMonitor === "calendar" && !selectedMonth) {
    const calendarMonths = monthlyStats.length ? monthlyStats : getPastMonths();
    return (
      <>
        <p className="font-stencil text-xl text-amber-glow tracking-widest mb-5">MISSION LOG — SELECT MONTH</p>
        <div className="grid grid-cols-4 gap-4">
          {calendarMonths.map((m) => (
            <motion.button key={`${m.month}-${m.year}`} whileHover={{ scale: 1.06, borderColor: "#e8a84a" }} whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedMonth(m)}
              className="border-2 border-brass/30 p-5 text-left hover:bg-amber-war/5">
              <p className="font-stencil text-3xl text-parchment">{m.month}</p>
              <p className="font-mono text-sm text-brass">{m.year}</p>
              <p className="font-mono text-base text-amber-glow mt-2">{m.reported} reports</p>
            </motion.button>
          ))}
        </div>
      </>
    );
  }

  if (activeMonitor === "calendar" && selectedMonth) {
    return (
      <>
        <button onClick={() => setSelectedMonth(null)} className="font-mono text-sm text-brass hover:text-amber-glow mb-4">&lt; BACK</button>
        <p className="font-stencil text-3xl text-amber-glow mb-6">{selectedMonth.month} {selectedMonth.year}</p>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatBlock label="REPORTED" value={selectedMonth.reported} />
          <StatBlock label="RESOLVED" value={selectedMonth.resolved} color="#4a7c59" />
          <StatBlock label="PENDING" value={selectedMonth.pending} color="#c47a2c" />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="font-stencil text-base text-brass mb-3">TOP ZONES</p>
            {selectedMonth.topZones.map((z) => (
              <div key={z.zone} className="flex justify-between font-mono text-base text-parchment/80 py-2 border-b border-brass/10">
                <span>{z.zone}</span><span className="text-amber-glow">{z.count}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="font-stencil text-base text-brass mb-3">TOP OPERATIVES</p>
            {selectedMonth.topReporters.map((r) => (
              <div key={r.name} className="flex justify-between font-mono text-base text-parchment/80 py-2 border-b border-brass/10">
                <span>{r.name}</span><span className="text-amber-glow">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (activeMonitor === "heatmap") {
    const max = topZones[0]?.[1] || 1;
    return (
      <>
        <p className="font-stencil text-xl text-amber-glow mb-5">SECTOR HEATMAP</p>
        {topZones.map(([zone, count], i) => {
          const pct = (count / max) * 100;
          const heat = pct > 70 ? "#8b2e2e" : pct > 40 ? "#c47a2c" : "#4a7c59";
          return (
            <div key={zone} className="flex items-center gap-4 mb-3">
              <span className="font-mono text-sm text-brass w-36 truncate">{zone}</span>
              <div className="flex-1 h-8 bg-gunmetal-dark relative overflow-hidden">
                <motion.div className="h-full" style={{ backgroundColor: heat }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: i * 0.1, duration: 0.8 }} />
              </div>
              <span className="font-mono text-base text-parchment w-8">{count}</span>
            </div>
          );
        })}
      </>
    );
  }

  if (activeMonitor === "predictions") {
    return (
      <>
        <p className="font-stencil text-xl text-amber-glow mb-5">GEMINI PREDICTIVE FORECAST</p>
        {loadingPredict ? (
          <p className="font-mono text-lg text-brass animate-flicker">Computing sector forecasts...</p>
        ) : (
          <div className="space-y-4">
            {predictions.map((p, i) => (
              <motion.div key={i} initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.12 }}
                className="border-2 border-brass/20 p-5 hover:border-amber-war/50">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.risk === "high" ? "#8b2e2e" : p.risk === "medium" ? "#c47a2c" : "#4a7c59" }} />
                  <span className="font-stencil text-base text-brass">{p.risk.toUpperCase()} — {p.sector || p.zone || "SECTOR"}</span>
                  {p.probability && <span className="font-mono text-xs text-amber-glow ml-auto">{p.probability}% probability</span>}
                </div>
                <p className="font-mono text-sm text-parchment/80 leading-relaxed">{p.reason || p.text}</p>
                {p.estimatedDays && <p className="font-mono text-xs text-brass/50 mt-1">Est. {p.estimatedDays} days · {p.category?.replace("_", " ")}</p>}
              </motion.div>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <p className="font-stencil text-xl text-amber-glow mb-5">TOP FIELD OPERATIVES</p>
      {topReporters.map(([name, count], i) => (
        <motion.div key={name} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.08 }}
          className="flex items-center gap-5 py-4 border-b border-brass/10">
          <span className="font-stencil text-3xl text-brass/30 w-12">{String(i + 1).padStart(2, "0")}</span>
          <div className="flex-1">
            <p className="font-stencil text-2xl text-parchment">{name}</p>
            <p className="font-mono text-sm text-brass">{count} field reports</p>
          </div>
          <p className="font-mono text-lg text-amber-glow">{count * 100} XP</p>
        </motion.div>
      ))}
    </>
  );
}

function SituationReport({ issues, totalReported, totalResolved, totalPending }: {
  issues: { category: string; zone: string; severity: number; status: string; title: string }[];
  totalReported: number; totalResolved: number; totalPending: number;
}) {
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const generate = async () => {
    setOpen(true);
    setLoading(true);
    setReport("");
    const topIssues = [...issues].sort((a, b) => b.severity - a.severity).slice(0, 6);
    const categoryCount: Record<string, number> = {};
    issues.forEach(i => { categoryCount[i.category] = (categoryCount[i.category] || 0) + 1; });

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Community Situation Report",
          description: `Generate a concise community situation report for municipal authorities. 
Stats: ${totalReported} total issues, ${totalResolved} resolved, ${totalPending} pending.
Top issues by severity: ${topIssues.map(i => `${i.title} (${i.zone}, severity ${i.severity})`).join("; ")}.
Category breakdown: ${Object.entries(categoryCount).map(([k, v]) => `${k}: ${v}`).join(", ")}.
Write a clear 3-paragraph situation report that: 1) summarizes current state, 2) highlights urgent issues needing attention, 3) recommends next steps. Use plain English, not military jargon. Be specific and actionable.`,
          category: "report",
          area: issues[0]?.zone || "Local Area",
        }),
      });
      const data = await res.json();
      setReport(data.summary || data.letter || "Report generated — check API connection.");
    } catch {
      setReport(`Community Status Summary\n\n${totalReported} issues reported in your area. ${totalResolved} have been resolved (${totalReported ? Math.round((totalResolved/totalReported)*100) : 0}% resolution rate). ${totalPending} issues are still pending action.\n\nTop priority: ${topIssues[0]?.title || "No critical issues"} in ${topIssues[0]?.zone || "your area"}.\n\nRecommendation: Focus resources on the ${topIssues.filter(i => i.severity >= 7).length} high-severity cases first.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="col-span-3 mt-2">
      <button
        onClick={generate}
        className="w-full py-3 border-2 border-amber-glow/50 font-stencil text-base text-amber-glow hover:bg-amber-glow/10 tracking-widest transition-all"
      >
        Generate AI Situation Report
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 border border-brass/30 overflow-hidden"
          >
            <div className="bg-gunmetal-dark p-5">
              <div className="flex justify-between items-center mb-3">
                <p className="font-stencil text-sm text-amber-glow tracking-widest">AI SITUATION REPORT — {new Date().toLocaleDateString()}</p>
                <div className="flex gap-2">
                  {!loading && report && (
                    <button onClick={() => navigator.clipboard.writeText(report)} className="font-mono text-xs text-brass border border-brass/30 px-2 py-1 hover:text-amber-glow">Copy</button>
                  )}
                  <button onClick={() => setOpen(false)} className="font-mono text-xs text-brass hover:text-amber-glow">Close</button>
                </div>
              </div>
              {loading ? (
                <div className="flex items-center gap-3">
                  <motion.div className="w-2 h-2 rounded-full bg-amber-glow" animate={{ opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} />
                  <p className="font-mono text-sm text-brass">Gemini is analyzing your community data...</p>
                </div>
              ) : (
                <p className="font-mono text-sm text-parchment/85 leading-relaxed whitespace-pre-wrap">{report}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatBlock({ label, value, color = "#e8a84a" }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="border-2 border-brass/20 p-5 text-center">
      <motion.p className="font-stencil text-5xl" style={{ color }} initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>{value}</motion.p>
      <p className="font-mono text-sm text-brass tracking-widest mt-2">{label}</p>
    </div>
  );
}

function TrendChart({ issues }: { issues: { category: string }[] }) {
  const cats = [
    { key: "pothole", label: "Road" },
    { key: "water_leak", label: "Water" },
    { key: "streetlight", label: "Light" },
    { key: "waste", label: "Waste" },
    { key: "infrastructure", label: "Infra" },
    { key: "other", label: "Other" },
  ];
  const counts = cats.map((c) => issues.filter((i) => i.category === c.key).length);
  const max = Math.max(...counts, 1);
  const total = counts.reduce((a, b) => a + b, 0);

  if (total === 0) {
    return <p className="font-mono text-sm text-brass/50 text-center mt-8">No issues reported yet</p>;
  }

  return (
    <div>
      <div className="flex items-end gap-2 h-28 mb-3">
        {cats.map((cat, i) => (
          <div key={cat.key} className="flex-1 flex flex-col items-center gap-1">
            <span className="font-mono text-[10px] text-amber-glow">{counts[i] > 0 ? counts[i] : ""}</span>
            <motion.div
              className="w-full rounded-t-sm"
              style={{ backgroundColor: counts[i] > max * 0.6 ? "#8b2e2e" : counts[i] > max * 0.3 ? "#c47a2c" : "#4a7c59", minHeight: counts[i] > 0 ? 4 : 0 }}
              initial={{ height: 0 }}
              animate={{ height: `${(counts[i] / max) * 100}%` }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
  
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {cats.map((cat) => (
          <span key={cat.key} className="flex-1 font-mono text-[9px] text-brass/60 text-center truncate">{cat.label}</span>
        ))}
      </div>
    </div>
  );
}

// ✅ FIX: Only return months up to and including the current month — never future months
function getPastMonths(): MonthlyStats[] {
  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const currentMonthIndex = now.getMonth(); // 0 = Jan, 5 = Jun, etc.
  const currentYear = now.getFullYear();

  // Show last 6 months (or fewer if we're early in the year)
  const months: MonthlyStats[] = [];
  for (let i = 5; i >= 0; i--) {
    let monthIndex = currentMonthIndex - i;
    let year = currentYear;
    if (monthIndex < 0) {
      monthIndex += 12;
      year -= 1;
    }
    months.push({
      month: MONTH_NAMES[monthIndex],
      year,
      reported: 0,
      resolved: 0,
      pending: 0,
      topZones: [],
      topReporters: [],
    });
  }
  return months;
}
