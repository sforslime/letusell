"use client";

import { useCallback, useRef } from "react";

export function useOrderSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSound = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Two-tone ding: 880 Hz then 1100 Hz
      const playTone = (freq: number, startAt: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.4, ctx.currentTime + startAt);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startAt + duration);
        osc.start(ctx.currentTime + startAt);
        osc.stop(ctx.currentTime + startAt + duration);
      };

      playTone(880, 0, 0.3);
      playTone(1100, 0.2, 0.3);
    } catch {
      // Audio not available
    }
  }, []);

  return { playSound };
}
