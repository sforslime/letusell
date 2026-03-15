"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function HomeAnimations() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      // ── Hero (immediate, no scroll trigger) ─────────────────────────
      const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });

      heroTl
        .from(".hero-badge", { y: -24, opacity: 0, duration: 0.6 })
        .from(".hero-heading", { y: 36, opacity: 0, duration: 0.75 }, "-=0.3")
        .from(".hero-sub", { y: 24, opacity: 0, duration: 0.65 }, "-=0.45")
        .from(".hero-search", { y: 20, opacity: 0, duration: 0.6 }, "-=0.4")
        .from(".hero-stats", { y: 16, opacity: 0, duration: 0.55 }, "-=0.35");

      // Floating decorative circles
      gsap.to(".hero-circle-1", {
        y: -100,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      gsap.to(".hero-circle-2", {
        y: 14,
        duration: 5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 0.8,
      });
      gsap.to(".hero-circle-3", {
        y: -10,
        duration: 3.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 0.4,
      });

      // ── Vendors section ──────────────────────────────────────────────
      gsap.from(".vendors-heading", {
        immediateRender: false,
        scrollTrigger: { trigger: ".vendors-heading", start: "top 88%" },
        y: 32,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
      });

      gsap.from(".vendor-card-animate", {
        immediateRender: false,
        scrollTrigger: { trigger: ".vendor-card-animate", start: "top 90%" },
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power3.out",
      });

      // ── How it works ─────────────────────────────────────────────────
      gsap.from(".how-heading", {
        immediateRender: false,
        scrollTrigger: { trigger: ".how-heading", start: "top 88%" },
        y: 28,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
      });

      gsap.from(".how-card", {
        immediateRender: false,
        scrollTrigger: { trigger: ".how-card", start: "top 90%" },
        y: 44,
        opacity: 0,
        duration: 0.65,
        stagger: 0.15,
        ease: "power3.out",
      });

      // ── CTA banner ───────────────────────────────────────────────────
      gsap.from(".cta-banner", {
        immediateRender: false,
        scrollTrigger: { trigger: ".cta-banner", start: "top 88%" },
        y: 36,
        opacity: 0,
        scale: 0.97,
        duration: 0.75,
        ease: "power3.out",
      });
    });

    return () => ctx.revert();
  }, []);

  return null;
}
