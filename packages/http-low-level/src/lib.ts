import { createCadlLibrary, JSONSchemaType } from "@cadl-lang/compiler";

export interface HttpLowLevelOptions {
  "ignore-docs"?: boolean;
}

const EmitterOptionsSchema: JSONSchemaType<HttpLowLevelOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    "ignore-docs": {
      type: "boolean",
      nullable: true,
    },
  },
  required: [],
};

export const $lib = createCadlLibrary({
  name: "@cadl-lang/http-low-level",
  diagnostics: {},
  emitter: {
    options: EmitterOptionsSchema as JSONSchemaType<HttpLowLevelOptions>,
  },
} as const);
export const { reportDiagnostic, createStateSymbol } = $lib;

export type OpenAPILibrary = typeof $lib;
