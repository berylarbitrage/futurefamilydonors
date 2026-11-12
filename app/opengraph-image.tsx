import { ImageResponse } from "next/og";
import { SITE } from "@/config/site";

export const alt = `${SITE.brand} — ${SITE.subtitle}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#111111";
const LAV = "#C8B8FF";
const CORAL = "#FF7A59";
const MINT = "#7EE8C4";

/** The F13 mark as a data-URI SVG (keeps satori to an <img>, no SVG-in-JSX quirks). */
const markSvg = (k: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 16 116 104"><ellipse cx="52" cy="58" rx="46" ry="16" fill="none" stroke="${INK}" stroke-width="${3.5 * k}" transform="rotate(-18 52 58)"/><circle cx="52" cy="58" r="24" fill="${MINT}" stroke="${INK}" stroke-width="${4 * k}"/><circle cx="52" cy="58" r="12" fill="#D8FFF1"/><g transform="translate(26 92) rotate(-45) scale(0.9)"><path d="M-6 0 C -11 -6, -16 6, -22 0 S -33 -6, -40 0" fill="none" stroke="${INK}" stroke-width="${3.2 * k}" stroke-linecap="round"/><ellipse cx="0" cy="0" rx="7.5" ry="5.4" fill="${CORAL}" stroke="${INK}" stroke-width="${2 * k}"/></g></svg>`;
const markSrc = (k: number) =>
  `data:image/svg+xml;base64,${Buffer.from(markSvg(k)).toString("base64")}`;
/** Large art-panel mark gets heavier outlines so it reads as chunky as the rest of the brand. */
const MARK_SRC_LG = markSrc(1.6);
const MARK_SRC_SM = markSrc(1.25);
const MARK_RATIO = 104 / 116;

const BRAND_WORDS = SITE.brand.split(" ");
const BRAND_LINE_2 = BRAND_WORDS.length > 1 ? BRAND_WORDS[BRAND_WORDS.length - 1] : "";
const BRAND_LINE_1 = BRAND_WORDS.slice(0, BRAND_WORDS.length > 1 ? -1 : undefined).join(" ");

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: LAV,
        padding: 64,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* white art panel with hard shadow */}
      <div
        style={{
          position: "absolute",
          right: 80,
          top: 90,
          width: 400,
          height: 420,
          background: INK,
          borderRadius: 28,
          transform: "translate(14px, 14px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 80,
          top: 90,
          width: 400,
          height: 420,
          background: "#FFFFFF",
          border: `8px solid ${INK}`,
          borderRadius: 28,
          display: "flex",
        }}
      >
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <img
          src={MARK_SRC_LG}
          width={340}
          height={Math.round(340 * MARK_RATIO)}
          style={{ margin: "auto" }}
        />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: 620,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", color: INK }}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img src={MARK_SRC_SM} width={108} height={Math.round(108 * MARK_RATIO)} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginLeft: 16,
              fontSize: 38,
              lineHeight: 1.05,
              letterSpacing: -1,
            }}
          >
            <span style={{ fontWeight: 900 }}>{BRAND_LINE_1}</span>
            <span style={{ fontWeight: 800 }}>{BRAND_LINE_2}</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            fontSize: 82,
            color: INK,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -2,
            marginTop: 40,
          }}
        >
          <span style={{ marginRight: 20 }}>You could make someone a</span>
          <span
            style={{
              display: "flex",
              background: "#FFFFFF",
              border: `6px solid ${INK}`,
              boxShadow: `8px 8px 0 ${INK}`,
              padding: "0 14px",
              marginTop: 12,
              transform: "rotate(-2deg)",
            }}
          >
            parent.
          </span>
        </div>
        <div style={{ fontSize: 30, color: INK, marginTop: 40, fontWeight: 600 }}>
          {SITE.subtitle}
        </div>
      </div>
    </div>,
    size,
  );
}
