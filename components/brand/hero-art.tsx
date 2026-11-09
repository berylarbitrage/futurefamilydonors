import { useId } from "react";
import { LogoMark } from "@/components/brand/logo-mark";

/** Decorative hero illustrations in the brand palette. Inline SVG = no extra request. */
export function HeroArt({ variant }: { variant: "home" | "egg" | "sperm" }) {
  const id = useId().replace(/:/g, "");
  return (
    <div className="relative mx-auto aspect-[6/5] w-full max-w-md" aria-hidden>
      {/* soft glow plate */}
      <div className="from-primary-soft via-card to-accent-soft shadow-accent/10 absolute inset-4 rounded-[3rem] bg-gradient-to-br shadow-2xl" />
      <svg viewBox="0 0 480 400" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id={`a-${id}`} cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#EBDDF8" />
            <stop offset="60%" stopColor="#BE9BE0" />
            <stop offset="100%" stopColor="#8A5FC0" />
          </radialGradient>
          <radialGradient id={`b-${id}`} cx="60%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#FFF0EC" />
            <stop offset="60%" stopColor="#FBC3B4" />
            <stop offset="100%" stopColor="#EE9AA6" />
          </radialGradient>
          <linearGradient id={`c-${id}`} x1="0" x2="1">
            <stop offset="0%" stopColor="#B892DD" />
            <stop offset="100%" stopColor="#F7AE9E" />
          </linearGradient>
        </defs>

        {variant === "egg" && (
          <>
            <circle cx="250" cy="200" r="130" fill={`url(#b-${id})`} opacity="0.9" />
            <circle cx="250" cy="200" r="78" fill="#FFF7F4" opacity="0.85" />
            <circle cx="250" cy="200" r="40" fill={`url(#a-${id})`} />
            <circle
              cx="250"
              cy="200"
              r="150"
              fill="none"
              stroke={`url(#c-${id})`}
              strokeWidth="2"
              opacity="0.5"
              strokeDasharray="4 10"
            />
          </>
        )}
        {variant === "sperm" && (
          <>
            <circle cx="300" cy="170" r="110" fill={`url(#a-${id})`} opacity="0.85" />
            <path
              d="M40 300 C 140 200, 230 340, 440 220"
              stroke={`url(#c-${id})`}
              strokeWidth="18"
              fill="none"
              strokeLinecap="round"
              opacity="0.9"
            />
            <path
              d="M60 340 C 170 260, 260 380, 440 280"
              stroke="#FBC3B4"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              opacity="0.8"
            />
            <path
              d="M150 160 C 180 150, 196 130, 222 128"
              stroke="#fff"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
            <ellipse cx="236" cy="126" rx="12" ry="16" transform="rotate(75 236 126)" fill="#fff" />
          </>
        )}
      </svg>

      {variant === "home" && (
        <LogoMark className="animate-float absolute inset-x-8 top-1/2 mx-auto w-[78%] -translate-y-1/2 drop-shadow-xl" />
      )}

      {/* floating accents */}
      <span className="animate-float-delayed bg-peach/80 absolute top-6 right-10 size-10 rounded-full blur-[1px]" />
      <span className="animate-float bg-lavender/70 absolute bottom-10 left-6 size-6 rounded-full" />
      <span className="animate-float-delayed bg-blush absolute top-16 left-14 size-4 rounded-full" />
    </div>
  );
}
