"use client";

import Link from "next/link";

export default function MonthNav({
  label,
  onPrev,
  onNext,
  prevHref,
  nextHref,
}: {
  label: string;
  onPrev?: () => void;
  onNext?: () => void;
  prevHref?: string;
  nextHref?: string;
}) {
  const btn = "grid min-h-11 min-w-11 place-items-center rounded-lg px-3 text-sm font-medium text-muted transition-all duration-150 hover:bg-canvas active:scale-95 md:min-h-0 md:min-w-0 md:py-1.5";
  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-hairline bg-surface p-1.5 shadow-sm">
      {prevHref ? <Link href={prevHref} className={btn}>←</Link> : <button type="button" onClick={onPrev} className={btn}>←</button>}
      <span className="min-w-[132px] text-center text-sm font-semibold text-ink">{label}</span>
      {nextHref ? <Link href={nextHref} className={btn}>→</Link> : <button type="button" onClick={onNext} className={btn}>→</button>}
    </div>
  );
}
