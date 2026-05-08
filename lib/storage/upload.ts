import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { customAlphabet } from 'nanoid'

import { BUCKET, s3 } from './client'

const ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const generateId = customAlphabet(ID_ALPHABET, 24)

export interface UploadUrlOptions {
  key: string
  contentType: string
  contentLength: number
  expiresInSeconds?: number
}

export async function getUploadUrl(options: UploadUrlOptions): Promise<string> {
  const expiresIn = options.expiresInSeconds ?? 300
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: options.key,
    ContentType: options.contentType,
    ContentLength: options.contentLength,
  })
  return getSignedUrl(s3, command, { expiresIn })
}

export interface DownloadUrlOptions {
  key: string
  filename?: string
  expiresInSeconds?: number
}

export async function getDownloadUrl(options: DownloadUrlOptions): Promise<string> {
  const expiresIn = options.expiresInSeconds ?? 3_600
  const responseContentDisposition = options.filename
    ? `attachment; filename="${sanitizeFilename(options.filename)}"`
    : undefined
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: options.key,
    ResponseContentDisposition: responseContentDisposition,
  })
  return getSignedUrl(s3, command, { expiresIn })
}

export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
    return true
  } catch (error) {
    if (isNotFound(error)) return false
    throw error
  }
}

export interface ObjectKeyOptions {
  prefix: string
  // accountId is intentionally NOT used in the key — keys must not be a
  // function of any user identifier so leaking a key cannot enumerate other
  // resources or users. We accept it only to make the call site explicit
  // about the auth context.
  accountId?: string
}

export function generateObjectKey({ prefix }: ObjectKeyOptions): string {
  const now = new Date()
  const yyyy = now.getUTCFullYear().toString()
  const mm = (now.getUTCMonth() + 1).toString().padStart(2, '0')
  const dd = now.getUTCDate().toString().padStart(2, '0')
  return `${prefix}/${yyyy}/${mm}/${dd}/${generateId()}`
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[\r\n"\\]/g, '_').slice(0, 200)
}

function isNotFound(error: unknown): boolean {
  if (error && typeof error === 'object' && 'name' in error) {
    const name = (error as { name?: unknown }).name
    return name === 'NotFound' || name === 'NoSuchKey'
  }
  return false
}
