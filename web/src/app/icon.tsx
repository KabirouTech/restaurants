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
          background: "transparent",
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "60% 35% 50% 40% / 40% 60% 30% 55%",
            transform: "rotate(-8deg)",
            background: "linear-gradient(135deg, #e67e22, #8B4513)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              color: "white",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: -0.5,
              lineHeight: 1,
            }}
          >
            rOS
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
