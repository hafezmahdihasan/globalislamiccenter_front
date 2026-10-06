import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d3526",
          color: "#e0c488",
          fontSize: 20,
          fontWeight: 700,
          borderRadius: 7,
        }}
      >
        G
      </div>
    ),
    { ...size },
  );
}
