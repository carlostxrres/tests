import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  value: T;
  onValueChange: (value: T) => void;
  options: readonly Option<T>[];
  placeholder?: string;
  "aria-label": string;
  className?: string;
};

// An empty option value means "no filter"; Select gets a sentinel instead
// because "" is treated as "nothing selected".
const ALL = "__all__";

// Thin wrapper over Select for the small "filter by X" dropdowns.
export function StatusSelect<T extends string>({
  value,
  onValueChange,
  options,
  placeholder,
  className,
  ...props
}: Props<T>) {
  const items = options.map((o) => ({ value: o.value || ALL, label: o.label }));
  return (
    <Select
      items={items}
      value={value || ALL}
      onValueChange={(next) => onValueChange((next === ALL || next === null ? "" : next) as T)}
    >
      <SelectTrigger size="sm" className={className} aria-label={props["aria-label"]}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
