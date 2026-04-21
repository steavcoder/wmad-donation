import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force blocking metadata path to avoid MetadataWrapper streaming mismatch in dev.
  htmlLimitedBots: /.+/,
  // Reduce dev overlay DOM churn while debugging hydration.
  devIndicators: false,
  // Disable cache components for now to avoid PPR/streaming surprises.
  cacheComponents: false,
};

export default nextConfig;
