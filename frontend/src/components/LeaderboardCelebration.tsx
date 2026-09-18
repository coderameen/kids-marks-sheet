"use client";

import { useMemo, type CSSProperties } from "react";

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function CelebrationBackdrop({ active }: { active: boolean }) {
  const confetti = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        left: randomBetween(0, 100),
        delay: randomBetween(0, 2.5),
        duration: randomBetween(2.5, 4.5),
        hue: randomBetween(0, 360),
        size: randomBetween(6, 11),
        drift: randomBetween(-40, 40),
      })),
    []
  );

  const blasts = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        side: i % 2 === 0 ? "left" : "right",
        delay: randomBetween(0, 1.2),
        ty: randomBetween(-120, 80),
        tx: randomBetween(80, 220) * (i % 2 === 0 ? 1 : -1),
        hue: randomBetween(30, 320),
      })),
    []
  );

  if (!active) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl"
      aria-hidden
    >
      <div className="blaster-cannon blaster-cannon-left">🎉</div>
      <div className="blaster-cannon blaster-cannon-right">🎉</div>

      {blasts.map((b) => (
        <span
          key={`blast-${b.id}`}
          className={`blaster-particle ${b.side === "left" ? "from-left" : "from-right"}`}
          style={
            {
              "--blast-delay": `${b.delay}s`,
              "--blast-tx": `${b.tx}px`,
              "--blast-ty": `${b.ty}px`,
              "--blast-hue": b.hue,
            } as CSSProperties
          }
        />
      ))}

      {confetti.map((c) => (
        <span
          key={`conf-${c.id}`}
          className="confetti-bit"
          style={
            {
              left: `${c.left}%`,
              width: c.size,
              height: c.size * 0.6,
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
              background: `hsl(${c.hue} 90% 55%)`,
              "--confetti-drift": `${c.drift}px`,
            } as CSSProperties
          }
        />
      ))}

      <span className="cele-balloon cele-balloon-1">🎈</span>
      <span className="cele-balloon cele-balloon-2">🎈</span>
      <span className="cele-balloon cele-balloon-3">🎈</span>
      <span className="cele-flower cele-flower-1">🌸</span>
      <span className="cele-flower cele-flower-2">🌼</span>
      <span className="cele-flower cele-flower-3">🌺</span>
      <span className="cele-flower cele-flower-4">💐</span>
    </div>
  );
}

export function WinnersBanner({
  count,
  points,
}: {
  count: number;
  points: number;
}) {
  const title =
    count > 1
      ? `${count} Super Stars — Tied at ${points} points!`
      : "Champion of the week!";

  return (
    <div className="relative mb-4 overflow-hidden rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-100 via-yellow-50 to-pink-100 px-4 py-4 text-center shadow-lg sm:px-6">
      <div className="award-shine pointer-events-none absolute inset-0" aria-hidden />
      <p className="relative text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
        🏆 Winner zone 🏆
      </p>
      <h3 className="relative mt-1 font-display text-xl font-bold text-amber-900 sm:text-2xl">
        {title}
      </h3>
      <p className="relative mt-1 text-sm text-amber-800/90">
        {count > 1 ? (
          <>
            Tied at <strong>{points}</strong> star points — everyone gets the
            award! 🎊
          </>
        ) : (
          <>
            Leading with <strong>{points}</strong> star points — amazing! ✨
          </>
        )}
      </p>
    </div>
  );
}
