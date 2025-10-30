import type { NextConfig } from "next";
import { securityHeaders } from "./lib/security";

const supabaseOrigin = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return undefined;

  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
})();

const withSupabase = (sources: string[]) => {
  return supabaseOrigin ? [...sources, supabaseOrigin] : sources;
};

const nextConfig: NextConfig = {
  // Optimize for Vercel deployment
  output: 'standalone',

  
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
    // Enable compression
    optimizeCss: true,
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jougnplpmfoiajhlnthp.supabase.co',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    // Enable image optimization
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Security headers
  async headers() {
    return [
      // Apply strict CSP to all pages except auth pages
      {
        source: '/((?!auth).*)',
        headers: Object.entries(securityHeaders).map(([key, value]) => ({
          key,
          value,
        })),
      },
      // More permissive CSP for auth pages
      {
        source: '/auth/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Allow inline scripts for auth
              "style-src 'self' 'unsafe-inline'",
              ["img-src", "'self'", 'data:', 'blob:', ...withSupabase([])].filter(Boolean).join(' '),
              "font-src 'self' data:",
              ["connect-src", "'self'", ...withSupabase([])].filter(Boolean).join(' '),
              "frame-ancestors 'none'",
              "form-action 'self'",
              "base-uri 'self'",
              "manifest-src 'self'",
              ["media-src", "'self'", ...withSupabase([])].filter(Boolean).join(' '),
              "object-src 'none'",
              "worker-src 'self'",
            ].filter(Boolean).join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ];
  },

  // Compression
  compress: true,

  // Powered by header removal
  poweredByHeader: false,

  // Redirect configuration
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/assessments',
        permanent: true,
      },
      {
        source: '/',
        destination: '/assessments',
        permanent: false,
      },
    ];
  },

  // Rewrites for API routes
  async rewrites() {
    return [
      {
        source: '/api/health',
        destination: '/api/health',
      },
    ];
  },
};

export default nextConfig;
