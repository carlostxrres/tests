import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  // Rendered above the title (breadcrumb, back link…).
  eyebrow?: ReactNode;
  className?: string;
};

export function PageHeader({ title, description, actions, eyebrow, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-2 px-4 pt-6 pb-4", className)}>
      {eyebrow}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance">
            {title}
          </h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
