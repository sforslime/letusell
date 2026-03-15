"use client";

import { useEffect, useState } from "react";

const WORDS = ["fashion", "food", "beauty", "gadgets", "accessories", "merch", "stationery", "services"];
const TYPE_SPEED = 90;   // ms per character typed
const DELETE_SPEED = 50; // ms per character deleted
const PAUSE_AFTER_TYPE = 1600; // ms to hold before deleting
const PAUSE_AFTER_DELETE = 300; // ms to hold before next word

export function CyclingWord() {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting" | "waiting">("typing");

  useEffect(() => {
    const word = WORDS[wordIndex];

    if (phase === "typing") {
      if (displayed.length < word.length) {
        const id = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), TYPE_SPEED);
        return () => clearTimeout(id);
      } else {
        const id = setTimeout(() => setPhase("deleting"), PAUSE_AFTER_TYPE);
        return () => clearTimeout(id);
      }
    }

    if (phase === "deleting") {
      if (displayed.length > 0) {
        const id = setTimeout(() => setDisplayed(displayed.slice(0, -1)), DELETE_SPEED);
        return () => clearTimeout(id);
      } else {
        const id = setTimeout(() => {
          setWordIndex((i) => (i + 1) % WORDS.length);
          setPhase("typing");
        }, PAUSE_AFTER_DELETE);
        return () => clearTimeout(id);
      }
    }
  }, [displayed, phase, wordIndex]);

  return (
    <span className="relative inline-block">
      {displayed}
      <span
        className="ml-[2px] inline-block w-[3px] align-middle bg-white"
        style={{
          height: "0.85em",
          animation: "blink 1s step-start infinite",
        }}
      />
      <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`}</style>
    </span>
  );
}
