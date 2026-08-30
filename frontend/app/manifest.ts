import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Momentum — Learning Insights",
    short_name: "Momentum",
    description: "Quiet reflection and career direction insights for self-directed learners.",
    start_url: "/",
    display: "standalone",
    background_color: "#18181B",
    theme_color: "#6366F1",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/maskable-icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcuts: [
      {
        name: "Log Study Activity",
        short_name: "Log Session",
        description: "Quick capture a new learning reflection or study session",
        url: "/dashboard?action=log",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "View Career Insights",
        short_name: "Insights",
        description: "Review AI-generated learning progress & direction insights",
        url: "/insights",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
    categories: ["education", "productivity", "lifestyle"],
  };
}
