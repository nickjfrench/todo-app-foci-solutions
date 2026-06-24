import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

/**
 * Branded UUID type with a prefix.
 *
 * The `Prefix` type parameter ensures compile-time separation between
 * entity IDs (e.g. `Id<'todo'>` can never be assigned to `Id<'user'>`).
 *
 * The runtime value is always `"prefix-<uuid>"` — e.g. `"todo-550e8400-..."`.
 */
export type Id<Prefix extends string> = string & { __prefix: Prefix };

/**
 * Generate a prefixed UUID using `uuid.v4()`.
 *
 * @param prefix - The entity name (e.g. `"todo"`). The hyphen is inserted automatically.
 * @returns A typed branded ID string like `"todo-550e8400-e29b-41d4-a716-446655440000"`.
 *
 * @example
 *   const todoId = generateId('todo'); // "todo-<uuid>" : Id<'todo'>
 */
export function generateId<Prefix extends string>(prefix: Prefix): Id<Prefix> {
  return `${prefix}-${uuidv4()}` as Id<Prefix>;
}

/**
 * Parse and validate a prefixed UUID string.
 *
 * Throws if the string does not start with `prefix-` or the UUID portion
 * is not a valid RFC 9562 UUID.
 *
 * @param prefix - The expected entity prefix (e.g. `"todo"`).
 * @param value  - The raw string to validate.
 * @returns The branded typed ID.
 *
 * @example
 *   const id = parseId('todo', req.params.todoId); // : Id<'todo'>
 */
export function parseId<Prefix extends string>(prefix: Prefix, value: string): Id<Prefix> {
  const expected = `${prefix}-`;
  if (typeof value !== 'string' || !value.startsWith(expected)) {
    throw new Error(`Invalid ${prefix} ID: expected "${expected}<uuid>"`);
  }
  const uuid = value.slice(expected.length);
  if (!uuidValidate(uuid)) {
    throw new Error(`Invalid ${prefix} ID: UUID portion is not a valid UUID`);
  }
  return value as Id<Prefix>;
}
