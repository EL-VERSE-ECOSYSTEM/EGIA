import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EL LEARNERS Portal",
    short_name: "EL LEARNERS",
    description: "Complete school management system with CBT, assessments, and real-time monitoring.",
    id: "/",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#1d4ed8",
    icons: [
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png"
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: 'maskable'
      }
    ],
    categories: ["education", "productivity"]
  }
}
