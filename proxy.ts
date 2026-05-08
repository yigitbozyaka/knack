import { NextResponse, type NextRequest } from 'next/server'

// Knack runs CSP in nonce mode. Every request gets a fresh nonce that's
// passed to React via the `x-nonce` request header; the same nonce is
// embedded in the response Content-Security-Policy header.
//
// Important: dev mode loosens the policy (HMR / Turbopack rely on eval'd
// chunks). Always smoke-test CSP changes with `pnpm build && pnpm start`,
// not `pnpm dev`.

const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-DNS-Prefetch-Control': 'off',
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()',
    'browsing-topics=()',
  ].join(', '),
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
}

function buildCsp(nonce: string, isProd: boolean): string {
  const scriptSrc = isProd
    ? `'self' 'nonce-${nonce}' 'strict-dynamic'`
    : // Dev needs eval and inline for HMR / Turbopack chunks.
      `'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' 'unsafe-inline'`

  const directives: Record<string, string> = {
    'default-src': `'self'`,
    'script-src': scriptSrc,
    // Tailwind streaming SSR + future syntax-highlighter inline styles.
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

  const parts = Object.entries(directives).map(([key, value]) => `${key} ${value}`)
  if (isProd) parts.push('upgrade-insecure-requests')

  return parts.join('; ')
}

function generateNonce(): string {
  // Edge runtime: no Buffer. btoa(uuid) is fine — base64 of 36-char UUID.
  return btoa(crypto.randomUUID())
}

export function proxy(request: NextRequest) {
  const nonce = generateNonce()
  const isProd = process.env.NODE_ENV === 'production'
  const csp = buildCsp(nonce, isProd)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('content-security-policy', csp)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  response.headers.set('Content-Security-Policy', csp)
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value)
  }

  if (isProd) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload',
    )
  }

  return response
}

export const config = {
  matcher: [
    {
      source:
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|otf)).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
