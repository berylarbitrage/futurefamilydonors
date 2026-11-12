import Link from "next/link";
import { DISCLAIMER, SITE } from "@/config/site";
import { Logo } from "@/components/layout/logo";
import { CookieSettingsLink } from "@/components/analytics/cookie-settings-link";

const linkCls =
  "inline-block py-0.5 font-semibold underline-offset-4 decoration-2 hover:underline hover:bg-sun";

export function Footer() {
  return (
    <footer className="border-ink mt-16 border-t-[6px] bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-12 pb-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-sm text-sm font-medium">{SITE.tagline}</p>
          <p className="flex flex-col items-start text-sm">
            <a className={`${linkCls} py-2 underline`} href={`mailto:${SITE.contactEmail}`}>
              {SITE.contactEmail}
            </a>
            <a
              className={`${linkCls} py-2 underline`}
              href={`tel:${SITE.contactPhone.replace(/\D/g, "")}`}
            >
              {SITE.contactPhone}
            </a>
          </p>
          <p className="bg-mint border-ink inline-block rounded-lg border-2 px-2.5 py-1 text-sm font-bold">
            {SITE.serviceArea}
          </p>
        </div>
        <div>
          <h2 className="tag mb-4">Donate</h2>
          <ul className="space-y-2 text-sm">
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
          <h2 className="tag mb-4">Company</h2>
          <ul className="space-y-2 text-sm">
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
      <div className="border-ink border-t-3">
        <div className="mx-auto max-w-6xl space-y-2 px-4 py-6 text-xs">
          <p>
            <strong>Disclaimer:</strong> {DISCLAIMER}
          </p>
          <p>
            © {new Date().getFullYear()} {SITE.brand}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
