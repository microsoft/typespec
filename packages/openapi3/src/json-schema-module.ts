import { Program, Type } from "@typespec/compiler";
import { CommonOpenAPI3Schema } from "./types.js";

export interface JsonSchemaModule {
  attachJsonSchemaObject(
    applyConstraint: (fn: (p: Program, t: Type) => any, key: keyof CommonOpenAPI3Schema) => void,
  ): void;
}

export async function resolveJsonSchemaModule(): Promise<JsonSchemaModule | undefined> {
  const jsonSchema = await tryImportJsonSchema();
  if (jsonSchema === undefined) return undefined;

  return {
    attachJsonSchemaObject: (applyConstraint: any) => {
      applyConstraint(jsonSchema.getContentEncoding, "contentEncoding");
      applyConstraint(jsonSchema.getContentMediaType, "contentMediaType");
    },
  };

  async function tryImportJsonSchema(): Promise<
    typeof import("@typespec/json-schema") | undefined
  > {
    try {
      const module = await import("@typespec/json-schema");
      return module;
    } catch {
      return undefined;
    }
  }
}
