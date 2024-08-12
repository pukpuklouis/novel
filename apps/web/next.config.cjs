/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev, isServer }) => {
    // Force webpack to retain console.log statements
    config.optimization.minimize = false;
    return config;
  },
  redirects: async () => {
    return [
      {
        source: "/github",
        destination: "https://github.com/steven-tey/novel",
        permanent: true,
      },
      {
        source: "/sdk",
        destination: "https://www.npmjs.com/package/novel",
        permanent: true,
      },
      {
        source: "/npm",
        destination: "https://www.npmjs.com/package/novel",
        permanent: true,
      },
      {
        source: "/svelte",
        destination: "https://github.com/tglide/novel-svelte",
        permanent: false,
      },
      {
        source: "/vue",
        destination: "https://github.com/naveennaidu/novel-vue",
        permanent: false,
      },
      {
        source: "/vscode",
        destination:
          "https://marketplace.visualstudio.com/items?itemName=bennykok.novel-vscode",
        permanent: false,
      },
      {
        source: "/feedback",
        destination: "https://github.com/steven-tey/novel/issues",
        permanent: true,
      },
      {
        source: "/deploy",
        destination: "https://vercel.com/templates/next.js/novel",
        permanent: true,
      },
    ];
  },
  productionBrowserSourceMaps: true,
};

export default nextConfig;
