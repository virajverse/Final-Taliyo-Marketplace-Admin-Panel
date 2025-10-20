/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
let supabaseHost = ''
try { supabaseHost = new URL(supabaseUrl).hostname } catch {}

const isProd = process.env.NODE_ENV === 'production'
const csp = (() => {
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob: https:",
    // Allow Supabase and HTTPS connections (fetch, websockets)
    `connect-src 'self' https:${supabaseHost ? ' https://' + supabaseHost : ''} https: wss:`,
    "style-src 'self' 'unsafe-inline'",
    // Allow unsafe-eval in dev to avoid breaking Next dev overlay
    `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,
  ]
  return directives.join('; ')
})()

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'images.unsplash.com', ...(supabaseHost ? [supabaseHost] : [])],
    remotePatterns: supabaseHost
      ? [
          { protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/render/image/**' },
          { protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/**' },
        ]
      : [],
  },
  generateEtags: false,
  async headers() {
    return [
      // Global security headers
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          ...(isProd ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }] : []),
        ],
      },
      // Specific caching for metrics
      {
        source: '/api/admin/metrics',
        headers: [
          { key: 'Cache-Control', value: 's-maxage=30, stale-while-revalidate=300' },
        ],
      },
      // Default: no-store for other API endpoints
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
          { key: 'X-Cache-Bypass', value: '1' },
        ],
      },
    ];
  },
};

export default nextConfig;
