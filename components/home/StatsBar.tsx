/**
 * Metrics row. Numbers are placeholders for now except the real catalog game
 * count, which is passed in so it stays accurate.
 */
export function StatsBar({ gameCount }: { gameCount: number }) {
  const stats: Array<{ value: string; label: string }> = [
    { value: "10,000+", label: "Games played" },
    { value: String(gameCount), label: "Games available" },
    { value: "1–7", label: "Players per game" },
  ];

  return (
    <section className="border-y border-at-hairline bg-at-surface-soft">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-lg px-md py-xl sm:px-lg sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="font-haas text-at-display-md font-normal text-at-ink">
              {s.value}
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
