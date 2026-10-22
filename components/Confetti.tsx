"use client";

export function Confetti({ show }: { show: boolean }) {
  if (!show) return null;
  const bits = Array.from({ length: 48 });
  const colors = ["#009e60", "#fcd116", "#3a75c4", "#ff6b00", "#fff"];
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {bits.map((_, i) => (
        <span
          key={i}
          className="absolute top-0 h-3 w-2 rounded-sm"
          style={{
            left: `${(i * 7) % 100}%`,
            background: colors[i % colors.length],
            animation: `confetti-fall ${2 + (i % 5) * 0.25}s linear ${i * 0.04}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
