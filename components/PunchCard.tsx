"use client";

export function PunchCard({
  total,
  paidDays,
  winDay,
}: {
  total: number;
  paidDays: Set<number>;
  winDay: number | null;
}) {
  return (
    <div className="rounded-3xl border-4 border-dashed border-gabon-green bg-white p-4 shadow-card">
      <p className="mb-3 text-center text-xs font-black uppercase tracking-widest text-gabon-green">
        Carte tontine — perfore chaque jour
      </p>
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">
        {Array.from({ length: total }).map((_, i) => {
          const d = i + 1;
          const paid = paidDays.has(d);
          const win = winDay === d;
          return (
            <div
              key={d}
              className={`grid aspect-square place-items-center rounded-xl border-2 text-sm font-black ${
                win
                  ? "border-gabon-blue bg-gabon-blue text-white"
                  : paid
                    ? "border-gabon-green bg-gabon-green text-white"
                    : "border-black/10 bg-market-cream text-black/40"
              }`}
            >
              {win ? "★" : d}
            </div>
          );
        })}
      </div>
    </div>
  );
}
