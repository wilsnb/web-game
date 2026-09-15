"use client";

import { useEffect, useRef, useState } from "react";

interface Stat {
  /** Numeric target to count up to; null for non-numeric values like "1–7". */
  target: number | null;
  /** Text shown before the number (e.g. nothing). */
  prefix?: string;
  /** Text shown after the number (e.g. "+"). */
  suffix?: string;
  /** Static display used when target is null. */
  staticValue?: string;
  label: string;
}

/**
 * Metrics row with a count-up animation. When the bar scrolls into view, the
 * numeric stats animate from 0 up to their target once.
 */
export function StatsBar({ gameCount }: { gameCount: number }) {
  const stats: Stat[] = [
    { target: 10000, suffix: "+", label: "Games played" },
    { target: gameCount, label: "Games available" },
    { target: null, staticValue: "1–7", label: "Players per game" },
  ];

  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    // Respect reduced-motion: show final numbers immediately.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="border-y border-at-hairline bg-at-canvas/70 backdrop-blur-sm"
    >
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-lg px-md py-xl sm:grid-cols-3 sm:px-lg">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="font-haas text-at-display-md font-normal text-at-ink">
              {s.target === null ? (
                s.staticValue
              ) : (
                <>
                  {s.prefix}
                  <CountUp target={s.target} run={visible} />
                  {s.suffix}
                </>
              )}
            </div>
            <div className="mt-xxs font-haas text-at-body-md text-at-muted">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Counts from 0 to `target` over ~1.2s using requestAnimationFrame easing. */
function CountUp({ target, run }: { target: number; run: boolean }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!run) return;
    const duration = 1200;
    let start: number | null = null;
    let raf = 0;

    function tick(now: number) {
      if (start === null) start = now;
      const progress = Math.min((now - start) / duration, 1);
      // easeOutCubic for a natural deceleration.
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, target]);

  return <>{value.toLocaleString()}</>;
}
