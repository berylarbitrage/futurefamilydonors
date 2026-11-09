import Link from "next/link";
import { DISCLAIMER, SITE } from "@/config/site";
import { Logo } from "@/components/layout/logo";
import { CookieSettingsLink } from "@/components/analytics/cookie-settings-link";

const linkCls = "hover:text-sun underline-offset-4 hover:underline";

export function Footer() {
  return (
    <footer className="bg-navy-grid on-dark mt-20 text-white">
      <div className="bg-accent h-2" aria-hidden />
      <div className="mx-auto max-w-6xl px-4 pt-14">
        <p className="font-display max-w-3xl text-3xl leading-[1.05] font-bold tracking-tight md:text-5xl">
          Help build the families <span className="text-sun">of tomorrow.</span>
        </p>
      </div>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-4">
        <div className="space-y-3 md:col-span-2">
          <Logo inverse />
          <p className="text-on-dark-muted max-w-sm text-sm">{SITE.tagline}</p>
          <p className="flex flex-col items-start text-sm">
            <a
              className={`inline-block py-2 underline ${linkCls}`}
              href={`mailto:${SITE.contactEmail}`}
            >
              {SITE.contactEmail}
            </a>
            <a
              className={`inline-block py-2 underline ${linkCls}`}
              href={`tel:${SITE.contactPhone.replace(/\D/g, "")}`}
            >
              {SITE.contactPhone}
            </a>
          </p>
          <p className="text-on-dark-muted text-sm">{SITE.serviceArea}</p>
        </div>
        <div>
          <h2 className="text-sun mb-4 font-sans text-xs font-bold tracking-[0.24em] uppercase">
            Donate
          </h2>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link className={linkCls} href="/egg-donor">
                Become an Egg Donor
              </Link>
            </li>
            <li>
              <Link className={linkCls} href="/sperm-donor">
                Become a Sperm Donor
              </Link>
            </li>
            <li>
              <Link className={linkCls} href="/refer">
                Refer a Friend
              </Link>
            </li>
            <li>
              <Link className={linkCls} href="/portal">
                Applicant Login
              </Link>
            </li>
            {/* Intended Parent Login (/catalog/login) hidden for v1 — code kept. */}
          </ul>
        </div>
        <div>
          <h2 className="text-sun mb-4 font-sans text-xs font-bold tracking-[0.24em] uppercase">
            Company
          </h2>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link className={linkCls} href="/about">
                About Us
              </Link>
            </li>
            <li>
              <Link className={linkCls} href="/faq">
                FAQ
              </Link>
            </li>
            <li>
              <Link className={linkCls} href="/contact">
                Contact
              </Link>
            </li>
            <li>
              <Link className={linkCls} href="/privacy">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link className={linkCls} href="/terms">
                Terms of Use
              </Link>
            </li>
            <li className={linkCls}>
              <CookieSettingsLink />
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="text-on-dark-muted mx-auto max-w-6xl space-y-2 px-4 py-6 text-xs">
          <p>
            <strong className="text-white">Disclaimer:</strong> {DISCLAIMER}
          </p>
          <p>
            © {new Date().getFullYear()} {SITE.brand}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
