export type ErrorCode = 'unauthorized' | 'forbidden' | 'rate_limited' | 'validation' | 'not_found'

export class AppError extends Error {
  readonly code: ErrorCode
  readonly status: number

  constructor(code: ErrorCode, status: number, message: string) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.status = status
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Sign in required.') {
    super('unauthorized', 401, message)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have access to this resource.') {
    super('forbidden', 403, message)
  }
}

export class RateLimitError extends AppError {
  readonly retryAfterSeconds?: number

  constructor(message = 'Too many requests. Try again in a moment.', retryAfterSeconds?: number) {
    super('rate_limited', 429, message)
    this.retryAfterSeconds = retryAfterSeconds
  }
}

export class ValidationError extends AppError {
  readonly fieldErrors: Record<string, string>

  constructor(
    message = 'The submitted data is invalid.',
    fieldErrors: Record<string, string> = {},
  ) {
    super('validation', 400, message)
    this.fieldErrors = fieldErrors
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found.') {
    super('not_found', 404, message)
  }
}
