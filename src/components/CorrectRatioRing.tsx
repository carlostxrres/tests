import { Cell, Pie, PieChart } from "recharts";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";

const config = {
  correct: { label: "Correctas", color: "var(--chart-1)" },
  incorrect: { label: "Incorrectas", color: "var(--chart-2)" },
  unanswered: { label: "Sin responder", color: "var(--chart-3)" },
} satisfies ChartConfig;

export type RingSlice = { key: string; value: number };

// Split out of CorrectRatioChart so recharts stays in its own lazy chunk.
export function CorrectRatioRing({ data }: { data: RingSlice[] }) {
  return (
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
            <Cell key={d.key} fill={d.key === "empty" ? "var(--muted)" : `var(--color-${d.key})`} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
