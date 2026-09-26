import { SearchIcon, XIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

type Props = {
  value: string;
  // Receives null when cleared, so the caller can drop the query param.
  onValueChange: (value: string | null) => void;
  className?: string;
};

// The "buscar por examen, unidad o enunciado" box shared by the explore tables.
export function SearchInput({ value, onValueChange, className }: Props) {
  return (
    <InputGroup className={className}>
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        placeholder="Buscar por examen, unidad o enunciado"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
      />
      {value && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton aria-label="Limpiar" size="icon-xs" onClick={() => onValueChange(null)}>
            <XIcon />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}
