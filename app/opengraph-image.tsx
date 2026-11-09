import { ImageResponse } from "next/og";
import { SITE } from "@/config/site";

export const alt = `${SITE.brand} — ${SITE.subtitle}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NAVY = "#0E1A3A";
const CORAL = "#FF5A3C";
const SUN = "#FFC53D";

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: NAVY,
        backgroundImage:
          "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
        padding: 80,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* orbit ring */}
      <div
        style={{
          position: "absolute",
          right: -60,
          top: 60,
          width: 560,
          height: 560,
          borderRadius: 560,
          border: "2px solid rgba(255,255,255,0.2)",
        }}
      />
      {/* rising sun */}
      <div
        style={{
          position: "absolute",
          right: 50,
          top: 260,
          width: 340,
          height: 340,
          borderRadius: 340,
          background: CORAL,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 470,
          width: 560,
          height: 160,
          background: NAVY,
          borderTop: "6px solid #FFFFFF",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 330,
          top: 120,
          width: 56,
          height: 56,
          borderRadius: 56,
          background: SUN,
        }}
      />
      <div
        style={{ position: "absolute", left: 0, top: 0, width: 400, height: 14, background: CORAL }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: 640,
        }}
      >
        <div
          style={{
            fontSize: 26,
            color: SUN,
            letterSpacing: 6,
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          {SITE.subtitle}
        </div>
        <div
          style={{
            fontSize: 84,
            color: "#FFFFFF",
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: -2,
            marginTop: 24,
          }}
        >
          {SITE.brand}
        </div>
        <div style={{ fontSize: 34, color: "#B9C3E3", marginTop: 32 }}>
          The future of family starts with you.
        </div>
      </div>
    </div>,
    size,
  );
}
