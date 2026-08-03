import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EL GOODNEWS INT'L ACADEMY Portal",
    short_name: "EL GOODNEWS",
    description: "Complete school management system with CBT, assessments, and child monitoring.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#f97316",
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
