import type { ComponentProps } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { Button } from "@/components/ui/button";

type Props = Omit<ComponentProps<typeof Button>, "render" | "nativeButton"> &
  Pick<LinkProps, "to" | "replace">;

// A Button rendered as a router <Link>. Base UI needs `nativeButton={false}`
// when the rendered element isn't a <button>.
export function LinkButton({ to, replace, ...props }: Props) {
  return <Button nativeButton={false} render={<Link to={to} replace={replace} />} {...props} />;
}
