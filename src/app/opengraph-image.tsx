import { ImageResponse } from "next/og";

// Route segment config
export const alt = "North East Regional Intelligence — live UK government open data dashboard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Dynamically-generated Open Graph / social-share card. Next.js auto-wires
 * this into <meta property="og:image"> and the Twitter card for every page,
 * so links shared to Slack/LinkedIn/X render a branded preview.
 */
export default function OpengraphImage() {
  const accents = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0b1120 0%, #111b2e 100%)",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {accents.map((c) => (
              <div key={c} style={{ width: 20, height: 20, borderRadius: 999, background: c }} />
            ))}
          </div>
          <div
            style={{
              color: "#a3b3c9",
              fontSize: 24,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            Live ONS &amp; NOMIS open data
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              color: "#edf2f7",
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1,
            }}
          >
            <div>North East Regional</div>
            <div>Intelligence</div>
          </div>
          <div style={{ color: "#a3b3c9", fontSize: 30, lineHeight: 1.3, maxWidth: 900 }}>
            Economy, labour market, skills, population, housing &amp; health across the seven North
            East England local authorities.
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {["Newcastle", "Gateshead", "Sunderland", "Durham", "N. Tyneside", "S. Tyneside", "Northumberland"].map(
            (name, i) => (
              <div
                key={name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  border: "1px solid #1e2d45",
                  borderRadius: 999,
                  padding: "10px 20px",
                  color: "#edf2f7",
                  fontSize: 22,
                }}
              >
                <div style={{ width: 12, height: 12, borderRadius: 999, background: accents[i % accents.length] }} />
                {name}
              </div>
            )
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
