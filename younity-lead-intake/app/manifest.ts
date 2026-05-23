import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Younity Client Portal",
    short_name: "Younity",
    description: "Secure client portal for Younity Consultancy.",
    start_url: "/client/login",
    scope: "/",
    display: "standalone",
    background_color: "#06111f",
    theme_color: "#244285",
    icons: [
      {
        src: "/younity-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/younity-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/younity-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
