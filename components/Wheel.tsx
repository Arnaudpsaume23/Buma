"use client";

import { useMemo } from "react";

export function Wheel({
  names,
  spinning,
  winnerIndex,
}: {
  names: string[];
  spinning: boolean;
  winnerIndex: number;
}) {
  const slices = Math.max(names.length, 1);
  const gradient = useMemo(() => {
    const colors = ["#009e60", "#fcd116", "#3a75c4", "#ff6b00"];
    const step = 360 / slices;
    return names
      .map((_, i) => `${colors[i % colors.length]} ${i * step}deg ${(i + 1) * step}deg`)
      .join(",");
  }, [names, slices]);

  const extra = spinning ? 0 : winnerIndex >= 0 ? (360 / slices) * winnerIndex : 0;

  return (
    <div className="relative mx-auto h-72 w-72">
      <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 text-4xl">▼</div>
      <div
        className={`h-full w-full rounded-full border-8 border-white shadow-giant ${spinning ? "wheel-spin" : ""}`}
        style={{
          background: `conic-gradient(${gradient})`,
          transform: spinning ? undefined : `rotate(${-extra}deg)`,
        }}
      />
      <div className="absolute inset-16 grid place-items-center rounded-full bg-white text-center shadow-card">
        <div>
          <p className="text-xs font-black uppercase text-gabon-green">Loto Buma</p>
          <p className="font-display text-3xl">{slices}</p>
          <p className="text-xs font-bold">éligibles</p>
        </div>
      </div>
    </div>
  );
}
