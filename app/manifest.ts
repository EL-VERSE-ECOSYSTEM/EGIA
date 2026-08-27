import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EL LEARN App Portal",
    short_name: "EL LEARN App",
    description: "Complete multi-tenant school management system with CBT, assessments, and child monitoring.",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#10b981",
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
    ]
  }
}
