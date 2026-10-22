import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Buma — Tontine + Loto Gabon",
    short_name: "Buma",
    description: "Tontine journalière rotative Mont-Bouët",
    start_url: "/",
    display: "standalone",
    background_color: "#fff7e6",
    theme_color: "#009e60",
    lang: "fr",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
