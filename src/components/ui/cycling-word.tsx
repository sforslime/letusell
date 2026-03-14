"use client";

import { useEffect, useState } from "react";

const WORDS = ["food", "jerseys", "bags", "accessories", "snacks", "merch", "stationery", "drinks"];
const INTERVAL = 2200;

export function CyclingWord() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % WORDS.length);
        setVisible(true);
      }, 300);
    }, INTERVAL);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      style={{
        display: "inline-block",
        transition: "opacity 0.5s ease, transform 0.5s ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-8px)",
      }}
    >
      {WORDS[index]}
    </span>
  );
}
