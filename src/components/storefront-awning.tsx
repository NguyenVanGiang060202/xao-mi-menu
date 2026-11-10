"use client";

import { useEffect, useRef, type PointerEvent } from "react";

const seamHeight = 2;

function clearRipple(fabric: HTMLDivElement | null) {
  if (!fabric) return;
  fabric.style.removeProperty("clip-path");
  delete fabric.dataset.rippling;
}

function sampleHem(width: number, height: number, stripeWidth: number) {
  const step = stripeWidth / 10;
  return Array.from({ length: Math.ceil(width / step) + 1 }, (_, index) => {
    const x = Math.min(width, index * step);
    const scallop = (x % stripeWidth) / stripeWidth * 2 - 1;
    return { x: x.toFixed(2), position: x, drop: (height - seamHeight) * Math.sqrt(Math.max(0, 1 - scallop ** 2)) };
  }).reverse();
}

export function StorefrontAwning() {
  const valance = useRef<HTMLDivElement>(null);
  const breeze = useRef({
    frame: 0, time: 0, width: 0, stripeWidth: 0, height: 0,
    center: 0, target: 0, strength: 0, targetStrength: 0,
    hem: [] as ReturnType<typeof sampleHem>,
  });

  useEffect(() => {
    const state = breeze.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    function stopForReducedMotion() {
      if (!motion.matches) return;
      cancelAnimationFrame(state.frame);
      state.frame = 0;
      state.strength = 0;
      state.targetStrength = 0;
      clearRipple(valance.current);
    }
    motion.addEventListener("change", stopForReducedMotion);
    return () => {
      motion.removeEventListener("change", stopForReducedMotion);
      cancelAnimationFrame(state.frame);
    };
  }, []);

  function ripple(now: number) {
    const fabric = valance.current;
    const state = breeze.current;
    if (!fabric) return;

    const elapsed = Math.max(0, Math.min(now - state.time, 50));
    state.time = now;
    state.center += (state.target - state.center) * (1 - Math.exp(-elapsed / 90));
    const response = state.targetStrength ? 95 : 180;
    state.strength += (state.targetStrength - state.strength) * (1 - Math.exp(-elapsed / response));

    if (!state.targetStrength && state.strength < 0.008) {
      state.frame = 0;
      state.strength = 0;
      clearRipple(fabric);
      return;
    }

    // Sample the same wave across the full hem so neighboring stripes bend together.
    const bottom = state.hem.map(point => {
      const distance = Math.abs(point.position - state.center) / state.stripeWidth;
      const falloff = Math.exp(-(distance * distance) / 18);
      const wave = Math.sin(now / 105 - distance * 1.55);
      const lift = falloff * state.strength * (0.25 + wave * 0.75);
      return `${point.x} ${(seamHeight + point.drop * (1 - lift)).toFixed(2)}`;
    });
    fabric.style.clipPath = `path("M 0 0 H ${state.width} L ${bottom.join(" L ")} Z")`;
    if (!fabric.dataset.rippling) fabric.dataset.rippling = "true";
    state.frame = requestAnimationFrame(ripple);
  }

  function followPointer(event: PointerEvent<HTMLDivElement>) {
    const fabric = valance.current;
    const hemHeight = fabric?.parentElement?.clientHeight;
    if (!fabric || !hemHeight || event.pointerType === "touch") return;

    const state = breeze.current;
    const rect = event.currentTarget.getBoundingClientRect();
    if (state.width !== fabric.clientWidth || state.height !== hemHeight) {
      const stripeWidth = parseFloat(getComputedStyle(fabric).backgroundSize.split(",")[1]) / 2;
      if (!stripeWidth) return;
      state.width = fabric.clientWidth;
      state.height = hemHeight;
      state.stripeWidth = stripeWidth;
      state.hem = sampleHem(state.width, state.height, stripeWidth);
    }
    state.target = event.clientX - rect.left;
    const depth = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    state.targetStrength = 0.7 + depth * 0.14;
    if (!state.frame) {
      state.center = state.target;
      state.time = performance.now();
      state.frame = requestAnimationFrame(ripple);
    }
  }

  return <div className="menu-awning" aria-hidden="true" onPointerMove={followPointer} onPointerLeave={() => { breeze.current.targetStrength = 0; }}>
    <div className="menu-awning-fabric" />
    <div className="menu-awning-front"><div ref={valance} className="menu-awning-valance" /></div>
  </div>;
}
