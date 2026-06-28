"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";

export default function LanguagePrompt() {
  const { languagePrompt, setLanguage, dismissLanguagePrompt } = useStore();

  if (!languagePrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1300] bg-black/60 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-gunmetal border-2 border-brass max-w-md w-full p-6"
        >
          <p className="font-ops text-xl text-amber-glow tracking-widest mb-2">
            SECTOR LANGUAGE DETECTED
          </p>
          <p className="font-mono text-base text-parchment mb-6 leading-relaxed">
            You entered <strong>{languagePrompt.sector}</strong>. Switch interface to{" "}
            <strong>Spanish</strong>, or continue in English?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setLanguage("es")}
              className="game-btn flex-1 py-3 font-stencil text-lg"
            >
              Español
            </button>
            <button
              onClick={() => dismissLanguagePrompt()}
              className="flex-1 py-3 border-2 border-brass font-stencil text-lg text-parchment hover:border-amber-glow"
            >
              English
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
