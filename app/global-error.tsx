'use client'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          padding: '4rem 1.5rem',
          maxWidth: '36rem',
          margin: '0 auto',
          color: '#0a0a0a',
          backgroundColor: '#fafafa',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Something went wrong.
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#525252', marginBottom: '1rem' }}>
          The application crashed before it could render.
        </p>
        {error.digest ? (
          <p
            style={{
              fontSize: '0.75rem',
              color: '#525252',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              marginBottom: '1rem',
            }}
          >
            Reference: {error.digest}
          </p>
        ) : null}
        <button
          onClick={reset}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            border: '1px solid #0a0a0a',
            backgroundColor: '#0a0a0a',
            color: '#fafafa',
            borderRadius: '0.5rem',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
