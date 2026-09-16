import { LogInIcon } from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

export function LoginPage() {
  const { session, loading } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && session) {
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
    return <Navigate to={from ?? "/"} replace />;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (signInError) {
      setError("Email o contraseña incorrectos.");
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Tests de oposiciones</CardTitle>
          <CardDescription>Inicia sesión para practicar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field data-invalid={error ? true : undefined}>
                <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  aria-invalid={error ? true : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {error && <FieldError>{error}</FieldError>}
              </Field>
              <Button type="submit" size="lg" disabled={submitting}>
                {submitting ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <LogInIcon data-icon="inline-start" />
                )}
                Entrar
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
