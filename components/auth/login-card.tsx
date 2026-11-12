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
      <div className="border-ink w-full max-w-sm rounded-[16px] border-3 bg-white p-8 shadow-[6px_6px_0_0_#111]">
        <div className="mb-6 flex items-center gap-3">
          <span className="bg-sun border-ink flex size-10 items-center justify-center rounded-[10px] border-3">
            <Icon className="size-5" aria-hidden />
          </span>
          <div>
            <p className="font-extrabold">{SITE.brand}</p>
            <p className="text-muted text-xs tracking-widest uppercase">{area}</p>
          </div>
        </div>
        <h1 className="text-2xl font-extrabold">{title}</h1>
        <p className="text-muted mt-1 mb-6 text-sm">{intro}</p>
        {error === "link" && (
          <p
            role="alert"
            className="bg-accent-soft border-ink mb-4 rounded-[10px] border-3 p-3 text-sm"
          >
            That sign-in link is invalid or has expired. Please request a new one.
          </p>
        )}
        {wrongAccount && (
          <p
            role="alert"
            className="bg-accent-soft border-ink mb-4 rounded-[10px] border-3 p-3 text-sm"
          >
            {wrongAccount}
          </p>
        )}
        <LoginForm next={next} />
      </div>
    </div>
  );
}
