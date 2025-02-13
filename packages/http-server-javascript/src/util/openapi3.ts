/**
 * Attempts to import the OpenAPI 3 emitter if it is installed.
 *
 * @returns the OpenAPI 3 emitter module or undefined
 */
export function getOpenApi3Emitter(): Promise<typeof import("@typespec/openapi3") | undefined> {
  return import("@typespec/openapi3").catch(() => undefined);
}
