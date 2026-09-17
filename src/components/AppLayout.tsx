import { Outlet } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";

// Pages render inside a scrolling main area above the fixed tab bar. The
// bottom padding reserves room for the bar (4rem = BottomNav's h-16) plus the
// safe-area inset, plus 1rem of breathing room between content and bar.
export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-3xl flex-1 pb-[calc(4rem+env(safe-area-inset-bottom,0px)+1rem)]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
