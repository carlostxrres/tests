import { Cell, Pie, PieChart } from "recharts";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

const config = {
  correct: { label: "Correctas", color: "var(--chart-1)" },
  incorrect: { label: "Incorrectas", color: "var(--chart-2)" },
  unanswered: { label: "Sin responder", color: "var(--chart-3)" },
} satisfies ChartConfig;

type Props = {
  correct: number;
  incorrect: number;
  unanswered?: number;
  className?: string;
  // Diameter in px.
  size?: number;
};

// Small donut with the correct ratio in the middle. Renders an empty ring when
// there is nothing to show.
export function CorrectRatioChart({
  correct,
  incorrect,
  unanswered = 0,
  className,
  size = 56,
}: Props) {
  const answered = correct + incorrect;
  const ratio = answered > 0 ? Math.round((correct / answered) * 100) : null;
  const data =
    answered + unanswered > 0
      ? [
          { key: "correct", value: correct },
          { key: "incorrect", value: incorrect },
          { key: "unanswered", value: unanswered },
        ].filter((d) => d.value > 0)
      : [{ key: "empty", value: 1 }];

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <ChartContainer config={config} className="aspect-square h-full w-full">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="key"
            innerRadius="68%"
            outerRadius="100%"
            strokeWidth={0}
            isAnimationActive={false}
          >
            {data.map((d) => (
              <Cell
                key={d.key}
                fill={d.key === "empty" ? "var(--muted)" : `var(--color-${d.key})`}
              />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <output
        className="absolute inset-0 flex items-center justify-center font-mono text-[11px] font-medium tabular-nums"
        aria-label={ratio === null ? "Sin datos" : `${ratio}% correctas`}
      >
        {ratio === null ? "–" : `${ratio}%`}
      </output>
    </div>
  );
}
