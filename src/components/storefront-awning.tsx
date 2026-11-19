"use client";

import { useEffect, useRef, type PointerEvent } from "react";

const seamHeight = 2;
// Degrees of phone tilt that slide the wave from the centre to either edge of the hem.
const tiltRange = 35;
// How long a finger tap keeps the awning fluttering.
const tapDuration = 650;

type MotionPermission = { requestPermission?: () => Promise<"granted" | "denied"> };

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
  const root = useRef<HTMLDivElement>(null);
  const valance = useRef<HTMLDivElement>(null);
  const breeze = useRef({
    frame: 0, time: 0, width: 0, stripeWidth: 0, height: 0,
    center: 0, target: 0, strength: 0, targetStrength: 0,
    hem: [] as ReturnType<typeof sampleHem>,
    reduced: false, visible: true, tapTimer: 0, lastTilt: 0, tiltEnergy: 0,
  });

  // Reads the hem geometry once, and again only after the awning was resized.
  function measure() {
    const fabric = valance.current;
    const hemHeight = fabric?.parentElement?.clientHeight;
    if (!fabric || !hemHeight) return false;
    const state = breeze.current;
    if (state.width !== fabric.clientWidth || state.height !== hemHeight) {
      const stripeWidth = parseFloat(getComputedStyle(fabric).backgroundSize.split(",")[1]) / 2;
      if (!stripeWidth) return false;
      state.width = fabric.clientWidth;
      state.height = hemHeight;
      state.stripeWidth = stripeWidth;
      state.hem = sampleHem(state.width, state.height, stripeWidth);
    }
    return true;
  }

  // Starts the animation loop if it is idle and something wants the awning to move.
  function kick() {
    const state = breeze.current;
    if (state.frame || state.reduced || !state.targetStrength || !measure()) return;
    state.center = state.target;
    state.time = performance.now();
    state.frame = requestAnimationFrame(ripple);
  }

  useEffect(() => {
    const state = breeze.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const touchScreen = window.matchMedia("(pointer: coarse)");
    state.reduced = motion.matches;

    function stopForReducedMotion() {
      state.reduced = motion.matches;
      if (!motion.matches) return;
      cancelAnimationFrame(state.frame);
      state.frame = 0;
      state.strength = 0;
      state.targetStrength = 0;
      clearRipple(valance.current);
    }
    motion.addEventListener("change", stopForReducedMotion);

    // Resizing invalidates the cached hem; leaving the screen calms the awning down.
    const resize = new ResizeObserver(() => { state.width = 0; });
    const visibility = new IntersectionObserver(([entry]) => {
      state.visible = entry.isIntersecting;
      if (!state.visible) state.targetStrength = 0;
    });
    if (root.current) {
      resize.observe(root.current);
      visibility.observe(root.current);
    }

    // Tilting the phone slides the wave left/right.
    function onTilt(event: DeviceOrientationEvent) {
      if (state.reduced || !state.visible) return;
      const landscape = Math.abs(window.screen.orientation?.angle ?? 0) % 180 === 90;
      const tilt = (landscape ? event.beta : event.gamma) ?? 0;
      state.tiltEnergy = Math.min(1, Math.abs(tilt - state.lastTilt) / 3);
      state.lastTilt = tilt;
      if (!state.width && !measure()) return;
      const share = Math.max(-0.5, Math.min(0.5, tilt / (tiltRange * 2)));
      state.target = (0.5 + share) * state.width;
    }

    // Walking, shaking or turning the phone sets how strongly the hem flutters.
    function onMove(event: DeviceMotionEvent) {
      if (state.reduced || !state.visible) return;
      const push = event.acceleration;
      const spin = event.rotationRate;
      const shake = Math.hypot(push?.x ?? 0, push?.y ?? 0, push?.z ?? 0) / 5;
      const turn = Math.hypot(spin?.alpha ?? 0, spin?.beta ?? 0, spin?.gamma ?? 0) / 150;
      state.tiltEnergy *= 0.9;
      const energy = Math.min(1, Math.max(shake + turn, state.tiltEnergy));
      state.targetStrength = energy < 0.06 ? 0 : 0.3 + energy * 0.55;
      kick();
    }

    let sensing = false;
    function startSensing() {
      if (sensing) return;
      sensing = true;
      window.addEventListener("deviceorientation", onTilt);
      window.addEventListener("devicemotion", onMove);
    }

    let stopAsking = () => {};
    if (touchScreen.matches && "DeviceMotionEvent" in window) {
      const sensor = window.DeviceMotionEvent as unknown as MotionPermission;
      if (typeof sensor.requestPermission === "function") {
        // iOS only hands out motion data after an explicit tap-to-allow.
        const ask = () => {
          sensor.requestPermission!()
            .then((answer) => {
              if (answer === "granted") startSensing();
              window.removeEventListener("click", ask);
            })
            .catch(() => {});
        };
        window.addEventListener("click", ask);
        stopAsking = () => window.removeEventListener("click", ask);
      } else {
        startSensing();
      }
    }

    return () => {
      motion.removeEventListener("change", stopForReducedMotion);
      resize.disconnect();
      visibility.disconnect();
      stopAsking();
      window.removeEventListener("deviceorientation", onTilt);
      window.removeEventListener("devicemotion", onMove);
      window.clearTimeout(state.tapTimer);
      cancelAnimationFrame(state.frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- every helper only touches stable refs
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
    if (event.pointerType === "touch" || !measure()) return;
    const state = breeze.current;
    const rect = event.currentTarget.getBoundingClientRect();
    state.target = event.clientX - rect.left;
    const depth = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    state.targetStrength = 0.7 + depth * 0.14;
    kick();
  }

  // A finger tap makes the hem flutter around the touch point, then settle.
  function tapAwning(event: PointerEvent<HTMLDivElement>) {
    const state = breeze.current;
    if (event.pointerType !== "touch" || !measure()) return;
    state.target = event.clientX - event.currentTarget.getBoundingClientRect().left;
    state.targetStrength = 0.85;
    window.clearTimeout(state.tapTimer);
    state.tapTimer = window.setTimeout(() => { state.targetStrength = 0; }, tapDuration);
    kick();
  }

  return <div ref={root} className="menu-awning" aria-hidden="true" onPointerMove={followPointer} onPointerDown={tapAwning} onPointerLeave={(event) => { if (event.pointerType !== "touch") breeze.current.targetStrength = 0; }}>
    <div className="menu-awning-fabric" />
    <div className="menu-awning-front"><div ref={valance} className="menu-awning-valance" /></div>
  </div>;
}
