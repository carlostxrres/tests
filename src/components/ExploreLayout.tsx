import { Link, Outlet, useLocation } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const exploreTabs = [
  { value: "syllabus", label: "Temario" },
  { value: "questions", label: "Preguntas" },
  { value: "submissions", label: "Respuestas" },
] as const;

// URL-driven tabs: the active value comes from the path and every trigger is a
// real router <Link>, so deep links (/explore/questions?unit=x), the back button
// and cmd-click all behave like ordinary navigation. Base UI unmounts hidden
// panels, so only one <Outlet /> is ever rendered.
export function ExploreLayout() {
  const { pathname } = useLocation();
  const active =
    exploreTabs.find((tab) => pathname.startsWith(`/explore/${tab.value}`))?.value ?? "syllabus";

  return (
    <>
      <PageHeader title="Explorar" className="pb-3" />
      <Tabs value={active} className="gap-0">
        <TabsList className="mx-4 w-[calc(100%-2rem)]">
          {exploreTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              // Base UI only wires Enter/Space to a synthetic click when the
              // rendered element isn't a native <button>.
              nativeButton={false}
              render={<Link to={`/explore/${tab.value}`} />}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {exploreTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="pt-4">
            <Outlet />
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
