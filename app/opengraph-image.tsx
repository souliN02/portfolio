import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { PROFILE } from "@/data/profile";

/* The link preview for LinkedIn, Slack and friends: an XP window on the Bliss wallpaper */

export const alt = `${PROFILE.name}, ${PROFILE.role}. Portfolio styled as a Windows XP desktop.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const flag = [
  { d: "M2 2 C20 8, 35 2, 46 2 L46 46 C35 46, 20 40, 2 46 Z", fill: "#FF0000" },
  { d: "M54 2 C65 2, 80 8, 98 2 L98 46 C80 40, 65 46, 54 46 Z", fill: "#00B300" },
  { d: "M2 54 C20 60, 35 54, 46 54 L46 98 C35 98, 20 92, 2 98 Z", fill: "#0058E6" },
  { d: "M54 54 C65 54, 80 60, 98 54 L98 98 C80 92, 65 98, 54 98 Z", fill: "#FFB900" },
];

export default async function OpengraphImage() {
  const wallpaper = await readFile(join(process.cwd(), "public", "xp-wallpaper.jpg"));
  const src = `data:image/jpeg;base64,${wallpaper.toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative" }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={src} width={1200} height={630} style={{ position: "absolute", inset: 0, objectFit: "cover" }} />

        {/* Window */}
        <div
          style={{
            position: "absolute",
            left: 150,
            top: 80,
            width: 900,
            display: "flex",
            flexDirection: "column",
            borderRadius: "14px 14px 0 0",
            background: "#0842db",
            padding: "0 5px 5px",
            boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
          }}
        >
          <div
            style={{
              height: 56,
              margin: "0 -5px",
              borderRadius: "14px 14px 0 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 14px 0 18px",
              color: "#fff",
              fontSize: 26,
              fontWeight: 700,
              background: "linear-gradient(180deg, #0997ff, #0053ee 8%, #0050ee 40%, #0066ff 88%, #005bff 95%, #003dd7 96%, #003dd7)",
            }}
          >
            <span style={{ display: "flex" }}>Bekir Saliv - Portfolio XP</span>
            <div style={{ display: "flex", gap: 6 }}>
              {["#2263d5", "#2263d5", "#dc6527"].map((c, i) => (
                <div key={i} style={{ width: 38, height: 38, borderRadius: 6, border: "2px solid #fff", background: c, display: "flex" }} />
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 44, background: "#ece9d8", padding: "48px 56px" }}>
            <svg width="150" height="150" viewBox="0 0 100 100">
              {flag.map((p) => (
                <path key={p.fill} d={p.d} fill={p.fill} />
              ))}
            </svg>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 72, fontWeight: 800, color: "#0c32a8", lineHeight: 1 }}>{PROFILE.name}</div>
              <div style={{ fontSize: 34, color: "#222", marginTop: 14 }}>{`${PROFILE.role}. AI-first.`}</div>
              <div style={{ fontSize: 26, color: "#555", marginTop: 12 }}>React · Next.js · TypeScript · Python · C#</div>
              <div style={{ fontSize: 26, color: "#2a6ad8", marginTop: 22 }}>bekirsaliv.dk</div>
            </div>
          </div>
        </div>

        {/* Taskbar */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 50,
            display: "flex",
            alignItems: "center",
            background: "linear-gradient(180deg, #1f2f86 0, #3165c4 3%, #3682e5 6%, #4490e6 10%, #3883e5 12%, #2b71e0 15%, #2663da 18%, #235bd6 20%, #2157d6 38%, #245ddb 54%, #2562df 86%, #1d4ec0 95%, #1941a5 98%)",
          }}
        >
          <div
            style={{
              height: 50,
              display: "flex",
              alignItems: "center",
              padding: "0 34px 0 16px",
              borderRadius: "0 20px 20px 0",
              color: "#fff",
              fontSize: 30,
              fontStyle: "italic",
              fontWeight: 700,
              background: "linear-gradient(180deg, #3c9f3c 0%, #62b862 6%, #3ca03c 14%, #329b32 50%, #2d942d 86%, #1f781f 100%)",
            }}
          >
            start
          </div>
        </div>
      </div>
    ),
    size,
  );
}
