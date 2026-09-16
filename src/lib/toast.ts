import { toast } from "@/components/ui/toast";

export function notify(title: string, description?: string) {
  toast.add({ title, description, type: "success" });
}

export function notifyError(error: unknown, fallback = "Algo ha fallado") {
  const description = error instanceof Error ? error.message : undefined;
  toast.add({ title: fallback, description, type: "error" });
}
