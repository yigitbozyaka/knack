const defaults: Record<string, string> = {
  NODE_ENV: 'test',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  DATABASE_URL: 'postgres://knack:knack@localhost:5432/knack',
  S3_ENDPOINT: 'http://localhost:9000',
  S3_REGION: 'auto',
  S3_ACCESS_KEY_ID: 'test',
  S3_SECRET_ACCESS_KEY: 'test',
  S3_BUCKET: 'knack',
  S3_PUBLIC_URL: 'http://localhost:9000/knack',
  SESSION_SECRET: 'test-session-secret-at-least-32-chars-long',
  RATE_LIMIT_ENABLED: 'false',
  RATE_LIMIT_SALT: 'test-rate-limit-salt-at-least-32-chars-long',
  CRON_SECRET: 'test-cron-secret-at-least-32-chars-long-x',
}

for (const [key, value] of Object.entries(defaults)) {
  process.env[key] ??= value
}
