"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/store/useStore";
import AuthPortal from "./AuthPortal";
import Sidebar from "./Sidebar";
import MapView from "./MapView";
import ReportTab from "./ReportTab";
import PriorityQueue from "./PriorityQueue";
import IntelDashboard from "./IntelDashboard";
import LiveTicker from "./LiveTicker";
import LocationPicker from "./LocationPicker";
import NotificationToast from "./NotificationToast";
import LanguagePrompt from "./LanguagePrompt";

export default function MainApp() {
  const { isAuthenticated, activeTab, detectLocation, locationDetected, issues } =
    useStore();

  useEffect(() => {
    if (isAuthenticated && !locationDetected) {
      detectLocation();
    }
    if (isAuthenticated && issues.length === 0 && locationDetected) {
      detectLocation();
    }
  }, [isAuthenticated, locationDetected, detectLocation, issues.length]);

  const notification = useStore((s) => s.notification);
  const clearNotification = useStore((s) => s.clearNotification);

  useEffect(() => {
    if (notification) {
      const t = setTimeout(clearNotification, 4000);
      return () => clearTimeout(t);
    }
  }, [notification, clearNotification]);

  if (!isAuthenticated) {
    return <AuthPortal />;
  }

  return (
    <div className="fixed inset-0 bg-gunmetal-dark">
      <Sidebar />

      <AnimatePresence mode="wait">
        {activeTab === "map" && (
          <motion.div
            key="map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 pb-8"
          >
            <MapView />
          </motion.div>
        )}

        {activeTab === "report" && (
          <motion.div
            key="report"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <ReportTab />
          </motion.div>
        )}

        {activeTab === "queue" && (
          <motion.div
            key="queue"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <PriorityQueue />
          </motion.div>
        )}

        {activeTab === "intel" && (
          <motion.div
            key="intel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <IntelDashboard />
          </motion.div>
        )}
      </AnimatePresence>

      <LiveTicker />
      <LocationPicker />
      <NotificationToast />
      <LanguagePrompt />
    </div>
  );
}
