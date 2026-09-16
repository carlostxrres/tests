import { Outlet } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";

// Pages render inside a scrolling main area above the fixed tab bar. The
// bottom padding reserves room for the bar plus the safe-area inset.
export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-3xl flex-1 pb-[calc(4rem+env(safe-area-inset-bottom,0px))]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
