"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";

export default function AuthPortal() {
  const { login, verify2FA, pending2FA, demoLogin } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<"intro" | "login" | "2fa">("intro");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login(email, password)) {
      setError("Invalid credentials");
      return;
    }
    setStep("2fa");
    setError("");
  };

  const handle2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verify2FA(code)) {
      setError("Enter a valid code (any 4+ digits for demo)");
      return;
    }
    setError("");
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gunmetal-dark flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 40%, #4a5d23 0%, transparent 50%), radial-gradient(circle at 70% 60%, #c47a2c 0%, transparent 40%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg mx-4"
      >
        <div className="border-2 border-brass bg-gunmetal p-8 shadow-2xl">
          <div className="text-center mb-8">
            <motion.h1
              className="font-ops text-4xl tracking-widest text-parchment mb-2"
              initial={{ letterSpacing: "0.5em", opacity: 0 }}
              animate={{ letterSpacing: "0.15em", opacity: 1 }}
              transition={{ duration: 1 }}
            >
              URBANQUEST
            </motion.h1>
            <p className="font-mono text-xs text-brass tracking-[0.3em] uppercase">
              Civic Mission Control System
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === "intro" && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="crt-screen p-6 text-center">
                  <p className="font-mono text-sm text-amber-glow animate-flicker">
                    CLASSIFIED — CITIZEN OPERATIVE REGISTRATION
                  </p>
                  <p className="font-mono text-xs text-parchment/60 mt-4 leading-relaxed">
                    Deploy into your sector. Report infrastructure threats.
                    Verify field intelligence. Track resolution status.
                  </p>
                </div>

                <button
                  onClick={() => setStep("login")}
                  className="game-btn w-full py-4 text-lg font-stencil"
                >
                  Enter Operations
                </button>

                <button
                  onClick={demoLogin}
                  className="w-full py-3 border border-brass/40 text-brass font-mono text-xs tracking-widest uppercase hover:border-amber-glow hover:text-amber-glow transition-colors"
                >
                  Demo Access — Skip Registration
                </button>
              </motion.div>
            )}

            {step === "login" && !pending2FA && (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <div>
                  <label className="font-stencil text-sm text-brass tracking-widest block mb-2">
                    Operative Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gunmetal-dark border border-brass/50 px-4 py-3 font-mono text-parchment focus:border-amber-glow focus:outline-none"
                    placeholder="operative@sector.io"
                    required
                  />
                </div>
                <div>
                  <label className="font-stencil text-sm text-brass tracking-widest block mb-2">
                    Access Code
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gunmetal-dark border border-brass/50 px-4 py-3 font-mono text-parchment focus:border-amber-glow focus:outline-none"
                    placeholder="********"
                    required
                  />
                </div>
                {error && (
                  <p className="text-severity-high text-xs font-mono">{error}</p>
                )}
                <button type="submit" className="game-btn w-full py-3 font-stencil text-lg">
                  Authenticate
                </button>
                <button
                  type="button"
                  onClick={demoLogin}
                  className="w-full py-2 text-brass/60 font-mono text-xs hover:text-brass"
                >
                  or use demo access
                </button>
              </motion.form>
            )}

            {(step === "2fa" || pending2FA) && (
              <motion.form
                key="2fa"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                onSubmit={handle2FA}
                className="space-y-4"
              >
                <div className="crt-screen p-4 mb-4">
                  <p className="font-mono text-xs text-amber-glow">
                    2FA REQUIRED — Enter verification code sent to your device
                  </p>
                  <p className="font-mono text-[10px] text-parchment/40 mt-2">
                    Demo: enter any 4+ digit code
                  </p>
                </div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-gunmetal-dark border border-brass/50 px-4 py-3 font-mono text-2xl text-center text-parchment tracking-[0.5em] focus:border-amber-glow focus:outline-none"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
                {error && (
                  <p className="text-severity-high text-xs font-mono">{error}</p>
                )}
                <button type="submit" className="game-btn w-full py-3 font-stencil text-lg">
                  Verify Identity
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
