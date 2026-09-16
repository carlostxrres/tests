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

// Thin wrapper over Select for the small "filter by X" dropdowns.
export function StatusSelect<T extends string>({
  value,
  onValueChange,
  options,
  placeholder,
  className,
  ...props
}: Props<T>) {
  return (
    <Select
      items={options}
      value={value}
      onValueChange={(next) => onValueChange((next ?? "") as T)}
    >
      <SelectTrigger size="sm" className={className} aria-label={props["aria-label"]}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
