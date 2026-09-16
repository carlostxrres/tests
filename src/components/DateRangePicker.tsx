import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, XIcon } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Props = {
  from: string; // yyyy-MM-dd or ""
  to: string; // yyyy-MM-dd or ""
  onChange: (range: { from: string; to: string }) => void;
  className?: string;
};

const toIso = (date: Date | undefined) => (date ? format(date, "yyyy-MM-dd") : "");
const fromIso = (value: string) => (value ? parseISO(value) : undefined);

// Range picker whose value lives in the URL as two ISO dates.
export function DateRangePicker({ from, to, onChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const range: DateRange | undefined = from ? { from: fromIso(from), to: fromIso(to) } : undefined;
  const label = range?.from
    ? range.to
      ? `${format(range.from, "d MMM", { locale: es })} – ${format(range.to, "d MMM", { locale: es })}`
      : format(range.from, "d MMM yyyy", { locale: es })
    : "Fechas";

  return (
    <ButtonGroup className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className={cn("min-w-0 flex-1 justify-start", !range && "text-muted-foreground")}
            />
          }
        >
          <CalendarIcon data-icon="inline-start" />
          <span className="truncate">{label}</span>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            locale={es}
            selected={range}
            defaultMonth={range?.from}
            numberOfMonths={1}
            onSelect={(next) => {
              onChange({ from: toIso(next?.from), to: toIso(next?.to) });
              if (next?.from && next?.to) setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {range && (
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Quitar fechas"
          onClick={() => onChange({ from: "", to: "" })}
        >
          <XIcon />
        </Button>
      )}
    </ButtonGroup>
  );
}
