"use client";

import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";
import type { TabId } from "@/types";

const TABS: { id: TabId; label: string; sub: string }[] = [
  { id: "map", label: "TERRAIN", sub: "Sector Map" },
  { id: "report", label: "DEPLOY", sub: "File Report" },
  { id: "queue", label: "PRIORITY", sub: "Mission Queue" },
  { id: "intel", label: "INTEL", sub: "Control Room" },
];

export default function Sidebar() {
  const { activeTab, setActiveTab, user, logout, sectorName, setShowLocationPicker } =
    useStore();

  return (
    <motion.aside
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 120 }}
      className="fixed left-3 top-3 bottom-14 z-[1100] flex flex-col gap-2 w-[180px] overflow-y-auto overflow-x-hidden pointer-events-auto shadow-[4px_0_24px_rgba(0,0,0,0.5)]"
    >
      <div className="bg-gunmetal-dark/95 border-2 border-brass/30 p-3 backdrop-blur-sm shrink-0">
        <p className="font-ops text-xs text-brass tracking-widest">OPERATIVE</p>
        <p className="font-stencil text-2xl text-parchment leading-none mt-1">
          {user?.callsign || "ANON"}
        </p>
        {user && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-2 bg-gunmetal rounded-full overflow-hidden">
              <div className="h-full bg-amber-war transition-all" style={{ width: `${((user.xp % 500) / 500) * 100}%` }} />
            </div>
            <span className="font-mono text-xs text-brass">LV{user.level}</span>
          </div>
        )}
        {user?.verified && (
          <span className="inline-block mt-2 font-mono text-xs text-olive-light border border-olive px-2 py-0.5 tracking-widest">
            VERIFIED
          </span>
        )}
      </div>

      <button
        onClick={() => setShowLocationPicker(true)}
        className="bg-gunmetal-dark/95 border border-brass/30 px-3 py-2 text-left hover:border-amber-glow transition-colors shrink-0"
      >
        <p className="font-ops text-[10px] text-brass tracking-widest">SECTOR</p>
        <p className="font-stencil text-base text-parchment leading-tight truncate max-w-[150px]">
          {sectorName}
        </p>
        <p className="font-mono text-xs text-amber-glow mt-1">CHANGE LOCATION</p>
      </button>

      {TABS.map((tab, i) => (
        <motion.button
          key={tab.id}
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 + i * 0.08 }}
          onClick={() => setActiveTab(tab.id)}
          className={`game-btn px-4 py-3 text-left w-full shrink-0 ${activeTab === tab.id ? "active" : ""}`}
        >
          <span className="block font-stencil text-lg leading-none">{tab.label}</span>
          <span className="block font-mono text-[11px] text-parchment/50 mt-1 tracking-wider">{tab.sub}</span>
        </motion.button>
      ))}

      <button onClick={logout} className="mt-2 font-mono text-xs text-brass/40 hover:text-severity-high tracking-widest uppercase px-2">
        Disconnect
      </button>
    </motion.aside>
  );
}
