import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * App icon (favicon). A compact "NE" monogram on the brand gradient, generated
 * at build time so there's no binary asset to keep in sync with the palette.
 */
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
          background: "linear-gradient(135deg, #2563eb 0%, #8b5cf6 100%)",
          color: "#ffffff",
          fontSize: 17,
          fontWeight: 800,
          fontFamily: "sans-serif",
          borderRadius: 7,
          letterSpacing: -0.5,
        }}
      >
        NE
      </div>
    ),
    { ...size }
  );
}
