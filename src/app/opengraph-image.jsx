import { ImageResponse } from "next/og";

export const alt = "GIC — Global Islamic Center";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Latin text only on purpose: the default OG font has no Bengali glyphs.
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d3526",
          color: "#faf6ec",
        }}
      >
        <div style={{ display: "flex", fontSize: 150, fontWeight: 700, color: "#e0c488" }}>GIC</div>
        <div style={{ display: "flex", fontSize: 56, fontWeight: 600, marginTop: 8 }}>
          Global Islamic Center
        </div>
        <div style={{ display: "flex", fontSize: 30, marginTop: 28, color: "#aed4c0" }}>
          Online Quran & Islamic education
        </div>
      </div>
    ),
    { ...size },
  );
}
