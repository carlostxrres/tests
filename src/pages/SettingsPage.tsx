import { LogOutIcon, MonitorIcon, MoonIcon, SunIcon, Trash2Icon, UserIcon } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";
import { useConfirm } from "@/hooks/useConfirm";
import { type Theme, useTheme } from "@/hooks/useTheme";
import { useResetUserData } from "@/lib/queries/tests";
import { supabase } from "@/lib/supabase";
import { notify, notifyError } from "@/lib/toast";

const themes: { value: Theme; label: string; icon: typeof SunIcon }[] = [
  { value: "system", label: "Sistema", icon: MonitorIcon },
  { value: "light", label: "Claro", icon: SunIcon },
  { value: "dark", label: "Oscuro", icon: MoonIcon },
];

export function SettingsPage() {
  const { session } = useAuth();
  const { theme, setTheme } = useTheme();
  const { confirm, dialog } = useConfirm();
  const reset = useResetUserData();

  async function handleReset() {
    const ok = await confirm({
      title: "¿Borrar todos tus datos?",
      description:
        "Se eliminan todos tus tests y respuestas. Los exámenes, unidades y preguntas no se tocan, ni tu cuenta. Esta acción no se puede deshacer.",
      confirmLabel: "Borrar todo",
      destructive: true,
    });
    if (!ok) return;
    try {
      await reset.mutateAsync();
      notify("Datos borrados");
    } catch (error) {
      notifyError(error, "No se han podido borrar los datos");
    }
  }

  return (
    <>
      <PageHeader title="Ajustes" />
      <div className="flex flex-col gap-4 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="size-4" />
              Cuenta
            </CardTitle>
            <CardDescription>{session?.user.email}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => supabase.auth.signOut()}>
              <LogOutIcon data-icon="inline-start" />
              Cerrar sesión
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Apariencia</CardTitle>
            <CardDescription>Tema de la aplicación.</CardDescription>
          </CardHeader>
          <CardContent>
            <ButtonGroup aria-label="Tema">
              {themes.map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={theme === value ? "secondary" : "outline"}
                  aria-pressed={theme === value}
                  onClick={() => setTheme(value)}
                >
                  <Icon data-icon="inline-start" />
                  {label}
                </Button>
              ))}
            </ButtonGroup>
          </CardContent>
        </Card>

        <Card className="ring-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Zona peligrosa</CardTitle>
            <CardDescription>
              Borra todos tus tests y respuestas. Las preguntas y tu cuenta se conservan.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="destructive" onClick={handleReset} disabled={reset.isPending}>
              {reset.isPending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <Trash2Icon data-icon="inline-start" />
              )}
              Resetear todos los datos
            </Button>
          </CardFooter>
        </Card>
      </div>
      {dialog}
    </>
  );
}
