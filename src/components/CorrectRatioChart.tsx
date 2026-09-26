import { lazy, Suspense } from "react";
import type { RingSlice } from "@/components/CorrectRatioRing";
import { cn } from "@/lib/utils";

const CorrectRatioRing = lazy(() =>
  import("@/components/CorrectRatioRing").then((m) => ({ default: m.CorrectRatioRing })),
);

// The ring sits between 68% and 100% of the radius, so it is 16% of the box wide.
const RING_WIDTH_RATIO = 0.16;

type Props = {
  correct: number;
  incorrect: number;
  unanswered?: number;
  className?: string;
  // Diameter in px.
  size?: number;
};

// Small donut with the correct ratio in the middle. Renders an empty ring when
// there is nothing to show. The percentage is painted right away; only the ring
// waits for the chart chunk.
export function CorrectRatioChart({
  correct,
  incorrect,
  unanswered = 0,
  className,
  size = 56,
}: Props) {
  const answered = correct + incorrect;
  const ratio = answered > 0 ? Math.round((correct / answered) * 100) : null;
  const data: RingSlice[] =
    answered + unanswered > 0
      ? [
          { key: "correct", value: correct },
          { key: "incorrect", value: incorrect },
          { key: "unanswered", value: unanswered },
        ].filter((d) => d.value > 0)
      : [{ key: "empty", value: 1 }];

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <Suspense
        fallback={
          <div
            className="size-full rounded-full border-muted"
            style={{ borderWidth: Math.round(size * RING_WIDTH_RATIO) }}
          />
        }
      >
        <CorrectRatioRing data={data} />
      </Suspense>
      <output
        className="absolute inset-0 flex items-center justify-center tracking-tighter text-xs font-medium tabular-nums"
        aria-label={ratio === null ? "Sin datos" : `${ratio}% correctas`}
      >
        {ratio === null ? "–" : `${ratio}%`}
      </output>
    </div>
  );
}
