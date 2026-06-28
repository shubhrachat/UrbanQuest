let audioCtx: AudioContext | null = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function tone(freq: number, duration: number, type: OscillatorType = "square", vol = 0.08) {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = vol;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export const sfx = {
  click: () => tone(440, 0.08, "square", 0.05),
  powerOn: () => {
    tone(120, 0.15, "sawtooth", 0.06);
    setTimeout(() => tone(280, 0.12, "square", 0.05), 80);
    setTimeout(() => tone(520, 0.2, "sine", 0.04), 160);
  },
  elevate: () => {
    tone(300, 0.1, "square", 0.07);
    setTimeout(() => tone(450, 0.1, "square", 0.07), 100);
    setTimeout(() => tone(600, 0.15, "sine", 0.06), 200);
  },
  deploy: () => {
    tone(180, 0.2, "sawtooth", 0.06);
    setTimeout(() => tone(90, 0.3, "sine", 0.08), 150);
  },
  alert: () => {
    tone(660, 0.12, "square", 0.06);
    setTimeout(() => tone(440, 0.12, "square", 0.06), 140);
  },
  cardPick: () => tone(350, 0.06, "triangle", 0.05),
};
