import { createTypeSpecLibrary, JSONSchemaType } from "@typespec/compiler";

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

export const $lib = createTypeSpecLibrary({
  name: "@typespec/http-low-level",
  diagnostics: {},
  emitter: {
    options: EmitterOptionsSchema as JSONSchemaType<HttpLowLevelOptions>,
  },
} as const);
export const { reportDiagnostic, createStateSymbol } = $lib;

export type OpenAPILibrary = typeof $lib;
