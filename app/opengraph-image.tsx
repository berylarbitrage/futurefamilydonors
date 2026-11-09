import { ImageResponse } from "next/og";
import { SITE } from "@/config/site";

export const alt = `${SITE.brand} — ${SITE.subtitle}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "linear-gradient(135deg, #FDF8FB 0%, #F6ECF9 55%, #FDEBE6 100%)",
        padding: 80,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: 40,
          top: 90,
          width: 310,
          height: 310,
          borderRadius: 310,
          background: "radial-gradient(circle at 60% 30%, #FFF0EC, #FBC3B4 60%, #EE9AA6)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 150,
          top: 190,
          width: 310,
          height: 310,
          borderRadius: 310,
          background: "radial-gradient(circle at 35% 30%, #EBDDF8, #BE9BE0 60%, #8A5FC0)",
          opacity: 0.92,
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: 560,
        }}
      >
        <div
          style={{ fontSize: 30, color: "#7B4BB3", letterSpacing: 6, textTransform: "uppercase" }}
        >
          {SITE.subtitle}
        </div>
        <div
          style={{
            fontSize: 68,
            color: "#3C1860",
            fontStyle: "italic",
            lineHeight: 1.05,
            marginTop: 24,
          }}
        >
          {SITE.brand}
        </div>
        <div style={{ fontSize: 34, color: "#6A5C77", marginTop: 28 }}>
          Every family deserves a good beginning.
        </div>
      </div>
    </div>,
    size,
  );
}
