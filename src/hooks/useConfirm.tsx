import { useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

// Promise-based confirmation: `await confirm({...})` instead of wiring
// open-state and callbacks at each call site. One pending confirmation at a
// time, which is fine since callers await before asking again.
export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null);

  function confirm(next: ConfirmOptions): Promise<boolean> {
    setOptions(next);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }

  function resolveWith(confirmed: boolean) {
    resolveRef.current?.(confirmed);
    resolveRef.current = null;
    setOptions(null);
  }

  const dialog = (
    <AlertDialog open={options !== null} onOpenChange={(open) => !open && resolveWith(false)}>
      <AlertDialogContent>
        {options && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>{options.title}</AlertDialogTitle>
              <AlertDialogDescription>{options.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => resolveWith(false)}>
                {options.cancelLabel ?? "Cancelar"}
              </AlertDialogCancel>
              <AlertDialogAction
                variant={options.destructive ? "destructive" : "default"}
                onClick={() => resolveWith(true)}
              >
                {options.confirmLabel ?? "Continuar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirm, dialog };
}
