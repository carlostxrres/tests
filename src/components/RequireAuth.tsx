import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";

export function RequireAuth() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted-foreground">
        <Spinner />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
