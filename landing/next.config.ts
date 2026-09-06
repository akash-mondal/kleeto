import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* the page lived at /kleeto while it was in review; it is the front page now */
  async redirects() {
    return [{ source: "/kleeto", destination: "/", permanent: false }];
  },
};

export default nextConfig;
