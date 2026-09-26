import * as React from "react";
import { MorphIcon } from "morphicons/react";
import type { DynamicIconData } from "@/lib/dynamic-icons/types";

type Props = Omit<React.ComponentProps<typeof MorphIcon>, "icon" | "from" | "to"> & {
  icon: DynamicIconData;
  active: boolean;
};

export function DynamicIcon({ icon, active, ...props }: Props) {
  return <MorphIcon {...props} icon={active ? icon.on : icon.off} />;
}
