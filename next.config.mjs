/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ["mongoose", "telegraf", "bcryptjs"],
  // Make sure the Bengali font files are shipped with the serverless functions.
  outputFileTracingIncludes: {
    "/api/**/*": ["./node_modules/@fontsource/noto-sans-bengali/files/*.woff2"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
