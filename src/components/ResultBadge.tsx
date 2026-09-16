import { CheckIcon, MinusIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Result } from "@/lib/types";
import { cn } from "@/lib/utils";

export const resultLabels: Record<Result, string> = {
  correct: "Correcta",
  incorrect: "Incorrecta",
  unanswered: "Sin responder",
};

const resultIcons = { correct: CheckIcon, incorrect: XIcon, unanswered: MinusIcon } as const;

// Tailwind classes per result, reused by the test grid and option list.
export const resultClasses: Record<Result, string> = {
  correct: "bg-success/15 text-success border-success/30",
  incorrect: "bg-destructive/10 text-destructive border-destructive/30",
  unanswered: "bg-muted text-muted-foreground border-border",
};

export function ResultBadge({
  result,
  className,
  iconOnly = false,
}: {
  result: Result;
  className?: string;
  iconOnly?: boolean;
}) {
  const Icon = resultIcons[result];
  return (
    <Badge
      variant="outline"
      className={cn(resultClasses[result], iconOnly && "size-5 px-0", className)}
      aria-label={iconOnly ? resultLabels[result] : undefined}
    >
      <Icon />
      {!iconOnly && resultLabels[result]}
    </Badge>
  );
}
