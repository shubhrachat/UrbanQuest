"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/store/useStore";

export default function NotificationToast() {
  const notification = useStore((s) => s.notification);
  const clearNotification = useStore((s) => s.clearNotification);

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[1200] bg-gunmetal border-2 border-amber-war px-6 py-4 max-w-lg shadow-xl"
          onClick={clearNotification}
        >
          <p className="font-stencil text-sm text-amber-glow tracking-widest mb-1">
            FIELD UPDATE
          </p>
          <p className="font-mono text-base text-parchment">{notification}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
