import { S3Client } from '@aws-sdk/client-s3'

import { env } from '@/lib/env'

const globalForS3 = globalThis as unknown as { __knackS3?: S3Client }

function createClient(): S3Client {
  return new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
    // Path-style addressing is required for MinIO and works with R2; saves us
    // from the alternative (virtual-host style) that needs DNS for every
    // bucket name.
    forcePathStyle: true,
  })
}

export const s3: S3Client = globalForS3.__knackS3 ?? createClient()

if (env.NODE_ENV !== 'production') {
  globalForS3.__knackS3 = s3
}

export const BUCKET = env.S3_BUCKET
