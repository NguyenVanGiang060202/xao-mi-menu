"use client";

import { useEffect, useRef, type ComponentProps, type PointerEvent } from "react";

type Position = { x: number; y: number };
const keySteps: Record<string, Position> = {
  ArrowLeft: { x: -6, y: 0 },
  ArrowRight: { x: 6, y: 0 },
  ArrowUp: { x: 0, y: -6 },
  ArrowDown: { x: 0, y: 6 },
};
const origin = { x: 0, y: 0 };

export function MovableSticker({ className, label, ...props }: ComponentProps<"button"> & {
  label: string;
}) {
  const position = useRef<Position>(origin);
  const drag = useRef<{ pointer: number; start: Position; offset: Position } | null>(null);
  const frame = useRef(0);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  function move(button: HTMLButtonElement, next: Position) {
    position.current = next;
    button.style.setProperty("--sticker-x", `${next.x}px`);
    button.style.setProperty("--sticker-y", `${next.y}px`);
  }

  function stopSpring(button: HTMLButtonElement) {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    delete button.dataset.springing;
  }

  function springHome(button: HTMLButtonElement) {
    stopSpring(button);
    const offset = position.current;
    if (Math.hypot(offset.x, offset.y) < 1 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      move(button, origin);
      return;
    }

    const start = performance.now();
    button.dataset.springing = "true";
    function settle(now: number) {
      const seconds = Math.max(0, now - start) / 1000;
      if (seconds >= 0.7) {
        move(button, origin);
        stopSpring(button);
        return;
      }
      // A damped spring starts at rest, overshoots, then settles at zero.
      const phase = seconds * 16;
      const displacement = Math.exp(-seconds * 10) * (Math.cos(phase) + 0.625 * Math.sin(phase));
      move(button, { x: offset.x * displacement, y: offset.y * displacement });
      frame.current = requestAnimationFrame(settle);
    }
    frame.current = requestAnimationFrame(settle);
  }

  function startDrag(event: PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    const button = event.currentTarget;
    stopSpring(button);
    drag.current = {
      pointer: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
      offset: position.current,
    };
    button.setPointerCapture(event.pointerId);
    button.dataset.dragging = "true";
  }

  function finishDrag(event: PointerEvent<HTMLButtonElement>) {
    if (drag.current?.pointer !== event.pointerId) return;
    drag.current = null;
    delete event.currentTarget.dataset.dragging;
    springHome(event.currentTarget);
  }

  return <button
    {...props}
    type="button"
    className={`menu-movable-sticker ${className ?? ""}`}
    aria-label={label}
    aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Home"
    onPointerDown={startDrag}
    onPointerMove={event => {
      const active = drag.current;
      if (active?.pointer !== event.pointerId) return;
      move(event.currentTarget, {
        x: active.offset.x + event.clientX - active.start.x,
        y: active.offset.y + event.clientY - active.start.y,
      });
    }}
    onPointerUp={finishDrag}
    onPointerCancel={finishDrag}
    onLostPointerCapture={finishDrag}
    onKeyDown={event => {
      if (event.key === "Home") {
        event.preventDefault();
        springHome(event.currentTarget);
      } else {
        const step = keySteps[event.key];
        if (!step) return;
        event.preventDefault();
        move(event.currentTarget, { x: position.current.x + step.x, y: position.current.y + step.y });
        springHome(event.currentTarget);
      }
    }}
    onClick={event => { if (event.detail === 0) springHome(event.currentTarget); }}
  />;
}
