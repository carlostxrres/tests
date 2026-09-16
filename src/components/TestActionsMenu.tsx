import {
  CheckCircleIcon,
  CopyIcon,
  LogOutIcon,
  MoreHorizontalIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConfirm } from "@/hooks/useConfirm";
import { useDeleteTest, useFinishTest, useRestartTest } from "@/lib/queries/tests";
import { buildDuplicateParams, isFinished } from "@/lib/tests";
import { notify, notifyError } from "@/lib/toast";
import type { Test } from "@/lib/types";

type Props = {
  test: Test;
  // Inside the runner: show "Salir", and leave the runner after finishing or
  // deleting.
  inRunner?: boolean;
  triggerClassName?: string;
};

// Shared "Terminar / Reempezar / Duplicar / Eliminar" menu for test rows and
// the runner header.
export function TestActionsMenu({ test, inRunner = false, triggerClassName }: Props) {
  const navigate = useNavigate();
  const { confirm, dialog } = useConfirm();
  const finish = useFinishTest();
  const restart = useRestartTest();
  const remove = useDeleteTest();
  const finished = isFinished(test);

  async function handleFinish() {
    try {
      await finish.mutateAsync(test.id);
      notify("Test terminado");
      if (inRunner) navigate("/tests");
    } catch (error) {
      notifyError(error, "No se ha podido terminar el test");
    }
  }

  async function handleRestart() {
    const ok = await confirm({
      title: "¿Reempezar el test?",
      description:
        "Las respuestas dadas se desvinculan del test (siguen contando en tu historial) y el test vuelve a empezar de cero.",
      confirmLabel: "Reempezar",
    });
    if (!ok) return;
    try {
      await restart.mutateAsync(test.id);
      notify("Test reiniciado");
      navigate(`/tests/${test.id}`);
    } catch (error) {
      notifyError(error, "No se ha podido reiniciar el test");
    }
  }

  async function handleDelete() {
    const ok = await confirm({
      title: "¿Eliminar el test?",
      description:
        "El test desaparece de la lista. Tus respuestas se conservan en el historial, sin test asociado.",
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!ok) return;
    try {
      await remove.mutateAsync(test.id);
      notify("Test eliminado");
      if (inRunner) navigate("/tests");
    } catch (error) {
      notifyError(error, "No se ha podido eliminar el test");
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Acciones"
              className={triggerClassName}
            />
          }
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            {inRunner && (
              <DropdownMenuItem render={<Link to="/tests" />}>
                <LogOutIcon />
                Salir
              </DropdownMenuItem>
            )}
            {!finished && (
              <DropdownMenuItem onClick={handleFinish}>
                <CheckCircleIcon />
                {inRunner ? "Terminar y salir" : "Terminar"}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleRestart}>
              <RotateCcwIcon />
              Reempezar
            </DropdownMenuItem>
            <DropdownMenuItem
              render={<Link to={`/tests/new?${buildDuplicateParams(test).toString()}`} />}
            >
              <CopyIcon />
              Duplicar
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem variant="destructive" onClick={handleDelete}>
              <Trash2Icon />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {dialog}
    </>
  );
}
