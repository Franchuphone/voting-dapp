"use client";

import { useEffect, useState } from "react";

export default function MouseGlow() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let hasTarget = false;
    let raf = 0;
    let visible = false;

    const EASE = 0.12;

    const tick = () => {
      currentX += (targetX - currentX) * EASE;
      currentY += (targetY - currentY) * EASE;
      setPos({ x: currentX, y: currentY });

      if (
        hasTarget &&
        (Math.abs(targetX - currentX) > 0.2 || Math.abs(targetY - currentY) > 0.2)
      ) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    const onMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!hasTarget) {
        currentX = targetX;
        currentY = targetY;
        hasTarget = true;
      }
      if (!visible) {
        visible = true;
        setPos({ x: currentX, y: currentY });
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onLeave = () => {
      visible = false;
      setPos(null);
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="mouse-glow"
      style={
        pos
          ? {
              opacity: 1,
              ["--mx" as string]: `${pos.x}px`,
              ["--my" as string]: `${pos.y}px`,
            }
          : { opacity: 0 }
      }
    />
  );
}
