import type { MetadataRoute } from "next";

/**
 * Web App Manifest — makes the dashboard installable (Add to Home Screen) and
 * gives Android/Chrome a themed splash screen. Icons reference the generated
 * icon.tsx / apple-icon.tsx routes.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "North East Regional Intelligence",
    short_name: "NE Intelligence",
    description:
      "Live economic, labour market, skills, population, housing and health intelligence for North East England's seven local authorities, from UK government open data.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1120",
    theme_color: "#0b1120",
    categories: ["business", "government", "productivity"],
    lang: "en-GB",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
