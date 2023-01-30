import { createCadlLibrary, JSONSchemaType } from "@cadl-lang/compiler";

export type FileType = "yaml" | "json";
export type Int64Strategy = "string" | "number";

export interface JSONSchemaEmitterOptions {
  /**
   * If the content should be serialized as YAML or JSON.
   * @default yaml, it not specified infer from the `output-file` extension
   */
  "file-type"?: FileType;

  /**
   * How to handle 64 bit integers on the wire. Options are:
   *
   * * string: serialize as a string (widely interoperable)
   * * number: serialize as a number (not widely interoperable)
   */
  "int64-strategy"?: Int64Strategy;
}

const EmitterOptionsSchema: JSONSchemaType<JSONSchemaEmitterOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    "file-type": { type: "string", enum: ["yaml", "json"], nullable: true },
    "int64-strategy": { type: "string", enum: ["string", "number"], nullable: true },
  },
  required: [],
};

export const libDef = {
  name: "@cadl-lang/json-schema",
  diagnostics: {},
} as const;

export const $lib = createCadlLibrary(libDef);
export const { reportDiagnostic, createStateSymbol } = $lib;

export type JsonSchemaLibrary = typeof $lib;
