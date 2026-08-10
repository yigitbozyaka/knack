import type { NextConfig } from 'next'

const isProd = process.env.NODE_ENV === 'production'

const scriptSrc = isProd ? `'self' 'unsafe-inline'` : `'self' 'unsafe-inline' 'unsafe-eval'`

const CSP_DIRECTIVES: Record<string, string> = {
  'default-src': `'self'`,
  'script-src': scriptSrc,
  'style-src': `'self' 'unsafe-inline'`,
  'img-src': `'self' data: blob:`,
  'font-src': `'self' data:`,
  'connect-src': `'self'`,
  'frame-ancestors': `'none'`,
  'base-uri': `'self'`,
  'form-action': `'self'`,
  'object-src': `'none'`,
  'media-src': `'self' blob:`,
  'worker-src': `'self' blob:`,
  'manifest-src': `'self'`,
}

function buildCsp(): string {
  const parts = Object.entries(CSP_DIRECTIVES).map(([key, value]) => `${key} ${value}`)
  if (isProd) parts.push('upgrade-insecure-requests')
  return parts.join('; ')
}

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: buildCsp() },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  {
    key: 'Permissions-Policy',
    value: [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'interest-cohort=()',
      'browsing-topics=()',
    ].join(', '),
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  ...(isProd
    ? [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
      ]
    : []),
]

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }]
  },
}

export default nextConfig
