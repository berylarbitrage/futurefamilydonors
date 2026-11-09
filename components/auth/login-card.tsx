import type { LucideIcon } from "lucide-react";
import { LoginForm } from "@/components/forms/login-form";
import { SITE } from "@/config/site";

/** Standalone sign-in card (no public site header) for /admin and /catalog. */
export function LoginCard({
  icon: Icon,
  area,
  title,
  intro,
  next,
  error,
  wrongAccount,
}: {
  icon: LucideIcon;
  area: string;
  title: string;
  intro: string;
  next: string;
  error?: string;
  wrongAccount?: string | null;
}) {
  return (
    <div className="bg-background flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="border-primary bg-card shadow-hard w-full max-w-sm rounded-lg border-2 p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="bg-primary text-sun flex size-10 items-center justify-center rounded-md">
            <Icon className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-primary font-display font-bold">{SITE.brand}</p>
            <p className="text-muted text-xs tracking-widest uppercase">{area}</p>
          </div>
        </div>
        <h1 className="text-primary text-2xl font-bold">{title}</h1>
        <p className="text-muted mt-1 mb-6 text-sm">{intro}</p>
        {error === "link" && (
          <p role="alert" className="bg-accent-soft mb-4 rounded-lg p-3 text-sm">
            That sign-in link is invalid or has expired. Please request a new one.
          </p>
        )}
        {wrongAccount && (
          <p role="alert" className="bg-accent-soft mb-4 rounded-lg p-3 text-sm">
            {wrongAccount}
          </p>
        )}
        <LoginForm next={next} />
      </div>
    </div>
  );
}
