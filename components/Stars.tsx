export function Stars({ score }: { score: number }) {
  const full = Math.floor(score);
  const half = score - full >= 0.5;
  return (
    <span className="inline-flex items-center gap-0.5 text-lg" title={`${score.toFixed(1)} / 5`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < full || (i === full && half);
        return (
          <span key={i} className={filled ? "text-gabon-yellow" : "text-black/20"}>
            ★
          </span>
        );
      })}
    </span>
  );
}
