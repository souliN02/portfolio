import type { MetadataRoute } from "next";
import { SITE_URL } from "@/data/profile";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/simple`, changeFrequency: "monthly", priority: 0.8 },
  ];
}
