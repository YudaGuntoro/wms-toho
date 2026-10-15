import type { NextConfig } from "next";

// Keep the SVG coordinate system when CSS scales TailAdmin icons.
const svgLoader = {
  loader: "@svgr/webpack",
  options: {
    svgoConfig: {
      plugins: [
        {
          name: "preset-default",
          params: { overrides: { removeViewBox: false } },
        },
      ],
    },
  },
};

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  async headers() {
    return [
      {
        source: "/signin",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },
    ];
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: [svgLoader],
    });
    return config;
  },
    
    turbopack: {
      rules: {
        '*.svg': {
          loaders: [svgLoader],
          as: '*.js',
        },
      },
    },
  
};

export default nextConfig;
