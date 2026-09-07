import type { NextConfig } from "next";

/**
 * Media in `public/` is served from Vercel's edge network, but Next sends it with
 * `max-age=0, must-revalidate`, so a repeat visitor revalidates every video and poster on
 * every load. These assets change only when they are re-shot, and a deployment purges the
 * edge cache, so the edge can hold them for a year while browsers hold them for a day.
 */
const MEDIA_CACHE = "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800";

const nextConfig: NextConfig = {
  images: {
    // AVIF first: it is meaningfully smaller than WebP on the screen captures this site is
    // built from. Next falls back down the list per what the browser accepts.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
  },
  async headers() {
    return [
      { source: "/video/:path*", headers: [{ key: "Cache-Control", value: MEDIA_CACHE }] },
      { source: "/images/:path*", headers: [{ key: "Cache-Control", value: MEDIA_CACHE }] },
      { source: "/fonts/:path*", headers: [{ key: "Cache-Control", value: MEDIA_CACHE }] },
    ];
  },
  /* the page lived at /kleeto while it was in review; it is the front page now */
  async redirects() {
    return [{ source: "/kleeto", destination: "/", permanent: false }];
  },
};

export default nextConfig;
