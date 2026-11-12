import { ImageResponse } from "next/og";
import { SITE } from "@/config/site";

export const alt = `${SITE.brand} — ${SITE.subtitle}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#111111";
const LAV = "#C8B8FF";
const SUN = "#FFDE59";
const CORAL = "#FF7A59";
const MINT = "#7EE8C4";

const circle = (left: number, top: number, d: number, bg: string) => ({
  position: "absolute" as const,
  left,
  top,
  width: d,
  height: d,
  borderRadius: d,
  background: bg,
  border: `8px solid ${INK}`,
});

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
        <div style={circle(40, 70, 190, SUN)} />
        <div style={circle(150, 70, 190, CORAL)} />
        <div style={circle(130, 230, 120, MINT)} />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: 620,
        }}
      >
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            background: SUN,
            border: `6px solid ${INK}`,
            boxShadow: `6px 6px 0 ${INK}`,
            padding: "6px 18px",
            fontSize: 34,
            fontWeight: 800,
            color: INK,
          }}
        >
          {SITE.brand}
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
