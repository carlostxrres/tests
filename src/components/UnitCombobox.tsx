import { useMemo } from "react";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from "@/components/ui/combobox";
import type { ExamWithUnits } from "@/lib/types";

export type UnitOption = { id: string; label: string; examName: string };

type Props = {
  exams: ExamWithUnits[] | undefined;
  value: string; // unit id or ""
  onValueChange: (unitId: string) => void;
  placeholder?: string;
  className?: string;
};

// Searchable unit picker grouped by exam; the value is the unit id.
export function UnitCombobox({ exams, value, onValueChange, placeholder, className }: Props) {
  const groups = useMemo(
    () =>
      (exams ?? []).map((exam) => ({
        value: exam.name,
        items: exam.units.map<UnitOption>((u) => ({
          id: u.id,
          label: `${u.number}. ${u.name}`,
          examName: exam.name,
        })),
      })),
    [exams],
  );
  const selected = useMemo(
    () => groups.flatMap((g) => g.items).find((u) => u.id === value) ?? null,
    [groups, value],
  );

  return (
    <Combobox
      items={groups}
      value={selected}
      onValueChange={(next: UnitOption | null) => onValueChange(next?.id ?? "")}
      itemToStringLabel={(item: UnitOption) => item.label}
      itemToStringValue={(item: UnitOption) => `${item.examName} ${item.label}`}
    >
      <ComboboxInput placeholder={placeholder ?? "Unidad"} showClear className={className} />
      <ComboboxContent>
        <ComboboxEmpty>Sin unidades.</ComboboxEmpty>
        <ComboboxList>
          {(group: { value: string; items: UnitOption[] }) => (
            <ComboboxGroup key={group.value} items={group.items}>
              <ComboboxLabel>{group.value}</ComboboxLabel>
              <ComboboxCollection>
                {(item: UnitOption) => (
                  <ComboboxItem key={item.id} value={item}>
                    {item.label}
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
