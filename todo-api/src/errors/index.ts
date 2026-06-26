/**
 * Typed HTTP errors for RESTful API responses.
 *
 * Each class carries an HTTP status code and a human-readable message.
 * The global error handler in app.ts converts these to structured JSON
 * responses with consistent shapes.
 *
 * Usage:
 *   throw new ResourceNotFoundError('Todo', id)
 *   throw new InvalidInputError('title must not be empty')
 */

export class ResourceNotFoundError extends Error {
  public readonly statusCode = 404

  constructor(resource: string, identifier: string) {
    super(`${resource} ${identifier} not found`)
    this.name = 'ResourceNotFoundError'
  }
}

export class InvalidInputError extends Error {
  public readonly statusCode = 400

  constructor(message: string) {
    super(message)
    this.name = 'InvalidInputError'
  }
}
