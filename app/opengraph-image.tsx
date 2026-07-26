import { ImageResponse } from "next/og";

export const alt = "BGI — BattleGround Information";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#f7f7f4",
          color: "#171917",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 940 }}>
          <span style={{ color: "#14783f", fontSize: 28, fontWeight: 800, letterSpacing: 4 }}>
            PUBG DATA ARCHIVE
          </span>
          <strong style={{ fontSize: 152, letterSpacing: -12, lineHeight: 1, marginTop: 32 }}>BGI</strong>
          <span style={{ borderTop: "4px solid #171917", fontSize: 38, marginTop: 38, paddingTop: 26 }}>
            BattleGround Information
          </span>
          <span style={{ color: "#6b706a", fontSize: 24, marginTop: 18 }}>
            PATCH NOTES · WEAPONS · META · GUIDES
          </span>
        </div>
      </div>
    ),
    size,
  );
}
