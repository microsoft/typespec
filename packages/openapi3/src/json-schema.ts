export type JsonSchemaModule = typeof import("@typespec/json-schema");

export async function resolveJsonSchemaModule(): Promise<JsonSchemaModule | undefined> {
  try {
    return await import("@typespec/json-schema");
  } catch {
    return undefined;
  }
}
