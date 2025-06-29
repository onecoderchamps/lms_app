// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
   output: 'export',
  reactStrictMode: true,
  // --- ADD THIS 'images' OBJECT ---
  images: {
    domains: [
      'apiimpact.coderchamps.co.id', // This is the host causing the error
      // Add any other external image domains here if you use them, e.g.:
      // 'example.com',
      // 'another-cdn.net',
    ],
  },
  // --- END OF 'images' CONFIG ---
};

export default nextConfig; // This line should already be there for .mjs files